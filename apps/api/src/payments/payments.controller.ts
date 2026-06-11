import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Public } from "../common/decorators/public.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import { OrdersService } from "../orders/orders.service";
import { UsersService } from "../users/users.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PaymentsService } from "./payments.service";

@ApiTags("Payments")
@ApiBearerAuth()
@Controller("payments")
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly ordersService: OrdersService,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService
  ) {}

  // Called by frontend when patient clicks Pay Now
  @Roles("patient", "admin")
  @Post("create-order")
  async createOrder(
    @Body() body: { orderId: string; amount: number },
    @CurrentUser() user: AuthenticatedUser
  ) {
    const patient = await this.usersService.findById(user.sub);
    const data = await this.paymentsService.createOrder(
      body.amount,
      body.orderId,
      patient.phone
    );

    return {
      success: true,
      data,
      message: "Payment order created"
    };
  }

  // Called by frontend after Razorpay payment popup closes successfully
  @Roles("patient", "admin")
  @Post("verify-payment")
  async verifyPayment(
    @Body()
    body: {
      orderId: string;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    },
    @CurrentUser() user: AuthenticatedUser
  ) {
    const isValid = this.paymentsService.verifyPayment(
      body.razorpayOrderId,
      body.razorpayPaymentId,
      body.razorpaySignature
    );
    if (!isValid) {
      throw new BadRequestException(
        "Payment verification failed — invalid signature"
      );
    }

    await this.ordersService.confirmPaidOrder(body.orderId, {
      razorpayOrderId: body.razorpayOrderId,
      razorpayPaymentId: body.razorpayPaymentId,
      paymentMethod: "online"
    });

    await this.notificationsService.createNotification(
      user.sub,
      "Payment Confirmed ✓",
      "Your payment has been received. Booking confirmed!",
      "payment"
    );

    return { success: true, message: "Payment verified successfully" };
  }

  // Called by employee app to generate QR payment link
  @Roles("employee", "admin")
  @Post("create-payment-link")
  async createPaymentLink(
    @Body() body: { orderId: string }
  ) {
    const order = await this.ordersService.findById(body.orderId);
    const patient = await this.usersService.findById(order.patientId);
    const result = await this.paymentsService.createPaymentLink(
      order.totalAmount,
      order.id,
      patient.name,
      patient.phone
    );

    await this.ordersService.savePaymentLink(body.orderId, {
      paymentLinkId: result.paymentLinkId,
      paymentLinkUrl: result.paymentUrl
    });

    return {
      success: true,
      data: result,
      message: "Payment link created"
    };
  }

  // Polled by employee app to check if QR payment completed
  @Roles("employee", "admin")
  @Get("payment-link-status/:paymentLinkId")
  async getPaymentLinkStatus(
    @Param("paymentLinkId") paymentLinkId: string
  ) {
    const data = await this.paymentsService.getPaymentLinkStatus(paymentLinkId);
    return {
      success: true,
      data,
      message: "Payment link status fetched"
    };
  }

  // Razorpay webhook — called by Razorpay servers automatically
  // NO auth guard — Razorpay calls this directly
  @Public()
  @Post("webhook")
  async handleWebhook(
    @Req() req: any,
    @Headers("x-razorpay-signature") signature: string
  ) {
    const rawBody = JSON.stringify(req.body);
    const isValid = this.paymentsService.verifyWebhookSignature(
      rawBody,
      signature
    );

    if (!isValid) {
      throw new BadRequestException("Invalid webhook signature");
    }

    const event = req.body.event;

    if (event === "payment.captured") {
      const payment = req.body.payload.payment.entity;
      const orderId = payment.notes?.orderId;
      if (orderId) {
        await this.ordersService.markAsPaid(orderId, {
          razorpayPaymentId: payment.id,
          paidAt: new Date(),
          paymentStatus: "paid",
          paymentMethod: "online"
        });
      }
    }

    if (event === "payment_link.paid") {
      const paymentLink = req.body.payload.payment_link.entity;
      const orderId = paymentLink.notes?.orderId;
      if (orderId) {
        await this.ordersService.markAsPaid(orderId, {
          paymentStatus: "paid",
          paidAt: new Date(),
          paymentMethod: "online"
        });

        const order = await this.ordersService.findById(orderId);
        if (order.employeeId) {
          await this.notificationsService.createNotification(
            order.employeeId,
            "Payment Received ✓",
            `Patient has paid ₹${paymentLink.amount / 100} for Order #${orderId}`,
            "payment"
          );
        }
      }
    }

    if (event === "refund.created") {
      const refund = req.body.payload.refund.entity;
      const orderId = refund.notes?.orderId;
      if (orderId) {
        await this.ordersService.updatePaymentStatus(orderId, "refunded");
      }
    }

    return { received: true };
  }

  // Admin only — issue refund
  @Roles("admin")
  @Post("refund")
  async refundPayment(
    @Body() body: { paymentId: string; amount?: number; orderId: string }
  ) {
    const refund = await this.paymentsService.refundPayment(
      body.paymentId,
      body.amount
    );
    await this.ordersService.updatePaymentStatus(body.orderId, "refunded");
    return {
      success: true,
      data: { refundId: (refund as any).id },
      message: "Refund issued"
    };
  }
  // Employee marks payment as collected (cash or manual UPI)
  @Roles("employee")
  @Post("manual-confirm")
  async manualConfirm(
    @Body() body: { orderId: string; method: 'upi_manual' | 'cash'; transactionId?: string },
    @CurrentUser() user: AuthenticatedUser
  ) {
    const order = await this.ordersService.findById(body.orderId);

    // Verify this employee owns the appointment
    if (order.employeeId !== user.sub) {
      throw new BadRequestException("This order is not assigned to you");
    }

    await this.ordersService.manualConfirm(body.orderId, body.method, body.transactionId);

    // Notify patient
    if (order.patientId) {
      await this.notificationsService.createNotification(
        order.patientId,
        "Payment Confirmed ✓",
        `Payment of ₹${order.totalAmount} confirmed. Thank you!`,
        "payment"
      );
    }

    // Notify admins
    const admins = await this.usersService.findByRole("admin");
    for (const admin of admins) {
      await this.notificationsService.createNotification(
        admin.id,
        "Payment Collected",
        `Payment collected for Order #${body.orderId.slice(0, 8)} — ₹${order.totalAmount} via ${body.method === 'cash' ? 'Cash' : 'Manual UPI'}`,
        "payment"
      );
    }

    return { success: true, message: "Payment confirmed" };
  }
}
