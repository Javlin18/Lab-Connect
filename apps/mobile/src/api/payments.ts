import { apiFetch } from "@/api/client";

export type RazorpayOrderResponse = {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
};

export type VerifyPaymentResponse = {
  success: boolean;
  message: string;
};

export type PaymentLinkResponse = {
  paymentLinkId: string;
  paymentUrl: string;
};

export type PaymentLinkStatus = {
  status: "created" | "paid" | "cancelled" | "expired";
  paidAt: string;
  amount: number;
};

// Create Razorpay order (called before opening native checkout)
export function createPaymentOrder(data: { orderId: string; amount: number }) {
  return apiFetch<RazorpayOrderResponse>("/payments/create-order", {
    method: "POST",
    body: data
  });
}

// Verify payment signature after native checkout completes
export function verifyRazorpayPayment(data: {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  return apiFetch<VerifyPaymentResponse>("/payments/verify-payment", {
    method: "POST",
    body: data
  });
}

// Create QR payment link (employee collects at doorstep)
export function createQRPaymentLink(orderId: string) {
  return apiFetch<PaymentLinkResponse>("/payments/create-payment-link", {
    method: "POST",
    body: { orderId }
  });
}

// Poll QR payment status
export function checkQRPaymentStatus(paymentLinkId: string) {
  return apiFetch<PaymentLinkStatus>(
    `/payments/payment-link-status/${paymentLinkId}`
  );
}
