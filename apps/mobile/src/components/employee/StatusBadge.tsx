import React from "react";
import { Text, View } from "react-native";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normStatus = status.toLowerCase();

  let bgClass = "bg-amber-100 border-amber-200";
  let textClass = "text-amber-700";
  let displayLabel = status.toUpperCase();

  if (normStatus === "pending" || normStatus === "assigned") {
    bgClass = "bg-amber-50 border border-amber-200";
    textClass = "text-amber-700";
    displayLabel = "PENDING";
  } else if (normStatus === "accepted") {
    bgClass = "bg-blue-50 border border-blue-200";
    textClass = "text-blue-700";
    displayLabel = "ACCEPTED";
  } else if (normStatus === "en_route" || normStatus === "enroute") {
    bgClass = "bg-orange-50 border border-orange-200";
    textClass = "text-orange-700";
    displayLabel = "EN ROUTE";
  } else if (normStatus === "collected") {
    bgClass = "bg-green-50 border border-green-200";
    textClass = "text-green-700";
    displayLabel = "COLLECTED";
  } else if (normStatus === "completed") {
    bgClass = "bg-emerald-100 border border-emerald-300";
    textClass = "text-emerald-800";
    displayLabel = "COMPLETED";
  }

  return (
    <View className={`px-2 py-0.5 rounded-md border ${bgClass}`}>
      <Text className={`text-[10px] font-bold tracking-wider ${textClass}`}>
        {displayLabel}
      </Text>
    </View>
  );
}
