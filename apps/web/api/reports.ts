"use client";

import type { TestResult } from "@lab-app/shared";

import { apiFetch } from "./client";

export async function uploadReport(appointmentId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiFetch<TestResult>(`/reports/${appointmentId}/upload`, {
    method: "POST",
    body: formData
  });
}

export async function getReport(appointmentId: string) {
  const response = await apiFetch<{ downloadUrl: string; report: TestResult }>(`/reports/${appointmentId}`);
  if (response.data?.downloadUrl?.startsWith("/")) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
    const baseUrl = apiUrl.replace(/\/api$/, "");
    response.data.downloadUrl = `${baseUrl}${response.data.downloadUrl}`;
  }
  return response;
}
