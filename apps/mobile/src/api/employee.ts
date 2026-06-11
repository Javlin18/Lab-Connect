import { apiFetch } from "./client";
import type { Appointment } from "@lab-app/shared";

export async function getAssignedAppointments() {
  return apiFetch<Appointment[]>("/appointments/assigned");
}

export async function getAvailableAppointments() {
  return apiFetch<Appointment[]>("/appointments/available");
}

export async function acceptAppointment(id: string) {
  return apiFetch<Appointment>(`/appointments/${id}/accept`, {
    method: "PUT"
  });
}

export async function claimAppointment(id: string) {
  return apiFetch<Appointment>(`/appointments/${id}/claim`, {
    method: "PUT"
  });
}

export async function updateStatus(
  id: string,
  status: "en_route" | "collected",
  data?: { sampleId?: string; collectionNotes?: string; collectedAt?: string }
) {
  return apiFetch<Appointment>(`/appointments/${id}/status`, {
    method: "PUT",
    body: { status, ...data }
  });
}

export async function updateLocation(lat: number, lng: number) {
  return apiFetch<any>("/employees/me/location", {
    method: "PUT",
    body: { latitude: lat, longitude: lng, isAvailable: true }
  });
}

export async function registerFCMToken(token: string) {
  return apiFetch<any>("/employees/fcm-token", {
    method: "POST",
    body: { token }
  });
}

export async function getHistory(period: string) {
  // Mock filter based on status === collected
  const res = await getAssignedAppointments();
  return {
    ...res,
    data: res.data.filter((app) => app.status === "completed" || (app.status as string) === "collected")
  };
}

export async function sendOTP(phone: string) {
  return apiFetch<any>("/auth/send-otp", {
    method: "POST",
    body: { phone }
  });
}

export async function verifyOTP(phone: string, otp: string) {
  return apiFetch<any>("/auth/verify-otp", {
    method: "POST",
    body: { phone, otp }
  });
}
