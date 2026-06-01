import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/store/auth-store";
import { getMyAppointments } from "@/api/appointments";
import { Screen } from "@/components/screen";

export default function PatientProfileScreen() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const [notifications, setNotifications] = useState(true);

  const query = useQuery({
    queryKey: ["appointments", "mine"],
    queryFn: getMyAppointments,
  });

  const all = query.data?.data ?? [];
  const completed = all.filter((a) => a.status === "completed").length;
  const pending = all.filter(
    (a) => a.status !== "completed" && a.status !== "collected"
  ).length;

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "PT";

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
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
    <Screen title="My Profile">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View className="items-center py-6">
          <View className="h-20 w-20 bg-teal-700 rounded-full items-center justify-center shadow-md">
            <Text className="text-white text-2xl font-black">{initials}</Text>
          </View>
          <Text className="text-lg font-black text-slate-800 mt-3">
            {user?.name ?? "Patient"}
          </Text>
          <Text className="text-sm text-slate-400 mt-0.5">
            {user?.phone ?? "—"}
          </Text>
          <Text className="text-xs text-slate-400 mt-0.5">
            {user?.email ?? "—"}
          </Text>
          <View className="bg-teal-50 border border-teal-200 px-3 py-1 rounded-full mt-2">
            <Text className="text-xs font-bold text-teal-700">Patient</Text>
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-slate-50 border border-slate-100 p-4 rounded-2xl items-center">
            <Text className="text-[10px] font-bold text-slate-400 uppercase">
              Total Tests
            </Text>
            <Text className="text-xl font-black text-slate-700 mt-1">
              {all.length}
            </Text>
          </View>
          <View className="flex-1 bg-slate-50 border border-slate-100 p-4 rounded-2xl items-center">
            <Text className="text-[10px] font-bold text-slate-400 uppercase">
              Completed
            </Text>
            <Text className="text-xl font-black text-slate-700 mt-1">
              {completed}
            </Text>
          </View>
          <View className="flex-1 bg-slate-50 border border-slate-100 p-4 rounded-2xl items-center">
            <Text className="text-[10px] font-bold text-slate-400 uppercase">
              Pending
            </Text>
            <Text className="text-xl font-black text-slate-700 mt-1">
              {pending}
            </Text>
          </View>
        </View>

        {/* Account Info */}
        <View className="bg-white border border-slate-100 rounded-3xl p-5 mb-4">
          <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">
            Account Info
          </Text>

          <View className="flex-row justify-between py-3 border-b border-slate-50">
            <Text className="text-sm text-slate-500">Full Name</Text>
            <Text className="text-sm font-semibold text-slate-800">
              {user?.name ?? "—"}
            </Text>
          </View>
          <View className="flex-row justify-between py-3 border-b border-slate-50">
            <Text className="text-sm text-slate-500">Phone</Text>
            <Text className="text-sm font-semibold text-slate-800">
              {user?.phone ?? "—"}
            </Text>
          </View>
          <View className="flex-row justify-between py-3 border-b border-slate-50">
            <Text className="text-sm text-slate-500">Email</Text>
            <Text className="text-sm font-semibold text-slate-800">
              {user?.email ?? "—"}
            </Text>
          </View>
          <View className="flex-row justify-between py-3">
            <Text className="text-sm text-slate-500">Member Since</Text>
            <Text className="text-sm font-semibold text-slate-800">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString("en-IN", {
                    month: "short",
                    year: "numeric",
                  })
                : "—"}
            </Text>
          </View>
        </View>

        {/* Settings */}
        <View className="bg-white border border-slate-100 rounded-3xl p-5 mb-6">
          <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">
            Preferences
          </Text>
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-sm font-semibold text-slate-700">
                Push Notifications
              </Text>
              <Text className="text-xs text-slate-400 mt-0.5">
                Collection updates &amp; reports
              </Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ true: "#0F766E" }}
            />
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          className="w-full bg-red-500 rounded-2xl py-4 items-center justify-center mb-8"
          onPress={handleLogout}
        >
          <Text className="text-white font-black text-sm">Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}
