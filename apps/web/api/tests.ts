import { apiFetch } from "./client";
import type { Test } from "@lab-app/shared";

export async function listTests(admin = false) {
  return apiFetch<Test[]>(`/tests${admin ? "?admin=true" : ""}`);
}

export async function getTestBySlug(slug: string) {
  return apiFetch<Test>(`/tests/${slug}`);
}

export async function createTest(data: Omit<Test, "id" | "createdAt">) {
  return apiFetch<Test>("/tests", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function updateTest(id: string, data: Partial<Test>) {
  return apiFetch<Test>(`/tests/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export async function deleteTest(id: string) {
  return apiFetch<{ id: string }>(`/tests/${id}`, {
    method: "DELETE"
  });
}
