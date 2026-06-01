import { useState } from "react";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Pressable, Text, View } from "react-native";

import { listAppointments } from "@/api/appointments";
import { appointmentStatuses } from "@/constants/domain";

import { AppointmentRow } from "@/components/appointment-row";
import { Screen } from "@/components/screen";

export default function AdminAppointmentsScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<(typeof appointmentStatuses)[number]>("all");
  const query = useQuery({
    queryFn: () => listAppointments(status === "all" ? {} : { status }),
    queryKey: ["appointments", status]
  });

  return (
    <Screen
      subtitle="Filter by status."
      title="Appointments"
    >
      <View className="flex-row flex-wrap gap-2">
        {appointmentStatuses.map((item) => (
          <Pressable
            className={`rounded-full px-4 py-2 ${item === status ? "bg-brand" : "bg-white"}`}
            key={item}
            onPress={() => setStatus(item)}
          >
            <Text className={`text-sm font-medium ${item === status ? "text-white" : "text-ink"}`}>
              {item === "all" ? "All" : item}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="gap-3">
        {(query.data?.data ?? []).map((appointment) => (
          <AppointmentRow
            appointment={appointment}
            key={appointment.id}
            onPress={() => router.push(`/(admin)/appointment/${appointment.id}`)}
          />
        ))}
        {!query.isLoading && !(query.data?.data ?? []).length ? (
          <Text className="text-sm text-slate-500">No items for this filter.</Text>
        ) : null}
      </View>
    </Screen>
  );
}
