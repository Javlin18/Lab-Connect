import React from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Appointment } from "@lab-app/shared";

import { claimAppointment, getAssignedAppointments, getAvailableAppointments } from "@/api/employee";
import { Screen } from "@/components/screen";
import { EmptyState } from "@/components/employee/EmptyState";

const ACTIVE_STATUSES = new Set(["assigned", "accepted", "en_route"]);

function isEmployeeFree(appointments: Appointment[]) {
  return !appointments.some((appointment) => ACTIVE_STATUSES.has(appointment.status));
}

function formatTests(tests: string[]) {
  return tests.length ? tests.join(", ") : "No tests listed";
}

export default function EmployeeAppointmentsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const availableQuery = useQuery({
    queryKey: ["appointments", "available"],
    queryFn: getAvailableAppointments,
    refetchInterval: 60000
  });

  const assignedQuery = useQuery({
    queryKey: ["appointments", "assigned"],
    queryFn: getAssignedAppointments,
    refetchInterval: 60000
  });

  const availableAppointments = availableQuery.data?.data ?? [];
  const assignedAppointments = assignedQuery.data?.data ?? [];
  const employeeFree = isEmployeeFree(assignedAppointments);

  const claimMutation = useMutation({
    mutationFn: claimAppointment,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["appointments", "available"] });
      queryClient.invalidateQueries({ queryKey: ["appointments", "assigned"] });
      Alert.alert("Appointment accepted", "This booking is now assigned to you.", [
        {
          text: "View Task",
          onPress: () => router.push(`/(employee)/task/${response.data.id}`)
        },
        { text: "OK" }
      ]);
    },
    onError: (error: Error) => {
      Alert.alert("Could not accept appointment", error.message || "Please try again.");
    }
  });

  const handleAccept = (appointmentId: string) => {
    if (!employeeFree) {
      Alert.alert(
        "You are busy",
        "Complete or close your active appointment before accepting a new one."
      );
      return;
    }
    claimMutation.mutate(appointmentId);
  };

  const isLoading =
    (availableQuery.isLoading || assignedQuery.isLoading) && availableAppointments.length === 0;

  return (
    <Screen title="New Appointments">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="mb-5 rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
          <Text className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Current status
          </Text>
          <Text className="mt-1 text-2xl font-black text-slate-900">
            {employeeFree ? "Free to accept" : "Busy on active task"}
          </Text>
          <Text className="mt-2 text-sm font-semibold text-slate-500">
            {employeeFree
              ? "Patient bookings are available below. Accept one to start your next collection."
              : "Next appointment can be accepted only after your active collection is completed."}
          </Text>
        </View>

        <View className="mb-4 flex-row gap-3">
          <View className="flex-1 rounded-2xl border border-blue-100 bg-blue-50 p-3.5">
            <Text className="text-xs font-bold text-blue-600">Available</Text>
            <Text className="mt-1 text-2xl font-black text-blue-800">
              {availableAppointments.length}
            </Text>
          </View>
          <View className="flex-1 rounded-2xl border border-amber-100 bg-amber-50 p-3.5">
            <Text className="text-xs font-bold text-amber-600">Active Tasks</Text>
            <Text className="mt-1 text-2xl font-black text-amber-800">
              {assignedAppointments.filter((app) => ACTIVE_STATUSES.has(app.status)).length}
            </Text>
          </View>
        </View>

        {isLoading ? (
          <View className="py-20">
            <ActivityIndicator size="large" color="#0F6E56" />
          </View>
        ) : availableAppointments.length === 0 ? (
          <EmptyState
            message="No new appointments"
            subMessage="New patient bookings will appear here when they are ready to accept."
          />
        ) : (
          <View className="pb-6">
            {availableAppointments.map((appointment) => (
              <View
                key={appointment.id}
                className="mb-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <View className="mb-3 flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-lg font-black text-slate-900">
                      {appointment.patient?.name ?? "Patient"}
                    </Text>
                    <Text className="mt-1 text-xs font-bold text-slate-400">
                      Booking #{appointment.id.slice(0, 8)}
                    </Text>
                  </View>
                  <View className="rounded-full bg-slate-100 px-3 py-1">
                    <Text className="text-xs font-bold text-slate-600">{appointment.slot}</Text>
                  </View>
                </View>

                <View className="space-y-2">
                  <Text className="text-sm font-semibold text-slate-600">
                    Address: <Text className="font-normal">{appointment.address}</Text>
                  </Text>
                  <Text className="text-sm font-semibold text-slate-600">
                    Tests: <Text className="font-normal">{formatTests(appointment.testTypes)}</Text>
                  </Text>
                  {appointment.patient?.phone ? (
                    <Text className="text-sm font-semibold text-slate-600">
                      Contact: <Text className="font-normal">{appointment.patient.phone}</Text>
                    </Text>
                  ) : null}
                </View>

                <TouchableOpacity
                  className={`mt-4 rounded-2xl px-4 py-3 ${
                    employeeFree ? "bg-emerald-800" : "bg-slate-300"
                  }`}
                  disabled={!employeeFree || claimMutation.isPending}
                  onPress={() => handleAccept(appointment.id)}
                >
                  <Text className="text-center text-sm font-black text-white">
                    {claimMutation.isPending ? "Accepting..." : "Accept Appointment"}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
