import { Injectable } from "@nestjs/common";
import Razorpay from "razorpay";
import * as crypto from "crypto";

@Injectable()
export class PaymentsService {
  private razorpay: Razorpay;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!
    });
  }

  // Step 1: Create Razorpay order (called when patient clicks Pay)
  async createOrder(amount: number, orderId: string, patientPhone: string) {
    const razorpayOrder = await this.razorpay.orders.create({
      amount: Math.round(amount * 100), // paise — ₹299 = 29900
      currency: "INR",
      receipt: `order_${orderId}`,
      notes: {
        orderId,
        source: "lab-app"
      }
    });
    return {
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    };
  }

  // Step 2: Verify payment signature (called after patient pays)
  verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ) {
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");
    return expectedSignature === razorpaySignature;
  }

  // Step 3: Create payment link for QR code (pay after collection)
  async createPaymentLink(
    amount: number,
    orderId: string,
    patientName: string,
    patientPhone: string
  ) {
    const paymentLink = await this.razorpay.paymentLink.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      description: `Lab Test Payment - Order #${orderId}`,
      customer: {
        name: patientName,
        contact: patientPhone
      },
      notify: { sms: false, email: false },
      reminder_enable: false,
      notes: { orderId }
    });
    return {
      paymentLinkId: paymentLink.id,
      paymentUrl: paymentLink.short_url // becomes QR code content
    };
  }

  // Step 4: Check payment link status (poll for QR payment)
  async getPaymentLinkStatus(paymentLinkId: string) {
    const link = await this.razorpay.paymentLink.fetch(paymentLinkId);
    return {
      status: link.status, // 'created' | 'paid' | 'cancelled' | 'expired'
      paidAt: link.updated_at,
      amount: (link.amount as number) / 100
    };
  }

  // Step 5: Refund a payment
  async refundPayment(paymentId: string, amount?: number) {
    const refund = await this.razorpay.payments.refund(paymentId, {
      amount: amount ? Math.round(amount * 100) : undefined,
      notes: { reason: "Customer requested refund" }
    } as any);
    return refund;
  }

  // Step 6: Verify Razorpay webhook signature
  verifyWebhookSignature(body: string, signature: string) {
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex");
    return expectedSignature === signature;
  }
}
