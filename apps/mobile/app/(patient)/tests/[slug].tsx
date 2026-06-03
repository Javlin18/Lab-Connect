import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";

import { getTestBySlug } from "@/api/patient";
import { useCartStore } from "@/store/cartStore";

export default function TestDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const query = useQuery({ queryKey: ["patient-test", slug], queryFn: () => getTestBySlug(slug) });
  const addItem = useCartStore((state) => state.addItem);
  const isInCart = useCartStore((state) => state.isInCart);
  const test = query.data?.data;

  if (query.isLoading || !test) {
    return <View className="flex-1 items-center justify-center bg-[#F5F5F5]"><ActivityIndicator color="#0F6E56" /></View>;
  }

  const currentPrice = test.discountPrice ?? test.price;
  const inCart = isInCart(test.id);

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <ScrollView contentContainerClassName="p-5 pb-32">
        <TouchableOpacity onPress={() => router.back()} className="mt-4"><Text className="text-[#0F6E56] font-bold">Back</Text></TouchableOpacity>
        <Text className="text-3xl font-black text-[#1a1a1a] mt-5">{test.name}</Text>
        <View className="flex-row gap-2 mt-3">
          <Text className="bg-[#E8F5F1] text-[#0F6E56] text-xs px-2 py-1 rounded-full">{test.category}</Text>
          {test.preparationInstructions?.toLowerCase().includes("fast") ? <Text className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">Fasting Required</Text> : null}
        </View>
        <View className="flex-row gap-3 mt-5">
          {[[test.sampleType, "Sample"], [`${test.turnaroundHours} Hours`, "Report"], [test.preparationInstructions ? "Yes" : "No", "Fasting"]].map(([value, label]) => (
            <View key={label} className="flex-1 bg-white rounded-2xl p-3 border border-gray-100">
              <Text className="font-bold text-[#1a1a1a]">{value}</Text>
              <Text className="text-gray-500 text-xs mt-1">{label}</Text>
            </View>
          ))}
        </View>
        <View className="bg-white rounded-2xl p-4 mt-5 border border-gray-100">
          {test.discountPrice ? <Text className="text-gray-400 line-through">₹{test.price}</Text> : null}
          <Text className="text-[#C41E3A] text-3xl font-black">₹{currentPrice}</Text>
          {test.discountPrice ? <Text className="text-green-600 font-bold mt-1">You save ₹{test.price - currentPrice}</Text> : null}
        </View>
        <Text className="text-lg font-black mt-6">About this test</Text>
        <Text className="text-gray-600 mt-2 leading-6">{test.description}</Text>
        {test.preparationInstructions ? (
          <View className="bg-blue-50 rounded-2xl p-4 mt-5"><Text className="font-bold text-blue-900">How to prepare</Text><Text className="text-blue-800 mt-2">{test.preparationInstructions}</Text></View>
        ) : null}
        <Text className="text-lg font-black mt-6">What's tested ({test.parameters.length} parameters)</Text>
        {test.parameters.map((item) => <Text key={item} className="bg-white rounded-xl p-3 mt-2 border border-gray-100">✓ {item}</Text>)}
      </ScrollView>
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 flex-row items-center gap-3">
        <Text className="text-[#C41E3A] text-xl font-black">₹{currentPrice}</Text>
        <TouchableOpacity onPress={() => inCart ? router.push("/(patient)/cart") : addItem({ id: test.id, type: "test", name: test.name, price: currentPrice, originalPrice: test.price, testId: test.id })} className="flex-1 bg-[#0F6E56] rounded-xl py-4">
          <Text className="text-white text-center font-bold">{inCart ? "Go to Cart →" : "Add to Cart"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
