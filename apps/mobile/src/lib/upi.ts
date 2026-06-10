import { UPI_VPA } from "@/lib/env";

export function buildUpiLink(amount: number, orderId: string, patientName?: string) {
  const params = new URLSearchParams({
    pa: UPI_VPA,
    pn: patientName?.slice(0, 20) ?? "LabConnect",
    am: amount.toFixed(2),
    cu: "INR",
    tn: `Order ${orderId.slice(0, 8)}`
  });
  return `upi://pay?${params.toString()}`;
}
