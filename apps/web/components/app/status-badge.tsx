import type { Appointment } from "@lab-app/shared";

import { Badge } from "@/components/ui/badge";

const badgeMap: Record<Appointment["status"], string> = {
  accepted: "border-sky-200 bg-sky-50 text-sky-700",
  assigned: "border-indigo-200 bg-indigo-50 text-indigo-700",
  collected: "border-emerald-200 bg-emerald-50 text-emerald-700",
  completed: "border-emerald-300 bg-emerald-100 text-emerald-800",
  en_route: "border-orange-200 bg-orange-50 text-orange-700",
  pending: "border-yellow-200 bg-yellow-50 text-yellow-700",
  processing: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
  cancelled: "border-red-200 bg-red-50 text-red-700"
};

export function StatusBadge({ status }: { status: Appointment["status"] }) {
  return <Badge className={badgeMap[status]}>{status.replace("_", " ")}</Badge>;
}
