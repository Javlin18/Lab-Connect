import { Text, View } from "react-native";

import type { Appointment } from "@lab-app/shared";

import { formatStatus } from "@/lib/format";

const styles: Record<Appointment["status"], string> = {
  pending: "bg-slate-200",
  assigned: "bg-brand-soft",
  accepted: "bg-amber-100",
  en_route: "bg-sky-100",
  collected: "bg-emerald-100",
  processing: "bg-fuchsia-100",
  completed: "bg-emerald-200",
  cancelled: "bg-red-100"
};

export function StatusBadge({ status }: { status: Appointment["status"] }) {
  return (
    <View className={`self-start rounded-full px-3 py-1 ${styles[status]}`}>
      <Text className="text-xs font-semibold uppercase tracking-wide text-ink">{formatStatus(status)}</Text>
    </View>
  );
}
