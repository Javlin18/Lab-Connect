import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { apiFetch } from "@/api/client";
import type { Notification } from "@lab-app/shared";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function notifIcon(type: string): any {
  if (type.includes("report")) return "document-text-outline";
  if (type.includes("collect")) return "flask-outline";
  if (type.includes("assign")) return "person-outline";
  if (type.includes("route")) return "car-outline";
  return "notifications-outline";
}

export default function PatientNotificationsScreen() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["patient-notifications"],
    queryFn: () => apiFetch<Notification[]>("/notifications/mine"),
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/notifications/${id}/read`, { method: "PUT" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["patient-notifications"] }),
  });

  const notifications = query.data?.data ?? [];
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F5]" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-[#0F6E56] font-bold text-sm">← Back</Text>
        </TouchableOpacity>
        <Text className="text-base font-bold text-[#1a1a1a]">Notifications</Text>
        <View style={{ width: 48 }} />
      </View>

      {query.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#C41E3A" />
        </View>
      ) : notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="notifications-outline" size={48} color="#9CA3AF" style={{ marginBottom: 16 }} />
          <Text className="text-base font-bold text-[#1a1a1a] text-center">
            No notifications yet
          </Text>
          <Text className="text-sm text-gray-500 text-center mt-1">
            You'll see booking updates and report alerts here
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {unread > 0 ? (
            <Text className="text-xs text-gray-500 mb-3">
              {unread} unread notification{unread > 1 ? "s" : ""}
            </Text>
          ) : null}

          {notifications.map((notif) => (
            <TouchableOpacity
              key={notif.id}
              onPress={() => {
                if (!notif.read) markReadMutation.mutate(notif.id);
              }}
              className={`mb-3 rounded-2xl p-4 border flex-row items-start gap-3 ${
                notif.read
                  ? "bg-white border-gray-100"
                  : "bg-red-50 border-l-4 border-l-[#C41E3A] border-red-100"
              }`}
            >
              <Ionicons name={notifIcon(notif.type)} size={24} color="#4B5563" />
              <View className="flex-1">
                <Text className="text-sm font-bold text-[#1a1a1a]">{notif.title}</Text>
                <Text className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  {notif.body}
                </Text>
                <Text className="text-[10px] text-gray-400 mt-1.5 font-semibold">
                  {timeAgo(notif.createdAt)}
                </Text>
              </View>
              {!notif.read ? (
                <View className="h-2 w-2 rounded-full bg-[#C41E3A] mt-1.5" />
              ) : null}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
