import { useEffect } from "react";
import { router, useRootNavigationState } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuthStore } from "@/store/auth-store";

export default function IndexScreen() {
  const rootNavigationState = useRootNavigationState();
  const hydrated = useAuthStore((state) => state.hydrated);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!hydrated || !rootNavigationState?.key) return;

    if (!user) {
      router.replace("/(auth)/login");
    } else if (user.role === "admin") {
      router.replace("/(admin)");
    } else if (user.role === "employee") {
      router.replace("/(employee)");
    } else {
      router.replace("/(patient)");
    }
  }, [hydrated, user, rootNavigationState?.key]);

  return (
    <View className="flex-1 items-center justify-center bg-mist">
      <ActivityIndicator size="large" color="#0F766E" />
    </View>
  );
}
