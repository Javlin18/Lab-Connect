import React from "react";
import { Text, View } from "react-native";

interface EmptyStateProps {
  message: string;
  subMessage?: string;
}

export function EmptyState({ message, subMessage }: EmptyStateProps) {
  return (
    <View className="py-12 px-6 items-center justify-center bg-slate-50 rounded-3xl border border-slate-100/50">
      <Text className="text-3xl mb-2">🔬</Text>
      <Text className="text-sm font-bold text-slate-700 text-center">
        {message}
      </Text>
      {subMessage && (
        <Text className="text-xs text-slate-400 text-center mt-1 leading-relaxed">
          {subMessage}
        </Text>
      )}
    </View>
  );
}
