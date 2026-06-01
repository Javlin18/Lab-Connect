import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Text, View } from "react-native";

import { getMyAppointments } from "@/api/appointments";

import { AppointmentRow } from "@/components/appointment-row";
import { Button } from "@/components/button";
import { Screen } from "@/components/screen";

export default function PatientAppointmentsScreen() {
  const router = useRouter();
  const query = useQuery({
    queryFn: getMyAppointments,
    queryKey: ["appointments", "mine"]
  });

  return (
    <Screen
      subtitle="History and upcoming slots."
      title="Appointments"
    >
      <Button onPress={() => router.push("/(patient)/book")}>Book new appointment</Button>
      <View className="gap-3">
        {(query.data?.data ?? []).map((appointment) => (
          <AppointmentRow
            appointment={appointment}
            key={appointment.id}
          />
        ))}
        {!query.isLoading && !(query.data?.data ?? []).length ? (
          <Text className="text-sm text-slate-500">No appointments yet.</Text>
        ) : null}
      </View>
    </Screen>
  );
}
