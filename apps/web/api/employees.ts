"use client";

import type { Appointment, Employee, User } from "@lab-app/shared";

import { apiFetch } from "./client";

export interface EmployeeRecord {
  employee: Employee;
  user: User;
}

export async function listEmployees() {
  return apiFetch<EmployeeRecord[]>("/employees");
}

export async function updateEmployeeLocation(
  id: string,
  input: { isAvailable?: boolean; latitude: number; longitude: number }
) {
  return apiFetch<Employee>(`/employees/${id}/location`, {
    method: "PUT",
    body: JSON.stringify(input)
  });
}

export function countEmployeeTasksForDate(appointments: Appointment[], employeeUserId: string, day: string) {
  return appointments.filter(
    (item) => item.employeeId === employeeUserId && item.slot.startsWith(day)
  ).length;
}
