import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Alert, Text, TouchableOpacity, View } from "react-native";

import { getMyAppointments } from "@/api/appointments";
import { getEtaText, formatSlot } from "@/lib/format";
import { useAuthStore } from "@/store/auth-store";

import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { ProgressTracker } from "@/components/progress-tracker";
import { Screen } from "@/components/screen";
import { StatusBadge } from "@/components/status-badge";

function LogoutButton() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <TouchableOpacity
      onPress={handleLogout}
      className="bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl"
    >
      <Text className="text-red-600 text-xs font-bold">Logout</Text>
    </TouchableOpacity>
  );
}

export default function PatientHomeScreen() {
  const router = useRouter();
  const query = useQuery({
    queryFn: getMyAppointments,
    queryKey: ["appointments", "mine"],
    refetchInterval: 30000,
  });

  const activeAppointment = (query.data?.data ?? []).find(
    (item) => item.status !== "completed"
  );

  if (!activeAppointment) {
    return (
      <Screen
        title="Patient"
        subtitle="No active appointment."
        headerRight={<LogoutButton />}
      >
        <Card className="gap-3">
          <Text className="text-base text-slate-600">Need a home collection?</Text>
          <Button onPress={() => router.push("/(patient)/book")}>Book a test</Button>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      title="Appointment"
      subtitle="Live status tracker."
      headerRight={<LogoutButton />}
    >
      <Card className="gap-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1">
            <Text className="text-lg font-bold text-ink">
              {activeAppointment.testTypes.join(", ")}
            </Text>
            <Text className="text-sm text-slate-500">
              {formatSlot(activeAppointment.slot)}
            </Text>
          </View>
          <StatusBadge status={activeAppointment.status} />
        </View>

        <ProgressTracker status={activeAppointment.status} />

        {activeAppointment.status === "en_route" ? (
          <View className="gap-1">
            <Text className="text-sm font-medium text-ink">
              Employee: {activeAppointment.employee?.name ?? "Assigned staff"}
            </Text>
            <Text className="text-sm text-slate-500">
              {getEtaText(activeAppointment.slot)}
            </Text>
          </View>
        ) : null}
      </Card>
    </Screen>
  );
}
