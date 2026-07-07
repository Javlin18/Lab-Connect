"use client";

import { apiFetch } from "./client";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  status: "present" | "absent";
  checkInAt: string | null;
  selfieUrl: string | null;
  note: string | null;
  createdAt: string;
  employee?: {
    id: string;
    user: { name: string; email: string };
    zone: string;
  };
}

export interface AttendanceSummaryItem {
  employeeId: string;
  employeeName: string;
  employeeZone: string;
  presentDays: number;
  absentDays: number;
  totalMarked: number;
}

/** Admin: get all attendance records filtered by date or month */
export async function getAllAttendance(date?: string, month?: string) {
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  if (month) params.set("month", month);
  const q = params.toString() ? `?${params}` : "";
  return apiFetch<AttendanceRecord[]>(`/attendance${q}`);
}

/** Admin: mark an employee absent and auto-reassign their appointments */
export async function markAbsent(
  employeeId: string,
  date: string,
  note?: string
) {
  return apiFetch<{ attendance: AttendanceRecord; reassignedCount: number }>(
    "/attendance/mark-absent",
    {
      method: "POST",
      body: JSON.stringify({ employeeId, date, note }),
    }
  );
}

/** Admin: get monthly attendance summary per employee */
export async function getAttendanceSummary(month?: string) {
  const q = month ? `?month=${month}` : "";
  return apiFetch<AttendanceSummaryItem[]>(`/attendance/summary${q}`);
}
