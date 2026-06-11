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

export type OrderData = {
  id: string;
  patientId: string;
  totalAmount: number;
  paymentStatus: string;
  paymentType: string;
  paymentLinkId?: string | null;
  paymentLinkUrl?: string | null;
  razorpayPaymentId?: string | null;
  paidAt?: string | null;
  paymentMethod?: string | null;
  manualTransactionId?: string | null;
  appointmentId?: string | null;
  patient?: { id: string; name: string; phone: string } | null;
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

// Fetch single order by ID (employee payment screen)
export function getOrder(orderId: string) {
  return apiFetch<OrderData>(`/orders/${orderId}`);
}

// Employee manually confirms payment (cash or UPI ref)
export function manualConfirmPayment(data: {
  orderId: string;
  method: "upi_manual" | "cash";
  transactionId?: string;
}) {
  return apiFetch<{ success: boolean }>("/payments/manual-confirm", {
    method: "POST",
    body: data
  });
}
