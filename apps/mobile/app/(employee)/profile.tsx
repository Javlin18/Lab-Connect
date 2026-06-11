import React, { useState } from "react";
import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/store/auth-store";
import { getHistory } from "@/api/employee";
import { Screen } from "@/components/screen";

export default function EmployeeProfileScreen() {

  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const [shareLocation, setShareLocation] = useState(true);
  const [receiveNotifications, setReceiveNotifications] = useState(true);

  const monthQuery = useQuery({
    queryKey: ["history-month"],
    queryFn: () => getHistory("month"),
  });
  const weekQuery = useQuery({
    queryKey: ["history-week"],
    queryFn: () => getHistory("week"),
  });
  const todayQuery = useQuery({
    queryKey: ["history-today"],
    queryFn: () => getHistory("today"),
  });

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "EM";

  return (
    <Screen title="My Profile" scroll={false}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View className="items-center py-6">
          <View className="h-20 w-20 bg-emerald-800 rounded-full items-center justify-center" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 }}>
            <Text className="text-white text-2xl font-black">{initials}</Text>
          </View>
          <Text className="text-lg font-black text-slate-800 mt-3">
            {user?.name ?? "Employee"}
          </Text>
          <Text className="text-xs text-slate-400 mt-0.5">
            {user?.phone ?? "—"}
          </Text>
          <Text className="text-xs text-slate-400 mt-0.5">
            ID: E-{user?.id ? user.id.slice(0, 8).toUpperCase() : "—"}
          </Text>
          <View className="bg-slate-100 px-3 py-1 rounded-full mt-2">
            <Text className="text-xs font-bold text-slate-500">
              Zone: Bhopal North Zone
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-slate-50 border border-slate-100 p-3 rounded-2xl items-center">
            <Text className="text-[10px] font-bold text-slate-400 uppercase">Today</Text>
            <Text className="text-base font-black text-slate-700 mt-1">
              {todayQuery.data?.data?.length ?? "—"}
            </Text>
          </View>
          <View className="flex-1 bg-slate-50 border border-slate-100 p-3 rounded-2xl items-center">
            <Text className="text-[10px] font-bold text-slate-400 uppercase">This Week</Text>
            <Text className="text-base font-black text-slate-700 mt-1">
              {weekQuery.data?.data?.length ?? "—"}
            </Text>
          </View>
          <View className="flex-1 bg-slate-50 border border-slate-100 p-3 rounded-2xl items-center">
            <Text className="text-[10px] font-bold text-slate-400 uppercase">Month</Text>
            <Text className="text-base font-black text-slate-700 mt-1">
              {monthQuery.data?.data?.length ?? "—"}
            </Text>
          </View>
        </View>

        {/* Settings */}
        <View className="bg-slate-50 border border-slate-100 rounded-3xl p-5 mb-6">
          <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">
            Device Settings
          </Text>

          <View className="flex-row justify-between items-center py-3 border-b border-slate-100">
            <View className="flex-1 pr-4">
              <Text className="text-sm font-bold text-slate-700">
                GPS Location Sharing
              </Text>
              <Text className="text-xs text-slate-400 mt-0.5">
                Allow patient live tracking
              </Text>
            </View>
            <Switch
              value={shareLocation}
              onValueChange={setShareLocation}
              trackColor={{ true: "#0F6E56" }}
            />
          </View>

          <View className="flex-row justify-between items-center py-3">
            <View className="flex-1 pr-4">
              <Text className="text-sm font-bold text-slate-700">
                Push Notifications
              </Text>
              <Text className="text-xs text-slate-400 mt-0.5">
                Receive assignment updates
              </Text>
            </View>
            <Switch
              value={receiveNotifications}
              onValueChange={setReceiveNotifications}
              trackColor={{ true: "#0F6E56" }}
            />
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          className="w-full bg-red-500 rounded-2xl py-4 items-center justify-center mb-8"
          onPress={async () => {
            await logout();
            router.replace("/(auth)/login" as never);
          }}
        >
          <Text className="text-white font-black text-sm">Logout Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}
