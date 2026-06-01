import React from "react";
import { Text, View } from "react-native";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <View className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex-row items-center justify-between mb-4">
      <Text className="text-xs font-bold text-slate-700">
        Step {currentStep} of {totalSteps}
      </Text>
      <View className="flex-row gap-1">
        {Array.from({ length: totalSteps }).map((_, idx) => {
          const stepNum = idx + 1;
          const isDone = stepNum < currentStep;
          const isActive = stepNum === currentStep;

          let colorClass = "bg-slate-200";
          if (isDone) colorClass = "bg-emerald-600";
          if (isActive) colorClass = "bg-emerald-800 scale-105";

          return (
            <View
              className={`h-2.5 w-6 rounded-full ${colorClass}`}
              key={stepNum}
            />
          );
        })}
      </View>
    </View>
  );
}
