import { Pressable, Text, View } from "react-native";

import type { Appointment } from "@lab-app/shared";

import { formatSlot } from "@/lib/format";

import { Card } from "./card";
import { StatusBadge } from "./status-badge";

export function AppointmentRow({
  appointment,
  onPress,
  subtitle
}: {
  appointment: Appointment;
  onPress?: () => void;
  subtitle?: string;
}) {
  return (
    <Pressable onPress={onPress}>
      <Card className="gap-3">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1">
            <Text className="text-base font-semibold text-ink">
              {appointment.patient?.name ?? appointment.address}
            </Text>
            <Text className="text-sm text-slate-500">{subtitle ?? appointment.address}</Text>
          </View>
          <StatusBadge status={appointment.status} />
        </View>
        <Text className="text-sm text-slate-600">{appointment.testTypes.join(", ")}</Text>
        <Text className="text-sm font-medium text-slate-700">{formatSlot(appointment.slot)}</Text>
      </Card>
    </Pressable>
  );
}
