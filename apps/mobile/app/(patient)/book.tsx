import { useState } from "react";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { Alert } from "react-native";

import { createAppointment } from "@/api/appointments";
import { queryClient } from "@/lib/query-client";
import { useAuthStore } from "@/store/auth-store";

import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Input } from "@/components/input";
import { Screen } from "@/components/screen";

export default function PatientBookScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [tests, setTests] = useState("");
  const [address, setAddress] = useState("");
  const [slot, setSlot] = useState("");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      createAppointment({
        address,
        notes,
        patientId: user?.id ?? "",
        slot,
        testTypes: tests
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["appointments", "mine"] });
      router.replace("/(patient)/appointments");
    },
    onError: (error: Error) => {
      Alert.alert("Booking failed", error.message);
    }
  });

  return (
    <Screen
      subtitle="Enter slot in ISO format for now."
      title="Book a test"
    >
      <Card className="gap-4">
        <Input
          label="Tests"
          onChangeText={setTests}
          placeholder="CBC, Sugar, Lipid"
          value={tests}
        />
        <Input
          label="Address"
          onChangeText={setAddress}
          placeholder="Your address"
          value={address}
        />
        <Input
          autoCapitalize="none"
          label="Preferred slot"
          onChangeText={setSlot}
          placeholder="2026-05-24T08:30:00.000Z"
          value={slot}
        />
        <Input
          label="Notes"
          multiline
          numberOfLines={4}
          onChangeText={setNotes}
          placeholder="Optional notes"
          value={notes}
        />
        <Button
          loading={mutation.isPending}
          onPress={() => mutation.mutate()}
        >
          Book
        </Button>
      </Card>
    </Screen>
  );
}
