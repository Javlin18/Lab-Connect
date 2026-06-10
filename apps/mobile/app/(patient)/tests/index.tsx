import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

import { getTests, type Test } from "@/api/patient";
import { useServerCart } from "@/hooks/useServerCart";

const categories = ["All", "Blood Test", "Thyroid", "Diabetes", "Heart", "Vitamins", "Liver", "Kidney", "Allergy"];
const price = (test: Test) => test.discountPrice ?? test.price;

function Row({ test }: { test: Test }) {
  const { addItem, isInCart, isAddingItem } = useServerCart();
  const inCart = isInCart(test.id);
  return (
    <TouchableOpacity onPress={() => router.push(`/(patient)/tests/${test.slug}`)} className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100">
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Text className="font-bold text-[#1a1a1a] text-base">{test.name}</Text>
          <View className="flex-row flex-wrap gap-2 mt-2">
            <Text className="bg-[#E8F5F1] text-[#0F6E56] text-xs px-2 py-1 rounded-full">{test.category}</Text>
            <Text className="text-gray-500 text-xs px-2 py-1">Includes {test.parameters?.length ?? 0} parameters</Text>
          </View>
          <Text className="text-gray-500 text-xs mt-2">Report in {test.turnaroundHours} hours</Text>
        </View>
        <View className="items-end">
          {test.discountPrice ? <Text className="text-gray-400 text-sm line-through">₹{test.price}</Text> : null}
          <Text className="text-[#C41E3A] text-xl font-bold">₹{price(test)}</Text>
          <TouchableOpacity
            disabled={inCart || isAddingItem}
            onPress={() => addItem({ testId: test.id })}
            className={`px-4 py-2 rounded-xl mt-3 ${inCart ? "bg-green-50" : "bg-[#0F6E56]"}`}
          >
            <Text className={`font-bold text-xs ${inCart ? "text-green-600" : "text-white"}`}>{inCart ? "ADDED ✓" : "ADD"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function BrowseTestsScreen() {
  const params = useLocalSearchParams<{ search?: string }>();
  const [query, setQuery] = useState(params.search ?? "");
  const [debounced, setDebounced] = useState(query);
  const [category, setCategory] = useState("All");

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  const testsQuery = useQuery({ queryKey: ["patient-tests", category, debounced], queryFn: () => getTests({ category, search: debounced }) });
  const tests = testsQuery.data?.data ?? [];

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <ScrollView contentContainerClassName="p-5 pb-28">
        <Text className="text-2xl font-black text-[#1a1a1a] mt-4">Book Test</Text>
        <TextInput className="bg-white rounded-2xl border border-gray-100 px-4 py-4 mt-5" value={query} onChangeText={setQuery} placeholder="Search tests" placeholderTextColor="#9CA3AF" autoFocus={Boolean(params.search)} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="my-4">
          {categories.map((item) => (
            <TouchableOpacity key={item} onPress={() => setCategory(item)} className={`px-4 py-2 rounded-full mr-2 ${category === item ? "bg-[#0F6E56]" : "bg-white"}`}>
              <Text className={category === item ? "text-white font-bold" : "text-gray-600"}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {testsQuery.isLoading ? <ActivityIndicator color="#0F6E56" /> : tests.length === 0 ? <Text className="text-center text-gray-500 mt-10">No tests found</Text> : tests.map((test) => <Row key={test.id} test={test} />)}
      </ScrollView>
    </View>
  );
}
