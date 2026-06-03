import { Tabs } from "expo-router";
import { RoleGate } from "@/components/role-gate";
import { TopMenu } from "@/components/top-menu";

const employeeMenu = [
  { label: "Tasks", href: "/(employee)" },
  { label: "History", href: "/(employee)/history" },
  { label: "Notifications", href: "/(employee)/notifications" },
  { label: "Profile", href: "/(employee)/profile" },
];

export default function EmployeeLayout() {
  return (
    <RoleGate allow={["employee"]}>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerTitleAlign: "center",
          headerLeft: () => <TopMenu items={employeeMenu} tintColor="#0F6E56" />,
          tabBarButton: () => null,
          tabBarStyle: { display: "none" },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: "Tasks" }}
        />
        <Tabs.Screen
          name="history"
          options={{ title: "History" }}
        />
        <Tabs.Screen
          name="profile"
          options={{ title: "Profile" }}
        />
        {/* Hidden screens — not shown in tab bar */}
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="task/[id]" options={{ href: null }} />
        <Tabs.Screen name="task/navigate/[id]" options={{ href: null }} />
        <Tabs.Screen name="task/collect/[id]" options={{ href: null }} />
      </Tabs>
    </RoleGate>
  );
}
