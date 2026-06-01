import type { EmployeeRecord } from "@/types/domain";

import { apiFetch } from "./client";

export function listEmployees() {
  return apiFetch<EmployeeRecord[]>("/employees");
}

export function getMyEmployeeProfile() {
  return apiFetch<EmployeeRecord>("/employees/me");
}

export function updateMyLocation(input: {
  isAvailable: boolean;
  latitude: number;
  longitude: number;
}) {
  return apiFetch<EmployeeRecord["employee"]>("/employees/me/location", {
    body: input,
    method: "PUT"
  });
}
