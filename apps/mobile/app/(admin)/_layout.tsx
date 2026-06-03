import { Tabs } from "expo-router";

import { RoleGate } from "@/components/role-gate";
import { TopMenu } from "@/components/top-menu";

const adminMenu = [
  { label: "Home", href: "/(admin)" },
  { label: "Appointments", href: "/(admin)/appointments" },
  { label: "Employees", href: "/(admin)/employees" },
  { label: "New Appointment", href: "/(admin)/new-appointment" },
];

export default function AdminLayout() {
  return (
    <RoleGate allow={["admin"]}>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerTitleAlign: "center",
          headerLeft: () => <TopMenu items={adminMenu} tintColor="#0F766E" />,
          tabBarButton: () => null,
          tabBarStyle: { display: "none" },
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
