import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import type { User } from "@lab-app/shared";

import { useAuthStore } from "@/store/auth-store";

export function RoleGate({
  allow,
  children
}: {
  allow: User["role"][];
  children: React.ReactNode;
}) {
  const hydrated = useAuthStore((state) => state.hydrated);
  const user = useAuthStore((state) => state.user);

  if (!hydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-mist">
        <ActivityIndicator size="large" color="#0F766E" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!allow.includes(user.role)) {
    return <Redirect href="/" />;
  }

  return <>{children}</>;
}
