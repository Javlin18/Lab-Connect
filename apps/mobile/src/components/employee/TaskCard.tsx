import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import type { Appointment } from "@lab-app/shared";
import { StatusBadge } from "./StatusBadge";

interface TaskCardProps {
  appointment: Appointment & { isPackage?: boolean; description?: string };
  onPress: () => void;
  showDistance?: boolean;
  distanceText?: string;
}

export function TaskCard({ appointment, onPress, showDistance = true, distanceText }: TaskCardProps) {
  const firstLineAddress = appointment.address.split(",")[0];
  const tests = appointment.testTypes ?? [];
  const testsJoined = tests.length ? tests.join(", ") : "No tests listed";
  const mockDistance = distanceText ?? `${(Math.random() * 5 + 0.5).toFixed(1)} km away`;

  return (
    <View className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm mb-3">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 pr-2">
          <Text className="text-base font-bold text-slate-800">
            {appointment.patient?.name ?? "Patient Name"}
          </Text>
          <Text className="text-xs text-slate-400 mt-0.5 line-clamp-1">
            📍 {firstLineAddress}
          </Text>
        </View>
        <StatusBadge status={appointment.status} />
      </View>

      <View className="my-2 space-y-1">
        <Text className="text-xs text-slate-500 font-semibold">
          Tests: <Text className="text-slate-600 font-normal">{testsJoined}</Text>
        </Text>
        <Text className="text-xs text-slate-500 font-semibold">
          Slot: <Text className="text-slate-600 font-normal">{appointment.slot}</Text>
        </Text>
      </View>

      <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-slate-100">
        {showDistance && (
          <Text className="text-[11px] font-bold text-emerald-700">
            🚗 {mockDistance}
          </Text>
        )}
        <TouchableOpacity
          className="bg-emerald-800 px-3.5 py-1.5 rounded-lg"
          onPress={onPress}
        >
          <Text className="text-white text-xs font-bold">View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
