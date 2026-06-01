import { apiFetch } from "./client";
import type { Appointment } from "@lab-app/shared";

export async function getAssignedAppointments() {
  return apiFetch<Appointment[]>("/appointments/assigned");
}

export async function acceptAppointment(id: string) {
  return apiFetch<Appointment>(`/appointments/${id}/accept`, {
    method: "PUT",
  });
}

export async function updateStatus(
  id: string,
  status: "en_route" | "collected",
  data?: {
    sampleId?: string;
    collectionNotes?: string;
    collectedAt?: string;
  }
) {
  return apiFetch<Appointment>(`/appointments/${id}/status`, {
    method: "PUT",
    body: { status, ...data },
  });
}

export async function updateLocation(lat: number, lng: number) {
  return apiFetch<{ updated: boolean }>("/employees/me/location", {
    method: "PUT",
    body: { latitude: lat, longitude: lng, isAvailable: true },
  });
}

export async function registerFCMToken(token: string) {
  return apiFetch<{ saved: boolean }>("/employees/fcm-token", {
    method: "POST",
    body: { token },
  });
}

export async function getHistory(period: "today" | "week" | "month") {
  return apiFetch<Appointment[]>(
    `/appointments/assigned?status=collected&period=${period}`
  );
}

export async function sendOTP(phone: string) {
  return apiFetch<{ phone: string }>("/auth/send-otp", {
    method: "POST",
    body: { phone },
  });
}

export async function verifyOTP(phone: string, otp: string) {
  return apiFetch<{ verified: boolean }>("/auth/verify-otp", {
    method: "POST",
    body: { phone, otp },
  });
}
