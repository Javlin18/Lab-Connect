import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useServerCart } from "@/hooks/useServerCart";

export default function CartScreen() {
  const qc = useQueryClient();
  const { items, isLoading, isRefetching, refetch, removeItem, getTotalPrice } =
    useServerCart();

  const subtotal = items.reduce((sum, i) => sum + i.price, 0);
  const homeCollectionCharges = items.length > 0 ? 100 : 0;
  const total = getTotalPrice();

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#F5F5F5] items-center justify-center">
        <ActivityIndicator size="large" color="#0F6E56" />
        <Text className="text-gray-400 mt-3 text-sm">Loading cart…</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View className="flex-1 bg-[#F5F5F5] items-center justify-center p-8">
        <Text className="text-5xl">🧺</Text>
        <Text className="text-2xl font-black mt-4">Your cart is empty</Text>
        <Text className="text-gray-400 text-sm mt-2 text-center">
          Add tests or packages from the home screen or browse below
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(patient)/tests")}
          className="bg-[#0F6E56] rounded-xl px-6 py-4 mt-6"
        >
          <Text className="text-white font-bold">Browse Tests</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-[#F5F5F5]"
      contentContainerClassName="p-5 pb-28"
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            refetch();
            qc.invalidateQueries({ queryKey: ["server-cart"] });
          }}
          tintColor="#0F6E56"
        />
      }
    >
      <Text className="text-2xl font-black text-[#1a1a1a] mt-4">Cart</Text>

      {/* Items */}
      {items.map((item) => (
        <View
          key={item.id}
          className="bg-white rounded-2xl p-4 mt-3 border border-gray-100 flex-row justify-between"
        >
          <View className="flex-1">
            <Text className="font-bold text-[#1a1a1a]">{item.name}</Text>
            <Text className="text-gray-500 text-xs mt-1">
              {item.type === "package"
                ? `Package — ${item.count ?? 0} tests`
                : "Test"}
            </Text>
            <Text className="text-[#C41E3A] text-lg font-black mt-2">
              ₹{item.price}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => removeItem((item as any).cartItemId ?? item.id)}
          >
            <Text className="text-red-500 font-bold">Remove</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Pricing */}
      <View className="bg-white rounded-2xl p-4 mt-5 border border-gray-100 gap-2">
        <View className="flex-row justify-between">
          <Text>Subtotal</Text>
          <Text>₹{subtotal}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text>Home Collection Charges</Text>
          <Text>₹{homeCollectionCharges}</Text>
        </View>
        <View className="h-px bg-gray-100 my-2" />
        <View className="flex-row justify-between">
          <Text className="font-black text-lg">Total</Text>
          <Text className="font-black text-lg">₹{total}</Text>
        </View>
      </View>

      {/* Checkout button */}
      <TouchableOpacity
        onPress={() => router.push("/(patient)/checkout")}
        className="bg-[#0F6E56] rounded-xl py-4 mt-6"
      >
        <Text className="text-white text-center font-bold">
          Proceed to Checkout
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
