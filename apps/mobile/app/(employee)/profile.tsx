import React, { useMemo, useState } from "react";
import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/store/auth-store";
import { getHistory } from "@/api/employee";
import { Screen } from "@/components/screen";
import type { Appointment } from "@lab-app/shared";

function parseAppointmentDate(appointment: Appointment) {
  const slotDate = appointment.slot?.split(" ")[0];
  const parsedSlot = slotDate ? new Date(slotDate) : null;
  if (parsedSlot && !Number.isNaN(parsedSlot.getTime())) return parsedSlot;
  const fallback = new Date(appointment.updatedAt ?? appointment.createdAt);
  return Number.isNaN(fallback.getTime()) ? new Date() : fallback;
}

function isSameMonth(date: Date, target: Date) {
  return date.getFullYear() === target.getFullYear() && date.getMonth() === target.getMonth();
}

const SLOT_RATE = 140;
const FINES = 870;
const TDS_RATE = 0.01;

const PERF_STATS = [
  { label: "Slots Completed", key: "slots", suffix: "" },
  { label: "Rating",          key: "rating", suffix: " ⭐" },
  { label: "Incentives",      key: "incentives", prefix: "+ ₹", color: "#16a34a" },
  { label: "Fines",           key: "fines",      prefix: "− ₹", color: "#dc2626" },
  { label: "Cancellation",    key: "cancel",     suffix: "%",   color: "#dc2626" },
  { label: "Late Appts",      key: "late",       suffix: "%" },
];

const MANAGE_ITEMS = [
  { icon: "🕐", label: "Manage Slot\nSchedule" },
  { icon: "😊", label: "Manage\nLeaves" },
  { icon: "📅", label: "Manage\nWeek Off" },
];

