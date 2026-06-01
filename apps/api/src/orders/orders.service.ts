import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import * as crypto from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { CartService } from "../cart/cart.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { VerifyPaymentDto } from "./dto/verify-payment.dto";

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService
  ) {}

  async create(patientId: string, dto: CreateOrderDto) {
    // 1. Fetch patient cart
    const cartRes = await this.cartService.getOrCreateCart(patientId);
    const cart = cartRes.data;

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException("Cart is empty");
    }

    // 2. Calculate prices
    let subtotal = 0;
    let discount = 0;
    const testTypes: string[] = [];

    for (const item of cart.items) {
      if (item.test) {
        const p = item.test.price;
        const dp = item.test.discountPrice ?? p;
        subtotal += p;
        discount += (p - dp);
        testTypes.push(item.test.name);
      } else if (item.package) {
        const p = item.package.price;
        const dp = item.package.discountPrice ?? p;
        subtotal += p;
        discount += (p - dp);
        testTypes.push(item.package.name);
      }
    }

    // Load home collection charges from settings
    const chargeSetting = await this.prisma.systemSetting.findUnique({
      where: { key: "home_collection_charges" }
    });
    const homeCollectionCharges = chargeSetting ? parseFloat(chargeSetting.value) : 150;

    const total = subtotal - discount + homeCollectionCharges;

    // 3. Create pending Order in DB
    const orderMetadata = {
      patientName: dto.patientName,
      patientAge: dto.patientAge,
      patientGender: dto.patientGender,
      patientPhone: dto.patientPhone,
      address: dto.address,
      pincode: dto.pincode,
      slot: dto.slot,
      testTypes,
      breakdown: {
        subtotal,
        discount,
        homeCollectionCharges,
        total
      }
    };

    let order = await this.prisma.order.create({
      data: {
        patientId,
        totalAmount: total,
        paymentStatus: "pending",
        items: orderMetadata as any
      }
    });

    // 4. Trigger Razorpay Order creation (or fallback to mock)
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    let rzpOrderId: string | null = null;

    if (keyId && keySecret && !keyId.startsWith("rzp_test_mock")) {
      try {
        const res = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64")
          },
          body: JSON.stringify({
            amount: Math.round(total * 100),
            currency: "INR",
            receipt: order.id
          })
        });
        const rzpData = await res.json();
        if (rzpData && rzpData.id) {
          rzpOrderId = rzpData.id;
        }
      } catch (err) {
        console.error("Failed to create Razorpay order, falling back to mock", err);
      }
    }

    if (!rzpOrderId) {
      rzpOrderId = `order_mock_${Math.random().toString(36).substring(7)}`;
    }

    // Update order with paymentId (storing the Razorpay order ID)
    order = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentId: rzpOrderId
      }
    });

    return {
      success: true,
      data: {
        orderId: order.id,
        paymentId: rzpOrderId, // Razorpay order ID
        amount: total,
        keyId: keyId ?? "rzp_test_mockkeyid123",
        patientDetails: dto
      },
      message: "Order initialized"
    };
  }

  async verifyPayment(dto: VerifyPaymentDto) {
    const rzpOrderId = dto.razorpay_order_id ?? dto.orderId;
    if (!rzpOrderId) {
      throw new BadRequestException("Missing Razorpay order ID");
    }

    const order = await this.prisma.order.findFirst({
      where: { paymentId: rzpOrderId }
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    if (order.paymentStatus === "paid") {
      return {
        success: true,
        data: order,
        message: "Payment already verified"
      };
    }

    // Verify signature if keys are present and it's not a mock order
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (
      keyId &&
      keySecret &&
      !keyId.startsWith("rzp_test_mock") &&
      dto.razorpay_payment_id &&
      dto.razorpay_signature
    ) {
      const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(rzpOrderId + "|" + dto.razorpay_payment_id)
        .digest("hex");

      if (generatedSignature !== dto.razorpay_signature) {
        throw new BadRequestException("Invalid payment signature");
      }
    }

    // Get default admin for appointment
    const defaultAdmin = await this.prisma.user.findFirst({
      where: { role: "admin" }
    });
    if (!defaultAdmin) {
      throw new BadRequestException("No admin user found to assign appointment");
    }

    const metadata = order.items as any;

    // Create Appointment
    const appointment = await this.prisma.appointment.create({
      data: {
        patientId: order.patientId,
        adminId: defaultAdmin.id,
        address: metadata.address,
        slot: metadata.slot,
        testTypes: metadata.testTypes || [],
        status: "pending",
        notes: `Website Order: ${order.id}. Patient: ${metadata.patientName}, Age: ${metadata.patientAge}, Gender: ${metadata.patientGender}`
      }
    });

    // Update Order to paid
    const updatedOrder = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "paid",
        appointmentId: appointment.id
      }
    });

    // Clear Patient's Cart
    await this.cartService.clearCart(order.patientId);

    return {
      success: true,
      data: updatedOrder,
      message: "Payment verified and appointment created"
    };
  }

  async findMine(patientId: string) {
    const orders = await this.prisma.order.findMany({
      where: { patientId },
      include: {
        appointment: {
          include: {
            employee: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return {
      success: true,
      data: orders,
      message: "Patient orders retrieved"
    };
  }

  async findAll() {
    const orders = await this.prisma.order.findMany({
      include: {
        patient: true,
        appointment: {
          include: {
            employee: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return {
      success: true,
      data: orders,
      message: "All orders retrieved"
    };
  }
}
