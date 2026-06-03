import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";

import { getMyOrders, type Order } from "@/api/patient";

const tabs = ["All", "Upcoming", "Completed", "Cancelled"];

function statusLabel(order: Order) {
  const status = order.appointment?.status;
  if (order.paymentStatus !== "paid") return "Payment Pending";
  if (status === "completed") return "Report Ready";
  if (status === "collected") return "Sample Collected";
  if (status === "assigned") return "Employee Assigned";
  return "Confirmed";
}

export default function OrdersScreen() {
  const [tab, setTab] = useState("All");
  const query = useQuery({ queryKey: ["patient-orders"], queryFn: () => getMyOrders() });
  const orders = (query.data?.data ?? []).filter((order) => {
    if (tab === "Completed") return order.appointment?.status === "completed";
    if (tab === "Upcoming") return order.appointment?.status !== "completed";
    if (tab === "Cancelled") return false;
    return true;
  });

  return (
    <ScrollView className="flex-1 bg-[#F5F5F5]" contentContainerClassName="p-5 pb-28">
      <Text className="text-2xl font-black text-[#1a1a1a] mt-4">My Bookings</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="my-4">
        {tabs.map((item) => <TouchableOpacity key={item} onPress={() => setTab(item)} className={`px-4 py-2 rounded-full mr-2 ${tab === item ? "bg-[#0F6E56]" : "bg-white"}`}><Text className={tab === item ? "text-white font-bold" : "text-gray-600"}>{item}</Text></TouchableOpacity>)}
      </ScrollView>
      {query.isLoading ? <ActivityIndicator color="#0F6E56" /> : orders.length === 0 ? (
        <View className="items-center mt-20"><Text className="text-xl font-black">No bookings yet</Text><TouchableOpacity onPress={() => router.push("/(patient)/tests")} className="bg-[#0F6E56] rounded-xl px-6 py-4 mt-5"><Text className="text-white font-bold">Book your first test</Text></TouchableOpacity></View>
      ) : orders.map((order) => (
        <View key={order.id} className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
          <View className="flex-row justify-between">
            <Text className="font-black">#{order.id.slice(0, 8)}</Text>
            <Text className="bg-[#E8F5F1] text-[#0F6E56] px-2 py-1 rounded-full text-xs font-bold">{statusLabel(order)}</Text>
          </View>
          <Text className="text-gray-500 mt-2">{order.items?.testTypes?.slice(0, 2).join(", ") ?? "Health tests"}</Text>
          <Text className="text-gray-500 text-xs mt-1">{order.items?.slot ?? order.createdAt}</Text>
          <TouchableOpacity onPress={() => router.push(`/(patient)/orders/${order.id}`)} className="border border-[#0F6E56] rounded-xl py-3 mt-4">
            <Text className="text-[#0F6E56] font-bold text-center">View Details</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}
