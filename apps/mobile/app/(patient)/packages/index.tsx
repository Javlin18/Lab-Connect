import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";

import { getPackages, type HealthPackage } from "@/api/patient";
import { useServerCart } from "@/hooks/useServerCart";

const price = (item: HealthPackage) => item.discountPrice ?? item.price;

export default function PackagesScreen() {
  const query = useQuery({ queryKey: ["patient-packages"], queryFn: () => getPackages() });
  const { addItem, isInCart, isAddingItem } = useServerCart();

  return (
    <ScrollView className="flex-1 bg-[#F5F5F5]" contentContainerClassName="p-5 pb-28">
      <Text className="text-2xl font-black text-[#1a1a1a] mt-4">Health Packages</Text>
      <Text className="text-gray-500 mt-1 mb-5">Comprehensive tests at the best price</Text>
      {query.isLoading ? <ActivityIndicator color="#0F6E56" /> : (query.data?.data ?? []).map((item) => (
        <View key={item.id} className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
          <Text className="font-black text-lg text-[#1a1a1a]">{item.name}</Text>
          <Text className="text-gray-500 mt-1" numberOfLines={2}>{item.description}</Text>
          <Text className="text-[#0F6E56] font-bold mt-3">Includes {item.tests?.length ?? 0} tests</Text>
          {(item.tests ?? []).slice(0, 4).map((test) => <Text key={test.id} className="text-gray-500 text-xs mt-1">• {test.name}</Text>)}
          <View className="flex-row items-end gap-2 mt-4">
            {item.discountPrice ? <Text className="text-gray-400 line-through">₹{item.price}</Text> : null}
            <Text className="text-[#C41E3A] text-2xl font-black">₹{price(item)}</Text>
            {item.discountPrice ? <Text className="text-green-600 font-bold">Save ₹{item.price - price(item)}</Text> : null}
          </View>
          <View className="flex-row gap-3 mt-4">
            <TouchableOpacity onPress={() => router.push(`/(patient)/packages/${item.slug}`)} className="flex-1 border border-[#0F6E56] rounded-xl py-3">
              <Text className="text-[#0F6E56] font-bold text-center">View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={isInCart(item.id) || isAddingItem}
              onPress={() => addItem({ packageId: item.id })}
              className={`flex-1 rounded-xl py-3 ${isInCart(item.id) ? "bg-green-50" : "bg-[#0F6E56]"}`}
            >
              <Text className={`font-bold text-center ${isInCart(item.id) ? "text-green-600" : "text-white"}`}>
                {isInCart(item.id) ? "Added ✓" : "Add to Cart"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
