import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { getOrderById } from "@/api/patient";

const steps = ["Booked", "Confirmed", "Employee Assigned", "On the Way", "Collected", "Report Ready"];

function stepIndex(status?: string) {
  if (status === "completed") return 5;
  if (status === "collected" || status === "processing") return 4;
  if (status === "en_route") return 3;
  if (status === "assigned" || status === "accepted") return 2;
  return 1;
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useQuery({ queryKey: ["patient-order", id], queryFn: () => getOrderById(id) });
  const order = query.data?.data;

  if (query.isLoading || !order) {
    return <View className="flex-1 items-center justify-center bg-[#F5F5F5]"><ActivityIndicator color="#0F6E56" /></View>;
  }

  const current = stepIndex(order.appointment?.status);

  return (
    <ScrollView className="flex-1 bg-[#F5F5F5]" contentContainerClassName="p-5 pb-28">
      <TouchableOpacity onPress={() => router.back()} className="mt-4"><Text className="text-[#0F6E56] font-bold">Back</Text></TouchableOpacity>
      <Text className="text-2xl font-black text-[#1a1a1a] mt-4">Order #{order.id.slice(0, 8)}</Text>
      <View className="bg-white rounded-2xl p-4 mt-5 border border-gray-100">
        <Text className="font-black mb-4">Live Status</Text>
        {steps.map((step, index) => (
          <View key={step} className="flex-row items-center mb-3">
            <View className={`h-6 w-6 rounded-full items-center justify-center ${index <= current ? "bg-[#0F6E56]" : "bg-gray-200"}`}><Ionicons name="checkmark" size={14} color="white" /></View>
            <Text className={`ml-3 ${index === current ? "font-black text-[#0F6E56]" : "text-gray-600"}`}>{step}</Text>
          </View>
        ))}
      </View>
      {/* ── Feedback Banner ── */}
      {["collected", "processing", "completed"].includes(order.appointment?.status ?? "") &&
        !order.appointment?.feedbackSubmitted ? (
        <TouchableOpacity
          onPress={() =>
            router.push(
              `/(patient)/feedback/${order.appointment?.id ?? order.appointmentId}` as any
            )
          }
          className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mx-0 mb-4 flex-row items-center justify-between"
        >
          <View className="flex-1">
            <View className="flex-row items-center gap-1">
              <Ionicons name="star" size={14} color="#92400E" />
              <Text className="font-black text-amber-800 text-sm">Rate your collector's visit</Text>
            </View>
            <Text className="text-amber-600 text-xs mt-0.5">Your feedback helps us improve</Text>
          </View>
          <Text className="text-amber-700 font-black text-sm">Rate Now →</Text>
        </TouchableOpacity>
      ) : null}
      {order.appointment?.status === "en_route" ? (
        <View className="bg-white rounded-2xl p-4 mt-5 border border-gray-100">
          <Text className="font-black">Collector on the way</Text>
          <Text className="text-gray-500 mt-1">{order.appointment.employee?.name ?? "Assigned employee"}</Text>
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${order.appointment.employee?.phone ?? ""}`)} className="bg-[#0F6E56] rounded-xl py-3 mt-4"><Text className="text-white text-center font-bold">Call Collector</Text></TouchableOpacity>
        </View>
      ) : null}
      <View className="bg-white rounded-2xl p-4 mt-5 border border-gray-100 gap-2">
        <Text className="font-black">Order Details</Text>
        <Text>Tests: {order.items?.testTypes?.join(", ") ?? "Health tests"}</Text>
        <Text>Address: {order.items?.address}</Text>
        <Text>Slot: {order.items?.slot}</Text>
        <Text>Amount: ₹{order.totalAmount}</Text>
        <Text>Payment ID: {order.paymentId ?? "Pending"}</Text>
      </View>
      <View className="bg-white rounded-2xl p-4 mt-5 border border-gray-100">
        <Text className="font-black">Need help with this order?</Text>
        <TouchableOpacity onPress={() => Linking.openURL(`whatsapp://send?text=Need help with order ${order.id}`)} className="border border-[#0F6E56] rounded-xl py-3 mt-4"><Text className="text-[#0F6E56] text-center font-bold">WhatsApp</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}
