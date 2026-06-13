import React, { useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import { getHistory } from "@/api/employee";
import { Screen } from "@/components/screen";
import { TaskCard } from "@/components/employee/TaskCard";
import { EmptyState } from "@/components/employee/EmptyState";

type Period = "today" | "week" | "month";

const PERIOD_LABELS: Record<Period, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
};

export default function HistoryScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("week");

  const query = useQuery({
    queryKey: ["appointments-history", period],
    queryFn: () => getHistory(period),
  });

  const historyList = query.data?.data ?? [];

  return (
    <Screen title="Collection History">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Period filter */}
        <View className="flex-row p-1 rounded-2xl bg-slate-50 border border-slate-100 mb-6">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <TouchableOpacity
              key={p}
              className={`flex-1 py-2.5 rounded-xl items-center ${
                period === p ? "bg-white shadow-sm" : ""
              }`}
              onPress={() => setPeriod(p)}
            >
              <Text
                className={`text-xs font-bold ${
                  period === p ? "text-emerald-800" : "text-slate-400"
                }`}
              >
                {PERIOD_LABELS[p]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary */}
        <View className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex-row items-center justify-between mb-6">
          <Text className="text-xs font-bold text-emerald-800">
            Total Completed Collections
          </Text>
          <Text className="text-lg font-black text-emerald-950">
            {query.isLoading ? "—" : historyList.length}
          </Text>
        </View>

        {query.isLoading ? (
          <View className="py-20">
            <ActivityIndicator size="large" color="#0F6E56" />
          </View>
        ) : historyList.length === 0 ? (
          <EmptyState
            message="No past collections found"
            subMessage={`No completed visits recorded for ${PERIOD_LABELS[period].toLowerCase()}.`}
          />
        ) : (
          <View>
            {historyList.map((app) => (
              <View key={app.id}>
                <TaskCard
                  appointment={app}
                  onPress={() => router.push(`/(employee)/task/${app.id}`)}
                  showDistance={false}
                />
                {/* If collected but no report uploaded */}
                {(app.status as string) === "collected" && !app.report && (
                  <TouchableOpacity
                    className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5 flex-row items-center gap-2 -mt-1 mb-3 mx-0.5"
                    onPress={() => router.push(`/(employee)/task/upload-report/${app.id}`)}
                  >
                    <Ionicons name="warning" size={14} color="#EA580C" />
                    <Text className="text-orange-600 text-xs font-bold">
                      Report pending upload
                    </Text>
                    <Text className="text-orange-500 text-xs font-semibold ml-auto">
                      Upload →
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
