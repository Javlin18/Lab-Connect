import type { Appointment } from "@lab-app/shared";

import { apiFetch } from "./client";

export function listAppointments(filters: {
  date?: string;
  employeeId?: string;
  status?: Appointment["status"];
} = {}) {
  const params = new URLSearchParams();

  if (filters.date) {
    params.set("date", filters.date);
  }

  if (filters.employeeId) {
    params.set("employeeId", filters.employeeId);
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  const query = params.toString();
  return apiFetch<Appointment[]>(`/appointments${query ? `?${query}` : ""}`);
}

export function getAppointment(id: string) {
  return apiFetch<Appointment>(`/appointments/${id}`);
}

export function getAssignedAppointments() {
  return apiFetch<Appointment[]>("/appointments/assigned");
}

export function getMyAppointments() {
  return apiFetch<Appointment[]>("/appointments/mine");
}

export function createAppointment(input: {
  address: string;
  employeeId?: string;
  notes?: string;
  patientId: string;
  slot: string;
  testTypes: string[];
}) {
  return apiFetch<Appointment>("/appointments", {
    body: input,
    method: "POST"
  });
}

export function assignAppointment(id: string, employeeId: string) {
  return apiFetch<Appointment>(`/appointments/${id}/assign`, {
    body: { employeeId },
    method: "PUT"
  });
}

export function acceptAppointment(id: string) {
  return apiFetch<Appointment>(`/appointments/${id}/accept`, {
    method: "PUT"
  });
}

export function updateAppointmentStatus(id: string, status: "en_route" | "collected") {
  return apiFetch<Appointment>(`/appointments/${id}/status`, {
    body: { status },
    method: "PUT"
  });
}

export function completeAppointment(id: string, notes?: string) {
  return apiFetch<Appointment>(`/appointments/${id}/complete`, {
    body: { notes },
    method: "PUT"
  });
}
