import { useAuthStore } from "@/store/auth-store";

import { API_URL } from "@/lib/env";

export type ApiResponse<T> = {
  data: T;
  message: string;
  success: boolean;
};

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | FormData | Record<string, unknown> | null;
  token?: string;
};

export async function apiFetch<T>(path: string, init: RequestOptions = {}) {
  const token = init.token ?? useAuthStore.getState().token;
  const headers = new Headers(init.headers);
  const isFormData = init.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const body = (
    init.body && !isFormData && typeof init.body !== "string"
      ? JSON.stringify(init.body)
      : init.body
  ) as BodyInit | null | undefined;

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    body,
    headers
  });

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message ?? "Request failed");
  }

  return payload;
}
