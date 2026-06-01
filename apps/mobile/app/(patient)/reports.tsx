import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Text, View } from "react-native";

import { getMyAppointments } from "@/api/appointments";

import { AppointmentRow } from "@/components/appointment-row";
import { Screen } from "@/components/screen";

export default function PatientReportsScreen() {
  const router = useRouter();
  const query = useQuery({
    queryFn: getMyAppointments,
    queryKey: ["appointments", "mine"]
  });

  const reportAppointments = (query.data?.data ?? []).filter((item) => item.report);

  return (
    <Screen
      subtitle="Open finished or processing reports."
      title="Reports"
    >
      <View className="gap-3">
        {reportAppointments.map((appointment) => (
          <AppointmentRow
            appointment={appointment}
            key={appointment.id}
            onPress={() => router.push(`/(patient)/report/${appointment.id}`)}
            subtitle={appointment.report ? "PDF ready" : "Processing"}
          />
        ))}
        {!query.isLoading && !reportAppointments.length ? (
          <Text className="text-sm text-slate-500">No reports yet.</Text>
        ) : null}
      </View>
    </Screen>
  );
}
