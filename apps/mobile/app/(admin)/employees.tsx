import { useQuery } from "@tanstack/react-query";
import { Text, View } from "react-native";

import { listEmployees } from "@/api/employees";

import { Card } from "@/components/card";
import { Screen } from "@/components/screen";

export default function AdminEmployeesScreen() {
  const query = useQuery({
    queryFn: listEmployees,
    queryKey: ["employees"]
  });

  return (
    <Screen
      subtitle="Team availability and zones."
      title="Employees"
    >
      <View className="gap-3">
        {(query.data?.data ?? []).map((item) => (
          <Card
            className="gap-2"
            key={item.employee.id}
          >
            <Text className="text-base font-semibold text-ink">{item.user.name}</Text>
            <Text className="text-sm text-slate-600">{item.user.phone}</Text>
            <Text className="text-sm text-slate-600">Zone: {item.employee.zone}</Text>
            <Text className="text-sm text-slate-600">
              Available: {item.employee.isAvailable ? "Yes" : "No"}
            </Text>
            <Text className="text-sm text-slate-500">
              Location: {item.employee.currentLocation || "Not updated"}
            </Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
