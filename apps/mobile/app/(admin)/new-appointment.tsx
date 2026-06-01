import { useState } from "react";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Picker } from "@react-native-picker/picker";
import { Alert, View } from "react-native";

import { createAppointment } from "@/api/appointments";
import { listEmployees } from "@/api/employees";
import { listUsers } from "@/api/users";
import { queryClient } from "@/lib/query-client";

import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Input } from "@/components/input";
import { Screen } from "@/components/screen";

export default function NewAppointmentScreen() {
  const router = useRouter();
  const [patientId, setPatientId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [tests, setTests] = useState("");
  const [address, setAddress] = useState("");
  const [slot, setSlot] = useState("");
  const [notes, setNotes] = useState("");

  const patientsQuery = useQuery({
    queryFn: () => listUsers("patient"),
    queryKey: ["users", "patient"]
  });
  const employeesQuery = useQuery({
    queryFn: listEmployees,
    queryKey: ["employees"]
  });

  const mutation = useMutation({
    mutationFn: () =>
      createAppointment({
        address,
        employeeId: employeeId || undefined,
        notes,
        patientId,
        slot,
        testTypes: tests
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      }),
    onSuccess: async ({ data }) => {
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      router.replace(`/(admin)/appointment/${data.id}`);
    },
    onError: (error: Error) => {
      Alert.alert("Create failed", error.message);
    }
  });

  return (
    <Screen
      subtitle="ISO slot example: 2026-05-24T10:30:00.000Z"
      title="New appointment"
    >
      <Card className="gap-4">
        <View className="overflow-hidden rounded-2xl border border-line bg-white">
          <Picker
            onValueChange={setPatientId}
            selectedValue={patientId}
          >
            <Picker.Item
              label="Choose patient"
              value=""
            />
            {(patientsQuery.data?.data ?? []).map((item) => (
              <Picker.Item
                key={item.id}
                label={`${item.name} • ${item.phone}`}
                value={item.id}
              />
            ))}
          </Picker>
        </View>
        <View className="overflow-hidden rounded-2xl border border-line bg-white">
          <Picker
            onValueChange={setEmployeeId}
            selectedValue={employeeId}
          >
            <Picker.Item
              label="Assign later"
              value=""
            />
            {(employeesQuery.data?.data ?? []).map((item) => (
              <Picker.Item
                key={item.employee.id}
                label={`${item.user.name} • ${item.employee.zone}`}
                value={item.user.id}
              />
            ))}
          </Picker>
        </View>
        <Input
          label="Tests"
          onChangeText={setTests}
          placeholder="CBC, Thyroid, Vitamin D"
          value={tests}
        />
        <Input
          label="Address"
          onChangeText={setAddress}
          placeholder="Patient address"
          value={address}
        />
        <Input
          autoCapitalize="none"
          label="Slot"
          onChangeText={setSlot}
          placeholder="2026-05-24T10:30:00.000Z"
          value={slot}
        />
        <Input
          label="Notes"
          multiline
          numberOfLines={4}
          onChangeText={setNotes}
          placeholder="Special notes"
          value={notes}
        />
        <Button
          disabled={!patientId}
          loading={mutation.isPending}
          onPress={() => mutation.mutate()}
        >
          Create
        </Button>
      </Card>
    </Screen>
  );
}
