import { apiFetch } from "./client";

export type OtpAssistanceStatus = "pending" | "approved" | "rejected" | "verified_by_admin";

export interface OtpAssistanceRequest {
  id: string;
  appointmentId: string;
  orderId: string | null;
  bookingId: string;
  patientName: string;
  bookingOwnerName: string;
  employeeName: string;
  collectionLocation: string;
  reason: string;
  status: OtpAssistanceStatus;
  requestedAt: string;
  resolvedAt?: string | null;
  adminName?: string | null;
  adminReason?: string | null;
  otpShared?: string | null;
}

export function createOtpAssistanceRequest(input: { appointmentId: string; reason: string }) {
  return apiFetch<OtpAssistanceRequest>("/otp-assistance", {
    method: "POST",
    body: input
  });
}

export function listOtpAssistanceRequests(appointmentId: string) {
  return apiFetch<OtpAssistanceRequest[]>(`/otp-assistance?appointmentId=${appointmentId}`);
}
