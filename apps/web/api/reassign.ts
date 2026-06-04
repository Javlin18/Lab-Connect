"use client";
import { apiFetch } from "./client";

export type ReassignRequest = {
  id: string;
  appointmentId: string;
  requestedBy: string;
  reason: string;
  note: string | null;
  status: string;
  resolvedBy: string | null;
  newEmployeeId: string | null;
  createdAt: string;
  resolvedAt: string | null;
  appointment: {
    id: string;
    patient?: { name: string; phone: string } | null;
    employee?: { name: string; phone: string } | null;
    testTypes: string[];
    address: string;
    slot: string;
    status: string;
  };
};

export function getReassignRequests(status?: string) {
  return apiFetch<ReassignRequest[]>(
    `/appointments/reassign-requests${status ? `?status=${status}` : ""}`
  );
}

export function resolveReassign(requestId: string, newEmployeeId: string) {
  return apiFetch(`/appointments/reassign-requests/${requestId}/resolve`, {
    method: "PUT",
    body: JSON.stringify({ newEmployeeId }),
  });
}
