"use client";

import { getSession } from "next-auth/react";

import { useAuthStore } from "@/store/auth-store";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export async function apiFetch<T>(
  path: string,
  init: RequestInit & {
    token?: string;
  } = {}
) {
  const storeToken = useAuthStore.getState().token;
  const session = !init.token && !storeToken ? await getSession() : null;
  const token = init.token ?? storeToken ?? session?.accessToken;
  const headers = new Headers(init.headers);

  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store"
  });

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message ?? "Request failed");
  }

  return payload;
}
