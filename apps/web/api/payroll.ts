import type { EmployeeExpenseRecord, EmployeePayConfig, EmployeePayrollSummary } from "@lab-app/shared";
import { apiFetch } from "./client";

export async function getGlobalPayConfig() {
  return apiFetch<EmployeePayConfig>("/payroll/config");
}

export async function getEmployeePayConfig(employeeId: string) {
  return apiFetch<EmployeePayConfig>(`/payroll/config/${employeeId}`);
}

export async function updateEmployeePayConfig(employeeId: string, data: Partial<EmployeePayConfig>) {
  return apiFetch<EmployeePayConfig>(`/payroll/config/${employeeId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function getPayrollSummary(month?: string) {
  const query = month ? `?month=${month}` : "";
  return apiFetch<EmployeePayrollSummary[]>(`/payroll/summary${query}`);
}

export async function getEmployeePayrollSummary(employeeId: string, month?: string) {
  const query = month ? `?month=${month}` : "";
  return apiFetch<EmployeePayrollSummary>(`/payroll/summary/${employeeId}${query}`);
}

export async function getExpenses(month?: string) {
  const query = month ? `?month=${month}` : "";
  return apiFetch<EmployeeExpenseRecord[]>(`/payroll/expenses${query}`);
}

export async function createExpense(data: {
  employeeId: string;
  type: "bonus" | "deduction" | "reimbursement";
  amount: number;
  description: string;
  month: string;
}) {
  return apiFetch<EmployeeExpenseRecord>("/payroll/expenses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteExpense(id: string) {
  return apiFetch<{ success: boolean }>(`/payroll/expenses/${id}`, {
    method: "DELETE",
  });
}