export default function EmployeeProfileScreen() {
  const logout  = useAuthStore((s) => s.logout);
  const user    = useAuthStore((s) => s.user);

  const [shareLocation,        setShareLocation]        = useState(true);
  const [receiveNotifications, setReceiveNotifications] = useState(true);
  const [selectedMonth,        setSelectedMonth]        = useState(() => new Date());

  const monthQuery = useQuery({ queryKey: ["history-month"], queryFn: () => getHistory("month") });
  const todayQuery = useQuery({ queryKey: ["history-today"], queryFn: () => getHistory("today") });
  const weekQuery  = useQuery({ queryKey: ["history-week"],  queryFn: () => getHistory("week") });

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "EM";

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
    : "—";

  const earnings = useMemo(() => {
    const completed = (monthQuery.data?.data ?? []).filter((a) =>
      isSameMonth(parseAppointmentDate(a), selectedMonth)
    );
    const slotTotal = completed.length * SLOT_RATE;
    const gross     = slotTotal + 175; // incentives
    const tds       = gross * TDS_RATE;
    const net       = gross - FINES - tds;
    return { completed, slotTotal, gross, net, tds };
  }, [monthQuery.data?.data, selectedMonth]);

  const perfValues: Record<string, string> = {
    slots:      String(earnings.completed.length),
    rating:     "4.20",
    incentives: "175.00",
    fines:      "950",
    cancel:     "48",
    late:       "27",
  };

  const monthLabel = selectedMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <Screen title="" scroll={false}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

        {/* ── Orange Header ───────────────────────────────────────────── */}
        <View
          className="rounded-3xl mx-1 mb-6 px-5 py-6 flex-row items-center gap-5"
          style={{ backgroundColor: "#F97316" }}
        >
          <View
            className="w-20 h-20 rounded-full bg-white/30 items-center justify-center border-2 border-white/60"
          >
            <Text className="text-white text-2xl font-black">{initials}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-xl font-black">{user?.name ?? "Employee"}</Text>
            <Text className="text-white/80 text-xs mt-1">Joined {joinedDate}</Text>
          </View>
        </View>

        {/* ── Performance this Month ───────────────────────────────────── */}
        <Text className="text-lg font-black text-slate-800 mb-3 px-1">
          My Performance this Month
        </Text>
        <View className="flex-row flex-wrap gap-3 mb-6">
          {PERF_STATS.map((stat) => {
            const val   = perfValues[stat.key] ?? "—";
            const color = stat.color ?? "#101828";
            return (
              <View
                key={stat.key}
                className="bg-white border border-slate-100 rounded-2xl p-4"
                style={{ width: "47%", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
              >
                <Text className="text-xs text-slate-400 font-semibold mb-1">{stat.label}</Text>
                <View className="flex-row items-center justify-between">
                  <Text className="text-lg font-black" style={{ color }}>
                    {stat.prefix ?? ""}{val}{stat.suffix ?? ""}
                  </Text>
                  <Text className="text-slate-300 text-lg">›</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Manage My Work ──────────────────────────────────────────── */}
        <Text className="text-lg font-black text-slate-800 mb-3 px-1">
          Manage my Work
        </Text>
        <View className="flex-row gap-3 mb-6">
          {MANAGE_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.label}
              className="flex-1 bg-white border border-slate-100 rounded-2xl p-4 items-center gap-2"
              style={{ shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
            >
              <Text className="text-3xl">{item.icon}</Text>
              <Text className="text-[11px] font-bold text-slate-600 text-center">{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Quick Stats ─────────────────────────────────────────────── */}
        <View className="flex-row gap-3 mb-6">
          {[
            { label: "Today",     val: todayQuery.data?.data?.length },
            { label: "This Week", val: weekQuery.data?.data?.length },
            { label: "Month",     val: monthQuery.data?.data?.length },
          ].map((s) => (
            <View key={s.label} className="flex-1 bg-slate-50 border border-slate-100 p-3 rounded-2xl items-center">
              <Text className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</Text>
              <Text className="text-base font-black text-slate-700 mt-1">{s.val ?? "—"}</Text>
            </View>
          ))}
        </View>

        {/* ── Earnings card ───────────────────────────────────────────── */}
        <View className="bg-purple-700 rounded-3xl p-5 mb-6">
          <Text className="text-white/90 text-base font-semibold">
            {user?.name?.split(" ")[0] ?? "Collector"}, you earned
          </Text>
          <Text className="text-white text-4xl font-black mt-2">
            {monthQuery.isLoading ? "…" : `₹${earnings.net.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
          </Text>
          <Text className="text-white/70 text-xs mt-1">so far this month · {monthLabel}</Text>
          <View className="flex-row gap-3 mt-4">
            <TouchableOpacity
              className="flex-1 bg-orange-500 rounded-xl py-2 items-center"
              onPress={() => setSelectedMonth((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
            >
              <Text className="text-white text-xs font-black">← Prev</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-white/20 rounded-xl py-2 items-center"
              onPress={() => setSelectedMonth(new Date())}
            >
              <Text className="text-white text-xs font-black">Current</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Settings ────────────────────────────────────────────────── */}
        <View className="bg-slate-50 border border-slate-100 rounded-3xl p-5 mb-6">
          <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">
            Device Settings
          </Text>
          <View className="flex-row justify-between items-center py-3 border-b border-slate-100">
            <View className="flex-1 pr-4">
              <Text className="text-sm font-bold text-slate-700">GPS Location Sharing</Text>
              <Text className="text-xs text-slate-400 mt-0.5">Allow patient live tracking</Text>
            </View>
            <Switch value={shareLocation} onValueChange={setShareLocation} trackColor={{ true: "#0F6E56" }} />
          </View>
          <View className="flex-row justify-between items-center py-3">
            <View className="flex-1 pr-4">
              <Text className="text-sm font-bold text-slate-700">Push Notifications</Text>
              <Text className="text-xs text-slate-400 mt-0.5">Receive assignment updates</Text>
            </View>
            <Switch value={receiveNotifications} onValueChange={setReceiveNotifications} trackColor={{ true: "#0F6E56" }} />
          </View>
        </View>

        {/* ── Logout ──────────────────────────────────────────────────── */}
        <TouchableOpacity
          className="w-full bg-red-500 rounded-2xl py-4 items-center justify-center mb-8"
          onPress={async () => { await logout(); router.replace("/(auth)/login" as never); }}
        >
          <Text className="text-white font-black text-sm">Logout Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}
