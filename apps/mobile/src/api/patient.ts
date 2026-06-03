import { apiFetch } from "@/api/client";

export type Test = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number | null;
  category: string;
  sampleType: string;
  preparationInstructions?: string;
  parameters: string[];
  turnaroundHours: number;
};

export type HealthPackage = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number | null;
  tests: Test[];
};

export type Order = {
  id: string;
  items: any;
  totalAmount: number;
  paymentId?: string | null;
  paymentStatus: string;
  appointmentId?: string | null;
  appointment?: any;
  createdAt: string;
};

const qs = (params: Record<string, string | number | boolean | undefined>) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  return query.toString();
};

export async function getTests(params: { category?: string; search?: string; popular?: boolean; limit?: number } = {}) {
  const res = await apiFetch<Test[]>(`/tests${qs(params) ? `?${qs(params)}` : ""}`);
  let data = res.data;
  if (params.category && params.category !== "All") {
    data = data.filter((test) => test.category.toLowerCase().includes(params.category!.toLowerCase()));
  }
  if (params.search) {
    const needle = params.search.toLowerCase();
    data = data.filter((test) => `${test.name} ${test.description}`.toLowerCase().includes(needle));
  }
  if (params.limit) data = data.slice(0, params.limit);
  return { ...res, data };
}

export function getTestBySlug(slug: string) {
  return apiFetch<Test>(`/tests/${slug}`);
}

export async function getPackages(params: { limit?: number } = {}) {
  const res = await apiFetch<HealthPackage[]>("/packages");
  return { ...res, data: params.limit ? res.data.slice(0, params.limit) : res.data };
}

export async function getPackageBySlug(slug: string) {
  const res = await getPackages();
  const pkg = res.data.find((item) => item.slug === slug);
  if (!pkg) throw new Error("Package not found");
  return { ...res, data: pkg };
}

export async function addServerCartItem(item: { testId?: string; packageId?: string }) {
  return apiFetch("/cart/add", { method: "POST", body: item });
}

export function getAvailableSlots(date: string) {
  const slots = ["07:00 AM - 08:00 AM", "08:00 AM - 09:00 AM", "09:00 AM - 10:00 AM", "05:00 PM - 06:00 PM"];
  return Promise.resolve({ success: true, message: "Slots ready", data: slots.map((slot) => ({ slot, available: true, date })) });
}

export function createOrder(orderData: Record<string, unknown>) {
  return apiFetch<{ orderId: string; paymentId: string; amount: number; keyId: string }>("/orders", {
    method: "POST",
    body: orderData
  });
}

export function verifyPayment(paymentData: Record<string, unknown>) {
  return apiFetch<Order>("/orders/verify-payment", { method: "POST", body: paymentData });
}

export function getMyOrders(status?: string) {
  return apiFetch<Order[]>(`/orders/mine${status ? `?status=${status}` : ""}`);
}

export async function getOrderById(id: string) {
  const res = await getMyOrders();
  const order = res.data.find((item) => item.id === id);
  if (!order) throw new Error("Order not found");
  return { ...res, data: order };
}

export function getEmployeeLocation(employeeId: string) {
  return apiFetch<{ currentLocation: string }>(`/employees/${employeeId}/location`);
}

export function downloadReport(appointmentId: string) {
  return apiFetch<{ downloadUrl: string }>(`/reports/${appointmentId}`);
}
