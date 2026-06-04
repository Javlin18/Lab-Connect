import React from "react";
import { Text } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RoleGate } from "@/components/role-gate";

export default function EmployeeLayout() {
  const insets = useSafeAreaInsets();

  return (
    <RoleGate allow={["employee"]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#0F6E56",
          tabBarInactiveTintColor: "#94a3b8",
          tabBarStyle: {
            height: 56 + insets.bottom,
            paddingBottom: insets.bottom || 8,
            paddingTop: 8,
            backgroundColor: "#FFFFFF",
            borderTopWidth: 1,
            borderTopColor: "#F1F5F9",
            elevation: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Tasks",
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>📋</Text>,
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: "History",
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>🕐</Text>,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>👤</Text>,
          }}
        />
        {/* Hidden screens */}
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="task/[id]" options={{ href: null }} />
        <Tabs.Screen name="task/navigate/[id]" options={{ href: null }} />
        <Tabs.Screen name="task/collect/[id]" options={{ href: null }} />
        <Tabs.Screen name="task/upload-report/[id]" options={{ href: null }} />
      </Tabs>
    </RoleGate>
  );
}
