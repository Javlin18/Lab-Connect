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

  // Called by frontend after PhonePe redirects back
  @Roles("patient", "admin")
  @Post("verify-payment")
  async verifyPayment(
    @Body()
    body: {
      orderId: string;
    },
    @CurrentUser() user: AuthenticatedUser
  ) {
    const result = await this.paymentsService.verifyPayment(
      body.orderId
    );
    
    if (!result.isValid) {
      throw new BadRequestException(
        "Payment verification failed — not completed"
      );
    }

    await this.ordersService.confirmPaidOrder(body.orderId, {
      razorpayOrderId: body.orderId, // storing in the same column for now
      razorpayPaymentId: result.phonepePaymentId,
      paymentMethod: "online"
    });

    await this.notificationsService.createNotification(
      user.sub,
      "Payment Confirmed",
      "Your payment has been received. Booking confirmed!",
      "payment"
    );

    return { success: true, message: "Payment verified successfully" };
  }

  // Called by employee app to generate payment link
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
      paymentLinkId: order.id,
      paymentLinkUrl: result.redirectUrl
    });

    return {
      success: true,
      data: {
        paymentLinkId: order.id,
        paymentUrl: result.redirectUrl
      },
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

  // PhonePe webhook — called by PhonePe servers automatically
  @Public()
  @Post("webhook")
  async handleWebhook(
    @Body() body: any,
    @Headers("x-verify") signature: string
  ) {
    const base64Payload = body?.response;
    if (!base64Payload || !signature) {
      throw new BadRequestException("Missing webhook signature or payload");
    }

    const isValid = this.paymentsService.verifyWebhookPayload(
      base64Payload,
      signature
    );

    if (!isValid) {
      throw new BadRequestException("Invalid webhook signature");
    }

    const payloadStr = Buffer.from(base64Payload, 'base64').toString('utf8');
    const data = JSON.parse(payloadStr);

    if (data.code === "PAYMENT_SUCCESS") {
      const orderId = data.data?.merchantTransactionId;
      if (orderId && !orderId.startsWith("REF-")) {
        await this.ordersService.markAsPaid(orderId, {
          razorpayPaymentId: data.data.transactionId,
          paidAt: new Date(),
          paymentStatus: "paid",
          paymentMethod: "online"
        });

        const order = await this.ordersService.findById(orderId);
        if (order.employeeId) {
          await this.notificationsService.createNotification(
            order.employeeId,
            "Payment Received",
            `Patient has paid ₹${data.data.amount / 100} for Order #${orderId}`,
            "payment"
          );
        }
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
      data: refund,
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
        "Payment Confirmed",
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
