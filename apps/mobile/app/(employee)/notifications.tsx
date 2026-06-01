import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/api/client";
import { Screen } from "@/components/screen";

type Notification = {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function notifIcon(type: string): string {
  if (type.includes("assign")) return "📋";
  if (type.includes("collect")) return "🧪";
  if (type.includes("route")) return "🚗";
  return "🔔";
}

export default function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiFetch<Notification[]>("/notifications/mine"),
    refetchInterval: 30000,
  });

  const markAllMutation = useMutation({
    mutationFn: () =>
      apiFetch("/notifications/mark-all-read", { method: "PUT" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markOneMutation = useMutation({
    mutationFn: (notifId: string) =>
      apiFetch(`/notifications/${notifId}/read`, { method: "PUT" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const notifications = query.data?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleTap = (notif: Notification) => {
    if (!notif.read) markOneMutation.mutate(notif.id);
    // Navigate to appointment if type contains appointment id
    // type format: "appointment_assigned:appointmentId"
    const parts = notif.type.split(":");
    if (parts.length > 1) {
      router.push(`/(employee)/task/${parts[1]}`);
    }
  };

  return (
    <Screen title="Notifications">
      {/* Header row */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-xs text-slate-400 font-semibold">
          {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
          >
            <Text className="text-xs font-bold text-emerald-700">
              Mark all as read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {query.isLoading ? (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color="#0F6E56" />
        </View>
      ) : notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center py-20">
          <Text className="text-3xl mb-3">🔔</Text>
          <Text className="text-sm font-bold text-slate-600">No notifications yet</Text>
          <Text className="text-xs text-slate-400 mt-1">
            You'll see assignment updates here
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {notifications.map((notif) => (
            <TouchableOpacity
              key={notif.id}
              onPress={() => handleTap(notif)}
              className={`mb-3 rounded-2xl p-4 border flex-row items-start gap-3 ${
                notif.read
                  ? "bg-white border-slate-100"
                  : "bg-blue-50 border-blue-100 border-l-4 border-l-blue-500"
              }`}
            >
              <Text className="text-xl mt-0.5">{notifIcon(notif.type)}</Text>
              <View className="flex-1">
                <Text className="text-sm font-bold text-slate-800">
                  {notif.title}
                </Text>
                <Text className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  {notif.body}
                </Text>
                <Text className="text-[10px] text-slate-400 mt-1.5 font-semibold">
                  {timeAgo(notif.createdAt)}
                </Text>
              </View>
              {!notif.read && (
                <View className="h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}
