import { apiFetch } from "./client";
import type { Order } from "@lab-app/shared";

export async function createOrder(data: {
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientPhone: string;
  address: string;
  pincode: string;
  slot: string;
  paymentType?: "online_prepaid" | "pay_on_collection";
}) {
  return apiFetch<{
    orderId: string;
    paymentId: string;
    amount: number;
    keyId: string;
    paymentType: string;
    patientDetails: typeof data;
  }>("/orders", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function verifyPayment(data: {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  orderId?: string;
  status?: string;
}) {
  return apiFetch<Order>("/orders/verify-payment", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function listMyOrders() {
  return apiFetch<Order[]>("/orders/mine");
}

export async function listAllOrders() {
  return apiFetch<Order[]>("/orders");
}
