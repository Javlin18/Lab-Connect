import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import * as crypto from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { CartService } from "../cart/cart.service";
import { AutoAssignService } from "../appointments/auto-assign.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { VerifyPaymentDto } from "./dto/verify-payment.dto";

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    private readonly autoAssignService: AutoAssignService
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

    const paymentType = dto.paymentType ?? "online_prepaid";

    let order = await this.prisma.order.create({
      data: {
        patientId,
        totalAmount: total,
        paymentStatus: paymentType === "pay_on_collection" ? "pending" : "pending",
        paymentType,
        items: orderMetadata as any
      }
    });

    // For pay_on_collection: create appointment immediately without Razorpay
    if (paymentType === "pay_on_collection") {
      const defaultAdmin = await this.prisma.user.findFirst({ where: { role: "admin" } });
      if (!defaultAdmin) throw new BadRequestException("No admin user found");

      // Auto-assign employee
      const slotDate = orderMetadata.slot?.slice(0, 10) ?? "";
      const assignedEmployeeId = await this.autoAssignService.findAvailableEmployee(slotDate, orderMetadata.slot ?? "");

      const appointment = await this.prisma.appointment.create({
        data: {
          patientId,
          adminId: defaultAdmin.id,
          employeeId: assignedEmployeeId,
          address: orderMetadata.address,
          slot: orderMetadata.slot,
          testTypes: orderMetadata.testTypes || [],
          status: assignedEmployeeId ? "assigned" : "pending",
          notes: `Pay on Collection Order: ${order.id}. Patient: ${orderMetadata.patientName}, Age: ${orderMetadata.patientAge}, Gender: ${orderMetadata.patientGender}`
        }
      });

      order = await this.prisma.order.update({
        where: { id: order.id },
        data: { appointmentId: appointment.id, paymentId: `poc_${order.id}` }
      });

      await this.cartService.clearCart(patientId);

      return {
        success: true,
        data: {
          orderId: order.id,
          paymentId: order.paymentId,
          amount: total,
          keyId: "",
          paymentType,
          patientDetails: dto
        },
        message: "Order created (pay on collection)"
      };
    }

    // Normal online prepaid flow — Razorpay
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
          body: JSON.stringify({ amount: Math.round(total * 100), currency: "INR", receipt: order.id })
        });
        const rzpData = await res.json();
        if (rzpData?.id) rzpOrderId = rzpData.id;
      } catch (err) {
        console.error("Razorpay fallback", err);
      }
    }

    if (!rzpOrderId) rzpOrderId = `order_mock_${Math.random().toString(36).substring(7)}`;

    order = await this.prisma.order.update({
      where: { id: order.id },
      data: { paymentId: rzpOrderId }
    });

    return {
      success: true,
      data: {
        orderId: order.id,
        paymentId: rzpOrderId,
        amount: total,
        keyId: keyId ?? "rzp_test_mockkeyid123",
        paymentType,
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

    // Auto-assign employee
    const slotDate = metadata.slot?.slice(0, 10) ?? "";
    const assignedEmployeeId = await this.autoAssignService.findAvailableEmployee(slotDate, metadata.slot ?? "");

    // Create Appointment
    const appointment = await this.prisma.appointment.create({
      data: {
        patientId: order.patientId,
        adminId: defaultAdmin.id,
        employeeId: assignedEmployeeId,
        address: metadata.address,
        slot: metadata.slot,
        testTypes: metadata.testTypes || [],
        status: assignedEmployeeId ? "assigned" : "pending",
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
