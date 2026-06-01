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
  return apiFetch<{ downloadUrl: string; report: TestResult }>(`/reports/${appointmentId}`);
}
