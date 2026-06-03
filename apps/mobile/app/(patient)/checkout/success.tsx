import { router, useLocalSearchParams } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function SuccessScreen() {
  const params = useLocalSearchParams<{ id?: string; total?: string; tests?: string; date?: string; slot?: string }>();
  return (
    <View className="flex-1 bg-[#F5F5F5] p-6 items-center justify-center">
      <Text className="text-6xl">✓</Text>
      <Text className="text-3xl font-black mt-4">Booking Confirmed!</Text>
      <Text className="text-gray-500 mt-2">Order ID: #{params.id?.slice(0, 8)}</Text>
      <View className="bg-white rounded-2xl p-4 mt-6 w-full border border-gray-100">
        <Text className="font-bold">Tests booked</Text>
        <Text className="text-gray-600 mt-1">{params.tests}</Text>
        <Text className="font-bold mt-4">Collection</Text>
        <Text className="text-gray-600 mt-1">{params.date} between {params.slot}</Text>
        <Text className="font-bold mt-4">Paid</Text>
        <Text className="text-[#C41E3A] text-xl font-black">₹{params.total}</Text>
      </View>
      <TouchableOpacity onPress={() => router.replace(`/(patient)/orders/${params.id}`)} className="bg-[#0F6E56] rounded-xl py-4 mt-6 w-full">
        <Text className="text-white font-bold text-center">Track My Order</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.replace("/(patient)")} className="border border-[#0F6E56] rounded-xl py-4 mt-3 w-full">
        <Text className="text-[#0F6E56] font-bold text-center">Go to Home</Text>
      </TouchableOpacity>
    </View>
  );
}
