import React from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/auth-store";

import { getAssignedAppointments, getMyPayroll } from "@/api/employee";
import { Screen } from "@/components/screen";
import { TaskCard } from "@/components/employee/TaskCard";
import { EmptyState } from "@/components/employee/EmptyState";

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
        }
      }
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

export default function EmployeeHomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const assignedQuery = useQuery({
    queryKey: ["appointments", "assigned"],
    queryFn: getAssignedAppointments,
    refetchInterval: 60000
  });

  const appointments = assignedQuery.data?.data ?? [];

  const payrollQuery = useQuery({
    queryKey: ["my-payroll-home"],
    queryFn: () => getMyPayroll(),
  });
  const payroll = payrollQuery.data?.data;

  const pendingTasks = appointments.filter((app) => app.status === "assigned");
  const acceptedTasks = appointments.filter(
    (app) => app.status === "accepted" || app.status === "en_route"
  );
  const collectedTasks = appointments.filter(
    (app) => app.status === "completed" || (app.status as string) === "collected"
  );

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });

  return (
    <Screen title="" headerRight={<LogoutButton />}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Text className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            {todayStr}
          </Text>
          <Text className="text-xl font-black text-slate-800 mt-0.5">
            Good morning, {user?.name ?? "Collector"}
          </Text>
        </View>

        <View className="flex-row gap-3 mb-3">
          <View className="flex-1 bg-amber-50 border border-amber-200/60 p-3.5 rounded-2xl">
            <Text className="text-xs text-amber-500 font-bold">Pending</Text>
            <Text className="text-xl font-black text-amber-700 mt-1">
              {pendingTasks.length}
            </Text>
          </View>
          <View className="flex-1 bg-blue-50 border border-blue-200/60 p-3.5 rounded-2xl">
            <Text className="text-xs text-blue-500 font-bold">Accepted</Text>
            <Text className="text-xl font-black text-blue-700 mt-1">
              {acceptedTasks.length}
            </Text>
          </View>
          <View className="flex-1 bg-emerald-50 border border-emerald-200/60 p-3.5 rounded-2xl">
            <Text className="text-xs text-emerald-500 font-bold">Collected</Text>
            <Text className="text-xl font-black text-emerald-700 mt-1">
              {collectedTasks.length}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-purple-50 border border-purple-200/60 p-3.5 rounded-2xl">
            <Text className="text-xs text-purple-500 font-bold">Slots Completed</Text>
            <Text className="text-xl font-black text-purple-700 mt-1">
              {payroll?.completedSamples ?? "—"}
            </Text>
          </View>
          <View className="flex-1 bg-rose-50 border border-rose-200/60 p-3.5 rounded-2xl">
            <Text className="text-xs text-rose-500 font-bold">Slots Cancelled</Text>
            <Text className="text-xl font-black text-rose-700 mt-1">
              {payroll?.cancellations ?? "—"}
            </Text>
          </View>
        </View>

        {assignedQuery.isLoading && appointments.length === 0 ? (
          <View className="py-20">
            <ActivityIndicator size="large" color="#0F6E56" />
          </View>
        ) : appointments.length === 0 ? (
          <EmptyState
            message="No assigned tasks today"
            subMessage="Open the Appointments tab to accept a new patient booking when you are free."
          />
        ) : (
          <View className="space-y-6">
            {pendingTasks.length > 0 && (
              <View>
                <Text className="text-sm font-bold text-slate-700 mb-3 px-1 uppercase tracking-wider">
                  Pending Tasks ({pendingTasks.length})
                </Text>
                {pendingTasks.map((app) => (
                  <TaskCard
                    appointment={app}
                    key={app.id}
                    onPress={() => router.push(`/(employee)/task/${app.id}`)}
                  />
                ))}
              </View>
            )}

            {acceptedTasks.length > 0 && (
              <View>
                <Text className="text-sm font-bold text-slate-700 mb-3 px-1 uppercase tracking-wider">
                  Accepted Tasks ({acceptedTasks.length})
                </Text>
                {acceptedTasks.map((app) => (
                  <TaskCard
                    appointment={app}
                    key={app.id}
                    onPress={() => router.push(`/(employee)/task/${app.id}`)}
                  />
                ))}
              </View>
            )}

            {collectedTasks.length > 0 && (
              <View className="opacity-60">
                <Text className="text-sm font-bold text-slate-700 mb-3 px-1 uppercase tracking-wider">
                  Collected Today ({collectedTasks.length})
                </Text>
                {collectedTasks.map((app) => (
                  <TaskCard
                    appointment={app}
                    key={app.id}
                    onPress={() => router.push(`/(employee)/task/${app.id}`)}
                    showDistance={false}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        className="absolute bottom-4 right-4 bg-emerald-800 h-12 w-12 rounded-full items-center justify-center shadow-lg"
        onPress={() => assignedQuery.refetch()}
      >
        <Ionicons name="refresh" size={24} color="white" />
      </TouchableOpacity>
    </Screen>
  );
}
