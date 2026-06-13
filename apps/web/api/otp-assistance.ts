"use client";

import { apiFetch } from "./client";

export type OtpAssistanceStatus = "pending" | "approved" | "rejected" | "verified_by_admin";

export interface OtpAssistanceAuditLog {
  id: string;
  action: string;
  reason?: string | null;
  actorName: string;
  actorRole: string;
  employeeName?: string | null;
  createdAt: string;
}

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
  auditLogs: OtpAssistanceAuditLog[];
}

export function listOtpAssistanceRequests() {
  return apiFetch<OtpAssistanceRequest[]>("/otp-assistance");
}

export function viewOtpAssistanceOtp(id: string) {
  return apiFetch<{ otp: string | null; expiresAt: string | null }>(`/otp-assistance/${id}/otp`);
}

export function resendOtpAssistanceOtp(id: string, reason?: string) {
  return apiFetch<OtpAssistanceRequest>(`/otp-assistance/${id}/resend-otp`, {
    method: "PUT",
    body: JSON.stringify({ reason }),
  });
}

export function shareOtpAssistanceOtp(id: string, reason?: string) {
  return apiFetch<OtpAssistanceRequest>(`/otp-assistance/${id}/share-otp`, {
    method: "PUT",
    body: JSON.stringify({ reason }),
  });
}

export function approveOtpAssistance(id: string, reason?: string) {
  return apiFetch<OtpAssistanceRequest>(`/otp-assistance/${id}/approve`, {
    method: "PUT",
    body: JSON.stringify({ reason }),
  });
}

export function forceVerifyOtpAssistance(id: string, reason?: string) {
  return apiFetch<OtpAssistanceRequest>(`/otp-assistance/${id}/force-verify`, {
    method: "PUT",
    body: JSON.stringify({ reason }),
  });
}

export function rejectOtpAssistance(id: string, reason?: string) {
  return apiFetch<OtpAssistanceRequest>(`/otp-assistance/${id}/reject`, {
    method: "PUT",
    body: JSON.stringify({ reason }),
  });
}
