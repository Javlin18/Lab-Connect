"use client";

export interface RegisterPatientInput {
  email: string;
  name: string;
  password: string;
  phone: string;
}

import { apiFetch } from "./client";

export async function registerPatient(data: RegisterPatientInput) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(data)
  });
}
