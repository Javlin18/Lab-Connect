import { apiFetch } from "./client";

export async function createRazorpayOrder(data: {
  orderId: string;
  amount: number;
}) {
  return apiFetch<{
    razorpayOrderId: string;
    amount: number;
    currency: string;
    keyId: string;
  }>("/payments/create-order", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function verifyRazorpayPayment(data: {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  return apiFetch<{ success: boolean; message: string }>(
    "/payments/verify-payment",
    {
      method: "POST",
      body: JSON.stringify(data)
    }
  );
}

export async function createPaymentLink(data: { orderId: string }) {
  return apiFetch<{ paymentLinkId: string; paymentUrl: string }>(
    "/payments/create-payment-link",
    {
      method: "POST",
      body: JSON.stringify(data)
    }
  );
}

export async function getPaymentLinkStatus(paymentLinkId: string) {
  return apiFetch<{
    status: "created" | "paid" | "cancelled" | "expired";
    paidAt: string;
    amount: number;
  }>(`/payments/payment-link-status/${paymentLinkId}`);
}
