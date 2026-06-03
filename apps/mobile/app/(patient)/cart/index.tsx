import { router } from "expo-router";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

import { useCartStore } from "@/store/cartStore";

export default function CartScreen() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const total = useCartStore((state) => state.getTotalPrice());
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);

  if (items.length === 0) {
    return (
      <View className="flex-1 bg-[#F5F5F5] items-center justify-center p-8">
        <Text className="text-5xl">🧺</Text>
        <Text className="text-2xl font-black mt-4">Your cart is empty</Text>
        <TouchableOpacity onPress={() => router.push("/(patient)/tests")} className="bg-[#0F6E56] rounded-xl px-6 py-4 mt-6">
          <Text className="text-white font-bold">Browse Tests</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-[#F5F5F5]" contentContainerClassName="p-5 pb-28">
      <Text className="text-2xl font-black text-[#1a1a1a] mt-4">Cart</Text>
      {items.map((item) => (
        <View key={item.id} className="bg-white rounded-2xl p-4 mt-3 border border-gray-100 flex-row justify-between">
          <View className="flex-1">
            <Text className="font-bold text-[#1a1a1a]">{item.name}</Text>
            <Text className="text-gray-500 text-xs mt-1">{item.type === "package" ? `Package — ${item.count ?? 0} tests` : "Test"}</Text>
            <Text className="text-[#C41E3A] text-lg font-black mt-2">₹{item.price}</Text>
          </View>
          <TouchableOpacity onPress={() => removeItem(item.id)}><Text className="text-red-500 font-bold">Remove</Text></TouchableOpacity>
        </View>
      ))}
      <View className="bg-white rounded-2xl p-4 mt-5 border border-gray-100">
        <TextInput className="border border-gray-200 rounded-xl px-4 py-3" placeholder="Enter coupon code" />
        <Text className="text-gray-400 text-xs mt-2">Coupon validation coming soon</Text>
      </View>
      <View className="bg-white rounded-2xl p-4 mt-5 border border-gray-100 gap-2">
        <View className="flex-row justify-between"><Text>Subtotal</Text><Text>₹{subtotal}</Text></View>
        <View className="flex-row justify-between"><Text>Home Collection Charges</Text><Text>₹100</Text></View>
        <View className="h-px bg-gray-100 my-2" />
        <View className="flex-row justify-between"><Text className="font-black text-lg">Total</Text><Text className="font-black text-lg">₹{total}</Text></View>
      </View>
      <TouchableOpacity onPress={() => router.push("/(patient)/checkout")} className="bg-[#0F6E56] rounded-xl py-4 mt-6">
        <Text className="text-white text-center font-bold">Proceed to Checkout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
