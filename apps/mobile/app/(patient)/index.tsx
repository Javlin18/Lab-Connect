import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { getMyOrders, getPackages, getTests, type HealthPackage, type Test } from "@/api/patient";
import { getPendingFeedback } from "@/api/feedback";
import { useAuthStore } from "@/store/auth-store";
import { useServerCart } from "@/hooks/useServerCart";

const price = (item: { price: number; discountPrice?: number | null }) =>
  item.discountPrice ?? item.price;

function TestCard({ test }: { test: Test }) {
  const { addItem, isInCart, isAddingItem } = useServerCart();
  const inCart = isInCart(test.id);
  return (
    <TouchableOpacity
      onPress={() => router.push(`/(patient)/tests/${test.slug}`)}
      className="w-44 bg-white rounded-2xl p-4 mr-3 border border-gray-100 shadow-sm"
    >
      <Text className="font-bold text-[#1a1a1a] text-sm" numberOfLines={2}>
        {test.name}
      </Text>
      <Text className="text-gray-400 text-xs mt-1">
        {test.parameters?.length ?? 0} parameters
      </Text>
      {test.preparationInstructions?.toLowerCase().includes("fast") ? (
        <Text className="bg-orange-100 text-orange-600 text-[10px] px-2 py-0.5 rounded-full self-start mt-2">
          Fasting
        </Text>
      ) : null}
      <View className="flex-row items-end gap-1 mt-3">
        {test.discountPrice ? (
          <Text className="text-gray-400 text-xs line-through">₹{test.price}</Text>
        ) : null}
        <Text className="text-[#C41E3A] text-base font-bold">₹{price(test)}</Text>
      </View>
      <TouchableOpacity
        disabled={inCart || isAddingItem}
        onPress={() => addItem({ testId: test.id })}
        className={`mt-3 py-2 rounded-xl flex-row items-center justify-center gap-1 ${inCart ? "bg-green-50" : "bg-[#0F6E56]"}`}
      >
        {inCart && <Ionicons name="checkmark" size={14} color="#16A34A" />}
        <Text className={`font-bold text-xs ${inCart ? "text-green-600" : "text-white"}`}>
          {inCart ? "Added" : isAddingItem ? "…" : "+ Add"}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function PackageCard({ item }: { item: HealthPackage }) {
  const { addItem, isInCart, isAddingItem } = useServerCart();
  const inCart = isInCart(item.id);
  const currentPrice = price(item);
  return (
    <TouchableOpacity
      onPress={() => router.push(`/(patient)/packages/${item.slug}`)}
      className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 flex-row items-center"
    >
      <View className="flex-1 pr-3">
        <Text className="font-bold text-[#1a1a1a] text-sm" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-gray-500 text-xs mt-0.5">
          {item.tests?.length ?? 0} tests included
        </Text>
        <Text className="text-gray-400 text-xs mt-1" numberOfLines={1}>
          {(item.tests ?? [])
            .slice(0, 3)
            .map((t) => t.name)
            .join(", ")}
        </Text>
      </View>
      <View className="items-end">
        {item.discountPrice ? (
          <Text className="text-gray-400 text-xs line-through">₹{item.price}</Text>
        ) : null}
        <Text className="text-[#C41E3A] text-base font-bold">₹{currentPrice}</Text>
        <Text className="text-[#0F6E56] text-xs font-bold mt-1">View →</Text>
      </View>
    </TouchableOpacity>
  );
}

const QUICK_ACTIONS = [
  { icon: "flask-outline", label: "Book a Test", href: "/(patient)/tests" },
  { icon: "cube-outline", label: "Health Packages", href: "/(patient)/packages" },
  { icon: "clipboard-outline", label: "My Reports", href: "/(patient)/orders" },
  { icon: "location-outline", label: "Track Collection", href: "/(patient)/orders" },
] as const;

export default function PatientHomeScreen() {
  const user = useAuthStore((s) => s.user);
  const testsQuery = useQuery({
    queryKey: ["patient-tests", "popular"],
    queryFn: () => getTests({ popular: true, limit: 6 }),
  });
  const packagesQuery = useQuery({
    queryKey: ["patient-packages", "home"],
    queryFn: () => getPackages({ limit: 3 }),
  });
  const ordersQuery = useQuery({
    queryKey: ["patient-orders", "active"],
    queryFn: () => getMyOrders(),
  });
  const activeOrder = (ordersQuery.data?.data ?? []).find(
    (o) => o.appointment && o.appointment.status !== "completed"
  );
  const pendingQuery = useQuery({
    queryKey: ["feedback-pending"],
    queryFn: () => getPendingFeedback(),
  });
  const firstPending = (pendingQuery.data?.data ?? [])[0] ?? null;
  const [feedbackDismissed, setFeedbackDismissed] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F5]" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Bar ── */}
        <View className="flex-row justify-between items-start px-5 pt-4 pb-2">
          <View>
            <Text className="text-lg font-bold text-[#1a1a1a]">
              Hi, {user?.name ?? "there"}
            </Text>
            <Text className="text-xs text-gray-500 mt-0.5">
              Book a test from the comfort of your home
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(patient)/notifications")}
            className="relative mt-1"
          >
            <Ionicons name="notifications-outline" size={24} color="#1a1a1a" />
            <View className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#C41E3A] border-2 border-[#F5F5F5]" />
          </TouchableOpacity>
        </View>

        {/* ── Search Bar ── */}
        <TouchableOpacity
          onPress={() => router.push("/(patient)/tests")}
          className="mx-5 mt-3 bg-white rounded-2xl border border-gray-100 px-4 py-3.5 flex-row items-center shadow-sm"
        >
          <Ionicons name="search" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
          <Text className="text-gray-400 text-sm">Search tests, packages...</Text>
        </TouchableOpacity>

        {/* ── Quick Actions ── */}
        <View className="flex-row flex-wrap gap-3 px-5 mt-5">
          {QUICK_ACTIONS.map(({ icon, label, href }) => (
            <TouchableOpacity
              key={label}
              onPress={() => router.push(href as any)}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm items-center justify-center"
              style={{ width: "47%" }}
            >
              <Ionicons name={icon as any} size={32} color="#0F6E56" style={{ marginBottom: 8 }} />
              <Text className="font-bold text-[#1a1a1a] text-xs text-center">{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Active Booking Banner ── */}
        {activeOrder ? (
          <View className="mx-5 mt-5 bg-[#0F6E56] rounded-2xl p-4">
            <Text className="text-white font-bold text-sm">
              Sample collection scheduled
            </Text>
            <Text className="text-white/80 text-xs mt-1">
              {activeOrder.items?.slot ?? "Slot booked"} •{" "}
              {activeOrder.appointment?.employee?.name ?? "Collector assigned"}
            </Text>
            <View className="flex-row items-center gap-2 mt-3">
              <View className="bg-white/20 px-2 py-1 rounded-full">
                <Text className="text-white text-xs font-bold capitalize">
                  {activeOrder.appointment?.status ?? "Confirmed"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push(`/(patient)/orders/${activeOrder.id}`)}
                className="bg-white rounded-xl px-3 py-1.5"
              >
                <Text className="text-[#0F6E56] font-bold text-xs">Track Now →</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* ── Pending Feedback Card ── */}
        {firstPending && !feedbackDismissed ? (
          <View className="mx-5 mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <View className="flex-row items-center gap-1">
                  <Ionicons name="star" size={14} color="#92400E" />
                  <Text className="font-black text-amber-800 text-sm">You have a pending review</Text>
                </View>
                <Text className="text-amber-600 text-xs mt-0.5" numberOfLines={1}>
                  {firstPending.employeeName ?? "Your collector"} • {firstPending.slot}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setFeedbackDismissed(true)} className="ml-2 px-2">
                <Text className="text-amber-400 text-xs">✕</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() =>
                router.push(`/(patient)/feedback/${firstPending.appointmentId}` as any)
              }
              className="mt-3 bg-amber-500 rounded-xl py-2.5 items-center"
            >
              <Text className="text-white font-bold text-sm">Rate Now →</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ── Popular Tests ── */}
        <View className="flex-row justify-between items-center px-5 mt-7 mb-3">
          <Text className="text-base font-bold text-[#1a1a1a]">Popular Tests</Text>
          <TouchableOpacity onPress={() => router.push("/(patient)/tests")}>
            <Text className="text-[#0F6E56] font-bold text-sm">View All →</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        >
          {(testsQuery.data?.data ?? []).map((test) => (
            <TestCard key={test.id} test={test} />
          ))}
        </ScrollView>

        {/* ── Health Packages ── */}
        <View className="flex-row justify-between items-center px-5 mt-7 mb-3">
          <Text className="text-base font-bold text-[#1a1a1a]">Health Packages</Text>
          <TouchableOpacity onPress={() => router.push("/(patient)/packages")}>
            <Text className="text-[#0F6E56] font-bold text-sm">View All →</Text>
          </TouchableOpacity>
        </View>
        <View className="px-5">
          {(packagesQuery.data?.data ?? []).map((item) => (
            <PackageCard key={item.id} item={item} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
