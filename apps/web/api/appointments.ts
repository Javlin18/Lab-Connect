"use client";

import type { Appointment } from "@lab-app/shared";

import { apiFetch } from "./client";

export interface AppointmentFilters {
  date?: string;
  employeeId?: string;
  status?: Appointment["status"];
}

export interface CreateAppointmentInput {
  address: string;
  employeeId?: string;
  notes?: string;
  patientId: string;
  slot: string;
  testTypes: string[];
}

export async function listAppointments(filters: AppointmentFilters = {}) {
  const params = new URLSearchParams();

  if (filters.date) {
    params.set("date", filters.date);
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.employeeId) {
    params.set("employeeId", filters.employeeId);
  }

  const query = params.toString();
  return apiFetch<Appointment[]>(`/appointments${query ? `?${query}` : ""}`);
}

export async function createAppointment(input: CreateAppointmentInput) {
  return apiFetch<Appointment>("/appointments", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function assignAppointment(id: string, employeeId: string) {
  return apiFetch<Appointment>(`/appointments/${id}/assign`, {
    method: "PUT",
    body: JSON.stringify({ employeeId })
  });
}

export async function completeAppointment(id: string, notes?: string) {
  return apiFetch<Appointment>(`/appointments/${id}/complete`, {
    method: "PUT",
    body: JSON.stringify({ notes })
  });
}

export async function getAppointmentById(id: string) {
  const response = await listAppointments();
  const appointment = response.data.find((item) => item.id === id);

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  return {
    success: true,
    data: appointment,
    message: "Appointment fetched"
  };
}
