import type { Appointment } from "@lab-app/shared";

export const appointmentStatuses: Array<Appointment["status"] | "all"> = [
  "all",
  "pending",
  "assigned",
  "accepted",
  "en_route",
  "collected",
  "processing",
  "completed"
];

export const patientStatusSteps = [
  "pending",
  "assigned",
  "en_route",
  "collected",
  "processing",
  "completed"
] as const;
