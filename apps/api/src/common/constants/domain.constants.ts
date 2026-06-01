export const USER_ROLES = ["admin", "employee", "patient"] as const;
export type UserRoleValue = (typeof USER_ROLES)[number];

export const APPOINTMENT_STATUSES = [
  "pending",
  "assigned",
  "accepted",
  "en_route",
  "collected",
  "processing",
  "completed"
] as const;
export type AppointmentStatusValue = (typeof APPOINTMENT_STATUSES)[number];

export const EMPLOYEE_STATUS_UPDATES = ["en_route", "collected"] as const;
export type EmployeeStatusUpdateValue = (typeof EMPLOYEE_STATUS_UPDATES)[number];
