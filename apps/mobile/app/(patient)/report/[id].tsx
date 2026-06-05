import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { Text } from "react-native";

import { getReport } from "@/api/reports";
import { resolveAssetUrl } from "@/lib/env";

import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Screen } from "@/components/screen";

export default function PatientReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useQuery({
    enabled: Boolean(id),
    queryFn: () => getReport(id),
    queryKey: ["report", id]
  });

  const payload = query.data?.data;

  if (!payload) {
    return (
      <Screen title="Report">
        <Text className="text-sm text-slate-500">Loading...</Text>
      </Screen>
    );
  }

  return (
    <Screen
      subtitle={payload.report.id}
      title="Report"
    >
      <Card className="gap-3">
        <Text className="text-base font-semibold text-ink">PDF ready</Text>
        <Text className="text-sm text-slate-500">{payload.report.uploadedAt}</Text>
        <Button onPress={() => Linking.openURL(resolveAssetUrl(payload.downloadUrl))}>Open PDF</Button>
      </Card>
    </Screen>
  );
}
