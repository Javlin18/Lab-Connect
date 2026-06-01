"use client";

import type { Employee, User } from "@lab-app/shared";

import { apiFetch } from "./client";

export interface UserWithEmployee extends User {
  employee: Employee | null;
}

export interface CreateEmployeeInput {
  email: string;
  isAvailable?: boolean;
  name: string;
  password: string;
  phone: string;
  zone: string;
}

export interface UpdateUserInput {
  currentLocation?: string;
  email?: string;
  isAvailable?: boolean;
  name?: string;
  password?: string;
  phone?: string;
  role?: User["role"];
  zone?: string;
}

export async function listUsers(role?: User["role"]) {
  const search = role ? `?role=${role}` : "";
  return apiFetch<UserWithEmployee[]>(`/users${search}`);
}

export async function createEmployee(input: CreateEmployeeInput) {
  return apiFetch<{ employee: Employee; user: User }>("/users/employee", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updateUser(id: string, input: UpdateUserInput) {
  return apiFetch<UserWithEmployee>(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(input)
  });
}

export async function deleteUser(id: string) {
  return apiFetch<null>(`/users/${id}`, {
    method: "DELETE"
  });
}
