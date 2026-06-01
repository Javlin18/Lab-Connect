import type { UserRecord } from "@/types/domain";

import { apiFetch } from "./client";

export function listUsers(role?: UserRecord["role"]) {
  const params = new URLSearchParams();

  if (role) {
    params.set("role", role);
  }

  return apiFetch<UserRecord[]>(`/users${params.size ? `?${params.toString()}` : ""}`);
}
