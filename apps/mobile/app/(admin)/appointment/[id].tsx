import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Picker } from "@react-native-picker/picker";
import { Alert, Text, View } from "react-native";

import { assignAppointment, getAppointment } from "@/api/appointments";
import { listEmployees } from "@/api/employees";
import { queryClient } from "@/lib/query-client";

import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Screen } from "@/components/screen";
import { StatusBadge } from "@/components/status-badge";

export default function AdminAppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [employeeId, setEmployeeId] = useState("");
  const appointmentQuery = useQuery({
    enabled: Boolean(id),
    queryFn: () => getAppointment(id),
    queryKey: ["appointment", id]
  });
  const employeesQuery = useQuery({
    queryFn: listEmployees,
    queryKey: ["employees"]
  });

  useEffect(() => {
    if (appointmentQuery.data?.data.employeeId) {
      setEmployeeId(appointmentQuery.data.data.employeeId);
    }
  }, [appointmentQuery.data?.data.employeeId]);

  const assignMutation = useMutation({
    mutationFn: () => assignAppointment(id, employeeId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["appointment", id] });
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      Alert.alert("Saved", "Employee assigned.");
    },
    onError: (error: Error) => {
      Alert.alert("Assign failed", error.message);
    }
  });

  const appointment = appointmentQuery.data?.data;
  const employees = employeesQuery.data?.data ?? [];

  if (!appointment) {
    return (
      <Screen title="Appointment">
        <Text className="text-sm text-slate-500">Loading...</Text>
      </Screen>
    );
  }

  return (
    <Screen
      subtitle={appointment.id}
      title="Appointment detail"
    >
      <Card className="gap-3">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 gap-1">
            <Text className="text-xl font-bold text-ink">{appointment.patient?.name ?? "Patient"}</Text>
            <Text className="text-sm text-slate-500">{appointment.patient?.phone ?? "No phone"}</Text>
          </View>
          <StatusBadge status={appointment.status} />
        </View>
        <Text className="text-sm text-slate-600">{appointment.address}</Text>
        <Text className="text-sm text-slate-700">{appointment.testTypes.join(", ")}</Text>
        <Text className="text-sm text-slate-700">Slot: {appointment.slot}</Text>
        <Text className="text-sm text-slate-700">Notes: {appointment.notes || "None"}</Text>
      </Card>

      <Card className="gap-3">
        <Text className="text-base font-semibold text-ink">Assign employee</Text>
        <View className="overflow-hidden rounded-2xl border border-line bg-white">
          <Picker
            onValueChange={setEmployeeId}
            selectedValue={employeeId}
          >
            <Picker.Item
              label="Choose employee"
              value=""
            />
            {employees.map((item) => (
              <Picker.Item
                key={item.employee.id}
                label={`${item.user.name} • ${item.employee.zone}`}
                value={item.user.id}
              />
            ))}
          </Picker>
        </View>
        <Button
          disabled={!employeeId}
          loading={assignMutation.isPending}
          onPress={() => assignMutation.mutate()}
        >
          Save assignment
        </Button>
      </Card>
    </Screen>
  );
}
