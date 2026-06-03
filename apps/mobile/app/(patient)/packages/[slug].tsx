import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";

import { getPackageBySlug } from "@/api/patient";
import { useCartStore } from "@/store/cartStore";

export default function PackageDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const query = useQuery({ queryKey: ["patient-package", slug], queryFn: () => getPackageBySlug(slug) });
  const addItem = useCartStore((state) => state.addItem);
  const item = query.data?.data;

  if (query.isLoading || !item) {
    return <View className="flex-1 items-center justify-center bg-[#F5F5F5]"><ActivityIndicator color="#0F6E56" /></View>;
  }

  const currentPrice = item.discountPrice ?? item.price;

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <ScrollView contentContainerClassName="p-5 pb-32">
        <TouchableOpacity onPress={() => router.back()} className="mt-4"><Text className="text-[#0F6E56] font-bold">Back</Text></TouchableOpacity>
        <View className="bg-[#0F6E56] rounded-3xl p-5 mt-5">
          <Text className="text-white text-2xl font-black">{item.name}</Text>
          <Text className="text-white/80 mt-2">{item.description}</Text>
          <Text className="text-white text-3xl font-black mt-5">₹{currentPrice}</Text>
          {item.discountPrice ? <Text className="text-green-100 font-bold">Save ₹{item.price - currentPrice}</Text> : null}
        </View>
        <View className="flex-row gap-3 mt-4">
          <View className="flex-1 bg-white rounded-2xl p-3"><Text className="font-bold">{item.tests?.length ?? 0}</Text><Text className="text-gray-500 text-xs">Tests</Text></View>
          <View className="flex-1 bg-white rounded-2xl p-3"><Text className="font-bold">24-48h</Text><Text className="text-gray-500 text-xs">Report</Text></View>
          <View className="flex-1 bg-white rounded-2xl p-3"><Text className="font-bold">Blood</Text><Text className="text-gray-500 text-xs">Sample</Text></View>
        </View>
        <Text className="text-lg font-black mt-6 mb-3">Tests included</Text>
        {(item.tests ?? []).map((test) => (
          <View key={test.id} className="bg-white rounded-2xl p-4 mb-2 border border-gray-100">
            <Text className="font-bold">{test.name}</Text>
            <Text className="text-gray-500 text-xs mt-1">{test.parameters?.length ?? 0} parameters • ₹{test.discountPrice ?? test.price}</Text>
          </View>
        ))}
      </ScrollView>
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 flex-row items-center gap-3">
        <Text className="text-[#C41E3A] text-xl font-black">₹{currentPrice}</Text>
        <TouchableOpacity onPress={() => addItem({ id: item.id, type: "package", name: item.name, price: currentPrice, originalPrice: item.price, packageId: item.id, count: item.tests?.length ?? 0 })} className="flex-1 bg-[#0F6E56] rounded-xl py-4">
          <Text className="text-white text-center font-bold">Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
