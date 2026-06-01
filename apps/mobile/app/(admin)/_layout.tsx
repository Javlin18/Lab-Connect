import { Tabs } from "expo-router";

import { RoleGate } from "@/components/role-gate";

export default function AdminLayout() {
  return (
    <RoleGate allow={["admin"]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#0F766E",
          tabBarStyle: {
            height: 66,
            paddingBottom: 8,
            paddingTop: 8
          }
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: "Home" }}
        />
        <Tabs.Screen
          name="appointments"
          options={{ title: "Appointments" }}
        />
        <Tabs.Screen
          name="employees"
          options={{ title: "Employees" }}
        />
        <Tabs.Screen
          name="appointment/[id]"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="new-appointment"
          options={{ href: null }}
        />
      </Tabs>
    </RoleGate>
  );
}
