"use client";
import { apiFetch } from "./client";

export type CallLog = {
  id: string;
  callSid: string;
  fromPhone: string;
  toPhone: string;
  patientId: string | null;
  employeeId: string | null;
  duration: number | null;
  status: string;
  createdAt: string;
  patientName: string | null;
  employeeName: string | null;
};

export function getCallLogs() {
  return apiFetch<CallLog[]>("/calls/logs");
}
