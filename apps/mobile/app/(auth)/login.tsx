import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type RoleCard = {
  label: string;
  description: string;
  icon: string;
  route: string;
  bg: string;
  border: string;
  iconBg: string;
};

const ROLES: RoleCard[] = [
  {
    label: "Patient",
    description: "Book tests, track collection, view reports",
    icon: "🏥",
    route: "/(auth)/patient-login",
    bg: "#F0FDF4",
    border: "#BBF7D0",
    iconBg: "#DCFCE7",
  },
  {
    label: "Employee",
    description: "Manage collections and assigned tasks",
    icon: "🧪",
    route: "/(auth)/employee-login",
    bg: "#F0FDFA",
    border: "#99F6E4",
    iconBg: "#CCFBF1",
  },
  {
    label: "Admin",
    description: "Oversee operations, staff and reports",
    icon: "🛡️",
    route: "/(auth)/employee-login",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    iconBg: "#DBEAFE",
  },
];

export default function RoleSelectorScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-10 pb-8">

        {/* Header */}
        <View className="items-center mb-10">
          <View className="w-20 h-20 rounded-3xl bg-[#0F6E56] items-center justify-center mb-4">
            <Text className="text-4xl">🧬</Text>
          </View>
          <Text className="text-2xl font-bold text-[#101828]">LabConnect</Text>
          <Text className="text-sm text-[#9CA3AF] mt-1 text-center">
            Who are you?
          </Text>
        </View>

        {/* Role cards */}
        <View className="gap-4">
          {ROLES.map((role) => (
            <Pressable
              key={role.label}
              onPress={() => router.push(role.route as any)}
              style={{ backgroundColor: role.bg, borderColor: role.border, borderWidth: 1 }}
              className="flex-row items-center rounded-2xl p-4 active:opacity-70"
            >
              <View
                style={{ backgroundColor: role.iconBg }}
                className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
              >
                <Text className="text-3xl">{role.icon}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-[#101828]">{role.label}</Text>
                <Text className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">
                  {role.description}
                </Text>
              </View>
              <Text className="text-[#9CA3AF] text-lg">›</Text>
            </Pressable>
          ))}
        </View>

        <View className="flex-1" />
        <Text className="text-xs text-[#D1D5DB] text-center mt-6">
          LabConnect Medical v1.0.0
        </Text>
      </View>
    </SafeAreaView>
  );
}
