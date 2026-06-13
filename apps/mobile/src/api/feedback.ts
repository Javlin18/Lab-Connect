import { apiFetch } from "@/api/client";

export type PendingFeedback = {
  appointmentId: string;
  slot: string;
  status: string;
  employeeName: string | null;
};

export type CreateFeedbackPayload = {
  appointmentId: string;
  overallRating: number;
  woreGloves: boolean;
  woreMask: boolean;
  wasPunctual: boolean;
  wasProfessional: boolean;
  comment?: string;
};

export function submitFeedback(payload: CreateFeedbackPayload) {
  return apiFetch("/feedback", { method: "POST", body: payload });
}

export function getPendingFeedback() {
  return apiFetch<PendingFeedback[]>("/feedback/pending");
}
