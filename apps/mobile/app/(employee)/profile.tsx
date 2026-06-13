import React, { useMemo, useState } from "react";
import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/store/auth-store";
import { getHistory } from "@/api/employee";
import { Screen } from "@/components/screen";
import type { Appointment } from "@lab-app/shared";

const SLOT_RATE = 140;
const ADD_ON_DEALS = 125;
const FAMILY_MEMBER_INCENTIVE = 25;
const DOCTOR_CONSULT_INCENTIVE = 0;
const STAR_RATING_INCENTIVE = 0;
const EXTRA_PETROL = 25;
const GPS_CANCELLATION = 40;
const OTHERS = 0;
const FINES = 870;
const TDS_RATE = 0.01;

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
  return `Rs. ${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export default function EmployeeProfileScreen() {

  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const [shareLocation, setShareLocation] = useState(true);
  const [receiveNotifications, setReceiveNotifications] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());

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

  const earnings = useMemo(() => {
    const completedSlots = (monthQuery.data?.data ?? []).filter((appointment) =>
      isSameMonth(parseAppointmentDate(appointment), selectedMonth)
    );
    const slotTotal = completedSlots.length * SLOT_RATE;
    const gross =
      slotTotal +
      ADD_ON_DEALS +
      FAMILY_MEMBER_INCENTIVE +
      DOCTOR_CONSULT_INCENTIVE +
      STAR_RATING_INCENTIVE +
      EXTRA_PETROL +
      GPS_CANCELLATION +
      OTHERS;
    const tds = gross * TDS_RATE;
    const net = gross - FINES - tds;

    return { completedSlots, gross, net, slotTotal, tds };
  }, [monthQuery.data?.data, selectedMonth]);

  const breakdown = [
    { label: `Slots ${earnings.completedSlots.length} x ${SLOT_RATE}`, value: earnings.slotTotal, strong: true },
    { label: "+ Incentive - Add on Deals", value: ADD_ON_DEALS },
    { label: "+ Incentive - Add on Family Member", value: FAMILY_MEMBER_INCENTIVE },
    { label: "+ Incentive - Doctor Consult", value: DOCTOR_CONSULT_INCENTIVE },
    { label: "+ Incentive - Star Rating", value: STAR_RATING_INCENTIVE },
    { label: "+ Extra Petrol", value: EXTRA_PETROL },
    { label: "+ GPS Cancellation", value: GPS_CANCELLATION },
    { label: "+ Others", value: OTHERS },
    { label: "- Fines", value: -FINES },
    { label: "- TDS @ 1%", value: -earnings.tds },
    { label: "- Other Deductions", value: 0 },
  ];

  const monthLabel = selectedMonth.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

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

        {/* Earnings */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-black text-slate-800">My Earnings</Text>
            <Text className="text-xs font-bold text-slate-400">{monthLabel}</Text>
          </View>

          <View className="bg-purple-700 rounded-3xl p-5 overflow-hidden">
            <Text className="text-white/90 text-base font-semibold">
              {user?.name?.split(" ")[0] ?? "Collector"}, you earned
            </Text>
            <View className="flex-row items-end flex-wrap mt-3">
              <Text className="text-white text-4xl font-black">
                {monthQuery.isLoading ? "..." : formatMoney(earnings.net)}
              </Text>
              <Text className="text-white font-bold mb-1 ml-2">so far this month</Text>
            </View>

            <View className="h-px bg-white/25 my-5" />

            <View className="gap-1.5">
              {breakdown.map((item) => (
                <View className="flex-row justify-between gap-4" key={item.label}>
                  <Text className={`flex-1 text-white ${item.strong ? "font-black" : "font-semibold"}`}>
                    {item.label}
                  </Text>
                  <Text className={`text-white ${item.strong ? "font-black" : "font-semibold"}`}>
                    : {earnings.slotTotal || item.value ? item.value.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "0"}
                  </Text>
                </View>
              ))}
            </View>

            <Text className="text-white/75 text-xs font-semibold mt-5">
              Bonuses, deductions, and taxes apply on top.
            </Text>
          </View>

          <View className="flex-row gap-3 mt-3">
            <TouchableOpacity
              className="flex-1 bg-orange-500 rounded-2xl py-3 items-center"
              onPress={() => setSelectedMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
            >
              <Text className="text-white text-xs font-black">Previous Month</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-slate-100 rounded-2xl py-3 items-center"
              onPress={() => setSelectedMonth(new Date())}
            >
              <Text className="text-slate-700 text-xs font-black">Current Month</Text>
            </TouchableOpacity>
          </View>

          <View className="mt-5">
            <Text className="text-base font-black text-slate-800 mb-3">
              Monthly Earning Opportunities
            </Text>
            <View className="bg-orange-50 border border-orange-100 rounded-3xl overflow-hidden">
              {[
                { amount: 49930, rate: "80%" },
                { amount: 43210, rate: "70%" },
              ].map((target, index) => (
                <View
                  className={`p-4 ${index === 0 ? "border-b border-orange-100" : ""}`}
                  key={target.rate}
                >
                  <Text className="text-slate-700 text-base font-black">
                    Earn upto <Text className="text-orange-500">{formatMoney(target.amount)} every month</Text>
                  </Text>
                  <Text className="text-slate-500 text-sm mt-1">
                    Slot completion Rate &gt; {target.rate}
                  </Text>
                </View>
              ))}
            </View>
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
