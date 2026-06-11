"use client";

import { apiFetch } from "./client";

export interface RegisterPatientInput {
  email: string;
  name: string;
  password: string;
  phone: string;
}

export async function registerPatient(data: RegisterPatientInput) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function sendEmailOtp(email: string) {
  return apiFetch<{ email: string }>("/auth/send-email-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function verifyEmailOtp(email: string, otp: string) {
  return apiFetch<{ email: string; verified: boolean }>("/auth/verify-email-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });
}
