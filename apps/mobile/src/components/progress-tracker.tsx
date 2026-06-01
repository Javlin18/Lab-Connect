import { Text, View } from "react-native";

import type { Appointment } from "@lab-app/shared";

import { patientStatusSteps } from "@/constants/domain";
import { formatStatus } from "@/lib/format";

export function ProgressTracker({ status }: { status: Appointment["status"] }) {
  const normalizedStatus = status === "accepted" ? "assigned" : status;
  const currentIndex = patientStatusSteps.indexOf(normalizedStatus as (typeof patientStatusSteps)[number]);

  return (
    <View className="gap-3">
      <View className="flex-row gap-2">
        {patientStatusSteps.map((step, index) => {
          const active = index <= currentIndex;

          return (
            <View
              className={`h-2 flex-1 rounded-full ${active ? "bg-brand" : "bg-slate-200"}`}
              key={step}
            />
          );
        })}
      </View>
      <View className="flex-row flex-wrap gap-x-3 gap-y-2">
        {patientStatusSteps.map((step) => (
          <Text
            className={`text-xs font-medium ${step === normalizedStatus ? "text-brand-deep" : "text-slate-500"}`}
            key={step}
          >
            {formatStatus(step)}
          </Text>
        ))}
      </View>
    </View>
  );
}
