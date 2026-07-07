import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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

  const payment = appointment.payment;
  const isDone = appointment.status === "completed" || appointment.status === "collected" || appointment.status === "cancelled";

  return (
    <TouchableOpacity
      className="bg-white border border-slate-100 rounded-2xl p-4 mb-4"
      style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 pr-2">
          {isDone ? (
            <Text className="text-base font-bold text-slate-800">
              Task {appointment.status === "cancelled" ? "Cancelled" : "Completed"}
            </Text>
          ) : (
            <>
              <Text className="text-base font-bold text-slate-800">
                {appointment.patient?.name ?? "Patient Name"}
              </Text>
              <Text className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                <Ionicons name="location-outline" size={12} color="#94A3B8" /> {firstLineAddress}
              </Text>
            </>
          )}
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

      {/* Payment Badge */}
      {payment && (
        <View className="mb-2">
          {payment.paymentType === "pay_on_collection" && payment.paymentStatus === "pending" && (
            <View className="bg-orange-100 border border-orange-200 rounded-full px-3 py-1 self-start">
              <Text className="text-xs font-bold text-orange-700">
                ₹{payment.totalAmount} to collect
              </Text>
            </View>
          )}
          {payment.paymentType === "pay_on_collection" && payment.paymentStatus === "paid" && (
            <View className="bg-green-100 border border-green-200 rounded-full px-3 py-1 self-start flex-row items-center gap-1">
              <Ionicons name="checkmark" size={12} color="#15803D" />
              <Text className="text-xs font-bold text-green-700">
                Payment done
              </Text>
            </View>
          )}
          {payment.paymentType === "online_prepaid" && (
            <View className="bg-slate-100 border border-slate-200 rounded-full px-3 py-1 self-start">
              <Text className="text-xs font-bold text-slate-500">
                Paid online
              </Text>
            </View>
          )}
        </View>
      )}

      <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-slate-100">
        {showDistance && !isDone && (
          <View className="flex-row items-center gap-1">
            <Ionicons name="car-outline" size={12} color="#047857" />
            <Text className="text-[11px] font-bold text-emerald-700">
              {mockDistance}
            </Text>
          </View>
        )}
        <View className="flex-1" />
        {!isDone ? (
          <View className="bg-emerald-800 px-3.5 py-1.5 rounded-lg">
            <Text className="text-white text-xs font-bold">View Details</Text>
          </View>
        ) : payment?.paymentType === "pay_on_collection" && payment?.paymentStatus === "pending" ? (
          <View className="bg-orange-600 px-3.5 py-1.5 rounded-lg">
            <Text className="text-white text-xs font-bold">Collect Payment</Text>
          </View>
        ) : (
          <View className="bg-slate-100 px-3.5 py-1.5 rounded-lg">
            <Text className="text-slate-500 text-xs font-bold">View Summary</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
