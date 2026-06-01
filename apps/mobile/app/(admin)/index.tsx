import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Pressable, Text, View } from "react-native";

import { listAppointments } from "@/api/appointments";
import { listEmployees } from "@/api/employees";

import { AppointmentRow } from "@/components/appointment-row";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Screen } from "@/components/screen";

export default function AdminHomeScreen() {
  const router = useRouter();
  const appointmentsQuery = useQuery({
    queryFn: () => listAppointments(),
    queryKey: ["appointments", "admin-home"]
  });
  const employeesQuery = useQuery({
    queryFn: listEmployees,
    queryKey: ["employees"]
  });

  const appointments = appointmentsQuery.data?.data ?? [];
  const employees = employeesQuery.data?.data ?? [];
  const pending = appointments.filter((item) => item.status === "pending").length;
  const enRoute = appointments.filter((item) => item.status === "en_route").length;
  const done = appointments.filter((item) => item.status === "completed").length;

  return (
    <Screen
      subtitle="Quick stats and recent activity."
      title="Admin"
    >
      <View className="flex-row flex-wrap gap-3">
        <Card className="min-w-[47%] flex-1 gap-1 bg-brand">
          <Text className="text-sm text-white/80">Total appointments</Text>
          <Text className="text-3xl font-bold text-white">{appointments.length}</Text>
        </Card>
        <Card className="min-w-[47%] flex-1 gap-1">
          <Text className="text-sm text-slate-500">Employees</Text>
          <Text className="text-3xl font-bold text-ink">{employees.length}</Text>
        </Card>
        <Card className="min-w-[30%] flex-1 gap-1">
          <Text className="text-sm text-slate-500">Pending</Text>
          <Text className="text-2xl font-bold text-ink">{pending}</Text>
        </Card>
        <Card className="min-w-[30%] flex-1 gap-1">
          <Text className="text-sm text-slate-500">On way</Text>
          <Text className="text-2xl font-bold text-ink">{enRoute}</Text>
        </Card>
        <Card className="min-w-[30%] flex-1 gap-1">
          <Text className="text-sm text-slate-500">Done</Text>
          <Text className="text-2xl font-bold text-ink">{done}</Text>
        </Card>
      </View>

      <Button onPress={() => router.push("/(admin)/new-appointment")}>New appointment</Button>

      <View className="gap-3">
        <Text className="text-lg font-semibold text-ink">Recent appointments</Text>
        {appointments.slice(0, 4).map((appointment) => (
          <AppointmentRow
            appointment={appointment}
            key={appointment.id}
            onPress={() => router.push(`/(admin)/appointment/${appointment.id}`)}
          />
        ))}
        {!appointments.length ? <Text className="text-sm text-slate-500">No appointments yet.</Text> : null}
      </View>
    </Screen>
  );
}
