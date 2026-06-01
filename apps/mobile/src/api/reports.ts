import type { ReportResponse } from "@/types/domain";

import { apiFetch } from "./client";

export function getReport(appointmentId: string) {
  return apiFetch<ReportResponse>(`/reports/${appointmentId}`);
}
