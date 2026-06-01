import type { User } from "@lab-app/shared";

import { PUSH_TOKEN_PATH } from "@/lib/env";
import type { EmployeeRecord, LoginResponse } from "@/types/domain";

import { apiFetch } from "./client";

export function login(input: { password: string; phone: string }) {
  return apiFetch<LoginResponse>("/auth/login", {
    body: input,
    method: "POST"
  });
}

export function registerPatient(input: {
  email: string;
  name: string;
  password: string;
  phone: string;
}) {
  return apiFetch<User>("/auth/register", {
    body: input,
    method: "POST"
  });
}

export function registerEmployee(input: {
  email: string;
  name: string;
  password: string;
  phone: string;
  zone?: string;
}) {
  return apiFetch<EmployeeRecord>("/auth/register-employee", {
    body: input,
    method: "POST"
  });
}

export function sendOtp(phone: string) {
  return apiFetch<{ phone: string }>("/auth/send-otp", {
    body: { phone },
    method: "POST"
  });
}

export function verifyOtp(input: { otp: string; phone: string }) {
  return apiFetch<{ verified: boolean }>("/auth/verify-otp", {
    body: input,
    method: "POST"
  });
}

export async function saveDeviceToken(token: string) {
  try {
    return await apiFetch<{ saved: boolean }>(PUSH_TOKEN_PATH, {
      body: {
        platform: "android",
        token
      },
      method: "POST"
    });
  } catch {
    return null;
  }
}
