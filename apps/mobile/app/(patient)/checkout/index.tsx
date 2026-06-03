import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

import { addServerCartItem, createOrder, getAvailableSlots, verifyPayment } from "@/api/patient";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cartStore";

const genders = ["Male", "Female", "Other"];
const dates = Array.from({ length: 7 }).map((_, index) => {
  const date = new Date();
  date.setDate(date.getDate() + index);
  return date;
});
const iso = (date: Date) => date.toISOString().slice(0, 10);

export default function CheckoutScreen() {
  const user = useAuthStore((state) => state.user);
  const items = useCartStore((state) => state.items);
  const total = useCartStore((state) => state.getTotalPrice());
  const clearCart = useCartStore((state) => state.clearCart);
  const [name, setName] = useState(user?.name ?? "");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [selectedDate, setSelectedDate] = useState(iso(dates[0]));
  const [slot, setSlot] = useState("");
  const slotsQuery = useQuery({ queryKey: ["slots", selectedDate], queryFn: () => getAvailableSlots(selectedDate) });
  const summary = useMemo(() => items.map((item) => item.name).join(", "), [items]);

  const payMutation = useMutation({
    mutationFn: async () => {
      if (!name || !age || !address1 || !city || pincode.length !== 6 || !slot) throw new Error("Fill all required fields");
      for (const item of items) {
        await addServerCartItem({ testId: item.testId, packageId: item.packageId });
      }
      const order = await createOrder({
        patientName: name,
        patientAge: Number(age),
        patientGender: gender,
        patientPhone: user?.phone ?? "",
        address: `${address1}${address2 ? `, ${address2}` : ""}, ${city}`,
        pincode,
        slot: `${selectedDate} ${slot}`
      });
      await verifyPayment({ orderId: order.data.paymentId, status: "paid" });
      clearCart();
      router.replace({ pathname: "/(patient)/checkout/success", params: { id: order.data.orderId, total: String(total), slot, date: selectedDate, tests: summary } });
    },
    onError: (error) => Alert.alert("Payment failed", error instanceof Error ? error.message : "Please try again")
  });

  return (
    <ScrollView className="flex-1 bg-[#F5F5F5]" contentContainerClassName="p-5 pb-28">
      <Text className="text-2xl font-black text-[#1a1a1a] mt-4">Checkout</Text>
      <View className="bg-white rounded-2xl p-4 mt-5 border border-gray-100 gap-3">
        <Text className="font-black">Patient Details</Text>
        <TextInput className="border border-gray-200 rounded-xl px-4 py-3" value={name} onChangeText={setName} placeholder="Full Name" />
        <TextInput className="border border-gray-200 rounded-xl px-4 py-3" value={age} onChangeText={setAge} keyboardType="numeric" placeholder="Age" />
        <View className="flex-row gap-2">
          {genders.map((item) => <TouchableOpacity key={item} onPress={() => setGender(item)} className={`flex-1 rounded-xl py-3 ${gender === item ? "bg-[#0F6E56]" : "bg-gray-100"}`}><Text className={`text-center font-bold ${gender === item ? "text-white" : "text-gray-600"}`}>{item}</Text></TouchableOpacity>)}
        </View>
        <Text className="text-gray-500">Phone: {user?.phone}</Text>
      </View>
      <View className="bg-white rounded-2xl p-4 mt-5 border border-gray-100 gap-3">
        <Text className="font-black">Collection Address</Text>
        <TextInput className="border border-gray-200 rounded-xl px-4 py-3" value={address1} onChangeText={setAddress1} placeholder="Address Line 1" />
        <TextInput className="border border-gray-200 rounded-xl px-4 py-3" value={address2} onChangeText={setAddress2} placeholder="Address Line 2" />
        <TextInput className="border border-gray-200 rounded-xl px-4 py-3" value={city} onChangeText={setCity} placeholder="City" />
        <TextInput className="border border-gray-200 rounded-xl px-4 py-3" value={pincode} onChangeText={(text) => setPincode(text.replace(/\D/g, "").slice(0, 6))} keyboardType="numeric" placeholder="Pincode" />
      </View>
      <Text className="font-black mt-6 mb-3">Date & Slot</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {dates.map((date) => <TouchableOpacity key={iso(date)} onPress={() => setSelectedDate(iso(date))} className={`rounded-2xl px-4 py-3 mr-2 ${selectedDate === iso(date) ? "bg-[#0F6E56]" : "bg-white"}`}><Text className={selectedDate === iso(date) ? "text-white font-bold" : "text-gray-700"}>{date.toLocaleDateString("en-US", { weekday: "short" })}{"\n"}{date.getDate()}</Text></TouchableOpacity>)}
      </ScrollView>
      <View className="flex-row flex-wrap gap-2 mt-4">
        {(slotsQuery.data?.data ?? []).map((item) => <TouchableOpacity key={item.slot} onPress={() => setSlot(item.slot)} className={`rounded-xl px-3 py-3 ${slot === item.slot ? "bg-[#0F6E56]" : "bg-white"}`}><Text className={slot === item.slot ? "text-white font-bold" : "text-gray-700"}>{item.slot}</Text></TouchableOpacity>)}
      </View>
      <View className="bg-white rounded-2xl p-4 mt-5 border border-gray-100">
        <Text className="font-black">Order Summary</Text>
        <Text className="text-gray-600 mt-2">{summary}</Text>
        <Text className="text-[#C41E3A] text-2xl font-black mt-3">₹{total}</Text>
      </View>
      <TouchableOpacity disabled={payMutation.isPending} onPress={() => payMutation.mutate()} className="bg-[#0F6E56] rounded-xl py-4 mt-6">
        <Text className="text-white text-center font-bold">{payMutation.isPending ? "Paying..." : `Pay ₹${total}`}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
