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
}

/** Check in with a selfie (base64 data-url) */
export async function checkInAttendance(selfieUrl: string) {
  return apiFetch<AttendanceRecord>("/attendance/checkin", {
    method: "POST",
    body: { selfieUrl },
  });
}

/** Get today's attendance status */
export async function getTodayAttendance() {
  return apiFetch<AttendanceRecord | null>("/attendance/today");
}

/** Get own attendance history for a month (YYYY-MM) */
export async function getMyAttendance(month?: string) {
  const q = month ? `?month=${month}` : "";
  return apiFetch<AttendanceRecord[]>(`/attendance/me${q}`);
}
