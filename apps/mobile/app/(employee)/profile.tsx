import React, { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/store/auth-store";
import { getHistory, getMyPayroll } from "@/api/employee";
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

function formatMoney(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

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

  const monthStr = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, "0")}`;
  const payrollQuery = useQuery({
    queryKey: ["my-payroll", monthStr],
    queryFn: () => getMyPayroll(monthStr),
  });
  const payroll = payrollQuery.data?.data;

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "EM";

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
    : "—";

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
          {[
            { label: "Samples Done", value: payroll ? String(payroll.completedSamples) : "—", color: "#101828" },
            { label: "Orders Done", value: payroll ? String(payroll.completedOrders) : "—", color: "#101828" },
            { label: "Incentives", value: payroll ? `+ ${formatMoney(payroll.incentives)}` : "—", color: "#16a34a" },
            { label: "Deductions", value: payroll ? `− ${formatMoney(payroll.cancellationDeductions + payroll.absentDeductions + payroll.lateArrivalDeductions + payroll.manualDeductions)}` : "—", color: "#dc2626" },
            { label: "Star Bonus", value: payroll ? `+ ${formatMoney(payroll.starBonus)}` : "—", color: "#d97706" },
            { label: "Referral Bonus", value: payroll ? `+ ${formatMoney(payroll.referralBonus)}` : "—", color: "#7c3aed" },
          ].map((stat) => (
            <View
              key={stat.label}
              className="bg-white border border-slate-100 rounded-2xl p-4"
              style={{ width: "47%", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
            >
              <Text className="text-xs text-slate-400 font-semibold mb-1">{stat.label}</Text>
              <Text className="text-lg font-black" style={{ color: stat.color }}>
                {stat.value}
              </Text>
            </View>
          ))}
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
            {payrollQuery.isLoading ? "…" : payroll ? formatMoney(payroll.netPay) : "₹0"}
          </Text>
          <Text className="text-white/70 text-xs mt-1">so far this month · {monthLabel}</Text>

          {/* Breakdown */}
          {payroll && (
            <View className="mt-4 bg-white/10 rounded-2xl p-4 gap-2">
              {[
                { label: "Completed Slots", value: payroll.completedSamples.toString(), color: "#fff" },
                { label: "Incentives (₹25/slot)", value: formatMoney(payroll.incentives), color: "#fff" },
                { label: "Bonuses", value: `+${formatMoney(payroll.starBonus + payroll.referralBonus + payroll.manualBonuses)}`, color: "#fcd34d" },
                { label: "Deductions", value: `-${formatMoney(payroll.cancellationDeductions + payroll.absentDeductions + payroll.lateArrivalDeductions + payroll.manualDeductions)}`, color: "#fca5a5" },
              ].map((item) => (
                <View key={item.label} className="flex-row justify-between items-center">
                  <Text className="text-white/70 text-xs font-medium">{item.label}</Text>
                  <Text className="text-xs font-black" style={{ color: item.color }}>{item.value}</Text>
                </View>
              ))}
            </View>
          )}

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
