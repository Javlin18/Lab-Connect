import type { Appointment } from "@lab-app/shared";

const STATUS_LABELS: Record<Appointment["status"], string> = {
  pending: "Pending",
  assigned: "Assigned",
  accepted: "Accepted",
  en_route: "On way",
  collected: "Sample Collected",
  processing: "Processing in Lab",
  completed: "Report Ready",
  cancelled: "Cancelled"
};

export function formatSlot(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

export function formatDayKey(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

export function formatStatus(value: Appointment["status"]) {
  return STATUS_LABELS[value];
}

export function getEtaText(slot: string) {
  const date = new Date(slot);

  if (Number.isNaN(date.getTime())) {
    return "ETA soon";
  }

  return `ETA ${date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit"
  })}`;
}
