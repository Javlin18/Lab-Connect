import type { Employee, TestResult, User } from "@lab-app/shared";

export type LoginResponse = {
  accessToken: string;
  user: User;
};

export type EmployeeRecord = {
  employee: Employee;
  user: User;
};

export type UserRecord = User & {
  employee?: Employee | null;
};

export type ReportResponse = {
  downloadUrl: string;
  report: TestResult;
};
