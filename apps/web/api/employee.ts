"use client";

import type { Appointment } from "@lab-app/shared";

import { apiFetch } from "./client";

export async function getAssignedAppointments() {
  return apiFetch<Appointment[]>("/appointments/assigned");
}

export async function getAvailableAppointments() {
  return apiFetch<Appointment[]>("/appointments/available");
}

export async function claimAppointment(id: string) {
  return apiFetch<Appointment>(`/appointments/${id}/claim`, {
    method: "PUT"
  });
}

export async function acceptAppointment(id: string) {
  return apiFetch<Appointment>(`/appointments/${id}/accept`, {
    method: "PUT"
  });
}

export async function updateAppointmentStatus(
  id: string,
  input: {
    collectedAt?: string;
    collectionNotes?: string;
    sampleId?: string;
    status: Appointment["status"];
  }
) {
  return apiFetch<Appointment>(`/appointments/${id}/status`, {
    method: "PUT",
    body: JSON.stringify(input)
  });
}
