import { Tabs } from "expo-router";

import { RoleGate } from "@/components/role-gate";
import { TopMenu } from "@/components/top-menu";

const patientMenu = [
  { label: "Home", href: "/(patient)" },
  { label: "Book Test", href: "/(patient)/tests" },
  { label: "Packages", href: "/(patient)/packages" },
  { label: "Cart", href: "/(patient)/cart" },
  { label: "Orders", href: "/(patient)/orders" },
  { label: "Reports", href: "/(patient)/reports" },
  { label: "Appointments", href: "/(patient)/appointments" },
  { label: "Notifications", href: "/(patient)/notifications" },
  { label: "Profile", href: "/(patient)/profile" },
];

export default function PatientLayout() {
  return (
    <RoleGate allow={["patient"]}>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerTitleAlign: "center",
          headerLeft: () => <TopMenu items={patientMenu} tintColor="#C41E3A" />,
          tabBarButton: () => null,
          tabBarStyle: { display: "none" },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: "Home" }}
        />
        <Tabs.Screen
          name="tests"
          options={{ title: "Book Test" }}
        />
        <Tabs.Screen
          name="cart"
          options={{ title: "Cart" }}
        />
        <Tabs.Screen
          name="orders"
          options={{ title: "Orders" }}
        />
        <Tabs.Screen
          name="profile"
          options={{ title: "Profile" }}
        />
        {/* Hidden screens */}
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="packages" options={{ href: null }} />
        <Tabs.Screen name="checkout" options={{ href: null }} />
        <Tabs.Screen name="appointments" options={{ href: null }} />
        <Tabs.Screen name="reports" options={{ href: null }} />
        <Tabs.Screen name="book" options={{ href: null }} />
        <Tabs.Screen name="report/[id]" options={{ href: null }} />
        <Tabs.Screen name="tests/[slug]" options={{ href: null }} />
        <Tabs.Screen name="packages/[slug]" options={{ href: null }} />
        <Tabs.Screen name="orders/[id]" options={{ href: null }} />
        <Tabs.Screen name="checkout/success" options={{ href: null }} />
      </Tabs>
    </RoleGate>
  );
}
