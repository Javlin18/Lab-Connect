import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import * as Location from "expo-location";
import {
  ActivityIndicator,
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import RazorpayCheckout from "react-native-razorpay";

import { createOrder } from "@/api/patient";
import { createPaymentOrder, verifyRazorpayPayment } from "@/api/payments";
import { useServerCart } from "@/hooks/useServerCart";
import { RAZORPAY_KEY_ID } from "@/lib/env";
import { useAuthStore } from "@/store/auth-store";

// ── Helpers ───────────────────────────────────────────────────────────────────
const genders = ["Male", "Female", "Other"];
const dates = Array.from({ length: 14 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return d;
});
const iso = (d: Date) => d.toISOString().slice(0, 10);

const HOURS = Array.from({ length: 24 }, (_, i) => i);       // 0-23
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 0,5,10...55
const ITEM_H = 48;

function pad(n: number) {
  return n.toString().padStart(2, "0");
}
function to12(h: number) {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

// ── Drum Picker ───────────────────────────────────────────────────────────────
function Drum({
  items,
  selected,
  onSelect,
  label,
}: {
  items: number[];
  selected: number;
  onSelect: (v: number) => void;
  label: (v: number) => string;
}) {
  const ref = useRef<ScrollView>(null);
  const VISIBLE = 5;
  const PAD = Math.floor(VISIBLE / 2);
  const padded = [...Array(PAD).fill(-1), ...items, ...Array(PAD).fill(-1)];

  useEffect(() => {
    const idx = items.indexOf(selected);
    if (idx >= 0) {
      ref.current?.scrollTo({ y: ITEM_H * idx, animated: false });
    }
  }, []);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
    const val = items[idx];
    if (val !== undefined) onSelect(val);
  };

  return (
    <View style={{ width: 88, height: ITEM_H * VISIBLE, overflow: "hidden" }}>
      {/* selection highlight */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: ITEM_H * PAD,
          left: 0,
          right: 0,
          height: ITEM_H,
          backgroundColor: "#0F6E5614",
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#0F6E5640",
        }}
      />
      <ScrollView
        ref={ref}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        onMomentumScrollEnd={onMomentumEnd}
      >
        {padded.map((item, i) => (
          <View
            key={i}
            style={{
              height: ITEM_H,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {item >= 0 ? (
              <Text
                style={{
                  fontSize: item === selected ? 20 : 15,
                  fontWeight: item === selected ? "800" : "400",
                  color: item === selected ? "#0F6E56" : "#9CA3AF",
                }}
              >
                {label(item)}
              </Text>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function CheckoutScreen() {
  const user = useAuthStore((s) => s.user);
  const { items, getTotalPrice, clearCart } = useServerCart();
  const total = getTotalPrice();

  const [name, setName] = useState(user?.name ?? "");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [selectedDate, setSelectedDate] = useState(iso(dates[0]));
  const [hour, setHour] = useState(7);
  const [minute, setMinute] = useState(0);
  const [paymentType, setPaymentType] = useState<"online_prepaid" | "pay_on_collection">("online_prepaid");
  const [locationLoading, setLocationLoading] = useState(false);

  // ── Auto-fill address from GPS (Nominatim) ────────────────────────────────
  const fetchLocation = async () => {
    setLocationLoading(true);
    try {
      // 1. Get GPS coords
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Enable location in Settings to auto-fill address.");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;

      // 2. Reverse geocode via Nominatim (OpenStreetMap) — better India coverage
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
        { headers: { "Accept-Language": "en-IN,en", "User-Agent": "LabconnectApp/1.0" } }
      );
      const data = await res.json();
      const a = data?.address ?? {};

      const line1 = [a.house_number, a.road || a.pedestrian || a.footway]
        .filter(Boolean).join(", ") || a.amenity || a.building || "";
      const line2 = a.suburb || a.neighbourhood || a.village || a.county || "";
      const cityVal = a.city || a.town || a.city_district || a.state_district || a.state || "";
      const pin    = (a.postcode ?? "").replace(/\D/g, "").slice(0, 6);

      if (line1) setAddress1(line1);
      if (line2) setAddress2(line2);
      if (cityVal) setCity(cityVal);
      if (pin) setPincode(pin);

      if (!line1 && !cityVal) {
        Alert.alert("Partial address", "Only some fields could be filled. Please complete manually.");
      }
    } catch {
      // 3. IP fallback (works on emulator too)
      try {
        const res = await fetch("https://ipapi.co/json/");
        const d = await res.json();
        if (d.city) setCity(d.city);
        if (d.postal) setPincode(d.postal.replace(/\D/g, "").slice(0, 6));
        if (d.region) setAddress2(d.region);
        Alert.alert("Note", "GPS unavailable — filled city from IP. Please enter street address.");
      } catch {
        Alert.alert("Error", "Could not detect location. Please fill manually.");
      }
    } finally {
      setLocationLoading(false);
    }
  };

  const timeLabel = useMemo(
    () => `${to12(hour).replace(/ (AM|PM)/, ":")}${pad(minute)} ${hour < 12 ? "AM" : "PM"}`,
    [hour, minute]
  );
  const slot = `${selectedDate} ${pad(hour)}:${pad(minute)}`;
  const summary = useMemo(() => items.map((i) => i.name).join(", "), [items]);

  const payMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim())    throw new Error("Missing: Patient name");
      if (!age.trim())     throw new Error("Missing: Patient age");
      if (!address1.trim()) throw new Error("Missing: Address line 1");
      if (!city.trim())    throw new Error("Missing: City");
      if (pincode.length < 5) throw new Error(`Missing: Pincode (enter 6 digits, got ${pincode.length})`);

      // Items are already on the server via useServerCart — no need to push again
      // Step 1: Create order
      const order = await createOrder({
        patientName: name,
        patientAge: Number(age),
        patientGender: gender,
        patientPhone: user?.phone ?? "",
        address: `${address1}${address2 ? `, ${address2}` : ""}, ${city}`,
        pincode,
        slot,
        paymentType,
      });

      // Pay on collection — no Razorpay, go straight to success
      if (paymentType === "pay_on_collection") {
        clearCart();
        router.replace({
          pathname: "/(patient)/checkout/success",
          params: {
            id: order.data.orderId,
            total: String(total),
            slot: timeLabel,
            date: selectedDate,
            tests: summary,
          },
        });
        return;
      }

      // Step 2: Create Razorpay order on backend
      const payment = await createPaymentOrder({
        orderId: order.data.orderId,
        amount: total,
      });

      // Step 3: Open Razorpay native checkout
      const options = {
        description: "Medical Test Booking",
        currency: "INR",
        key: RAZORPAY_KEY_ID,
        amount: String(payment.data.amount),
        order_id: payment.data.razorpayOrderId,
        name: "Labconnect Diagnostics",
        prefill: {
          contact: user?.phone ?? "",
          name: user?.name ?? name,
        },
        theme: { color: "#C41E3A" },
      };

      let paymentData: any;
      try {
        paymentData = await RazorpayCheckout.open(options);
      } catch (err: any) {
        // User cancelled — err.code === 0, err.description === "Payment cancelled by user"
        if (err?.code === 0 || err?.description?.toLowerCase().includes("cancel")) {
          return; // silent exit — stay on checkout screen
        }
        throw new Error(err?.description ?? "Payment failed. Please try again.");
      }

      // Step 4: Verify signature on backend
      await verifyRazorpayPayment({
        orderId: order.data.orderId,
        razorpayOrderId: paymentData.razorpay_order_id,
        razorpayPaymentId: paymentData.razorpay_payment_id,
        razorpaySignature: paymentData.razorpay_signature,
      });

      clearCart();
      router.replace({
        pathname: "/(patient)/checkout/success",
        params: {
          id: order.data.orderId,
          total: String(total),
          slot: timeLabel,
          date: selectedDate,
          tests: summary,
        },
      });
    },
    onError: (err) =>
      Alert.alert("Error", err instanceof Error ? err.message : "Please try again"),
  });

  return (
    <ScrollView
      className="flex-1 bg-[#F5F5F5]"
      contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-2xl font-black text-[#1a1a1a] mt-4">Checkout</Text>

      {/* ── Patient Details ── */}
      <View className="bg-white rounded-2xl p-4 mt-5 border border-gray-100 gap-3">
        <Text className="font-black">Patient Details</Text>
        <TextInput
          className="border border-gray-200 rounded-xl px-4 py-3 text-sm"
          value={name}
          onChangeText={setName}
          placeholder="Full Name"
        />
        <TextInput
          className="border border-gray-200 rounded-xl px-4 py-3 text-sm"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
          placeholder="Age"
        />
        <View className="flex-row gap-2">
          {genders.map((g) => (
            <TouchableOpacity
              key={g}
              onPress={() => setGender(g)}
              className={`flex-1 rounded-xl py-3 ${gender === g ? "bg-[#0F6E56]" : "bg-gray-100"}`}
            >
              <Text className={`text-center font-bold text-sm ${gender === g ? "text-white" : "text-gray-600"}`}>
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text className="text-gray-400 text-sm">Phone: {user?.phone}</Text>
      </View>

      {/* ── Address ── */}
      <View className="bg-white rounded-2xl p-4 mt-5 border border-gray-100 gap-3">
        {/* Header row */}
        <View className="flex-row items-center justify-between">
          <Text className="font-black">Collection Address</Text>
          <TouchableOpacity
            onPress={fetchLocation}
            disabled={locationLoading}
            className="flex-row items-center gap-1.5 bg-[#E8F5F1] px-3 py-1.5 rounded-xl"
          >
            {locationLoading ? (
              <ActivityIndicator size="small" color="#0F6E56" />
            ) : (
              <Text className="text-base">📍</Text>
            )}
            <Text className="text-[#0F6E56] text-xs font-bold">
              {locationLoading ? "Detecting…" : "Use My Location"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Address fields */}
        <TextInput
          className="border border-gray-200 rounded-xl px-4 py-3 text-sm"
          value={address1}
          onChangeText={setAddress1}
          placeholder="Address Line 1 (House/Street)"
        />
        <TextInput
          className="border border-gray-200 rounded-xl px-4 py-3 text-sm"
          value={address2}
          onChangeText={setAddress2}
          placeholder="Area / District (optional)"
        />
        <TextInput
          className="border border-gray-200 rounded-xl px-4 py-3 text-sm"
          value={city}
          onChangeText={setCity}
          placeholder="City"
        />
        <TextInput
          className="border border-gray-200 rounded-xl px-4 py-3 text-sm"
          value={pincode}
          onChangeText={(t) => setPincode(t.replace(/\D/g, "").slice(0, 6))}
          keyboardType="numeric"
          placeholder="Pincode"
          maxLength={6}
        />
      </View>

      {/* ── Date ── */}
      <Text className="font-black mt-6 mb-3">Select Date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {dates.map((date) => {
          const active = selectedDate === iso(date);
          return (
            <TouchableOpacity
              key={iso(date)}
              onPress={() => setSelectedDate(iso(date))}
              className={`rounded-2xl px-4 py-3 mr-2 items-center min-w-[56px] ${active ? "bg-[#0F6E56]" : "bg-white border border-gray-100"}`}
            >
              <Text className={`text-xs font-semibold ${active ? "text-white/80" : "text-gray-400"}`}>
                {date.toLocaleDateString("en-US", { weekday: "short" })}
              </Text>
              <Text className={`text-base font-black mt-0.5 ${active ? "text-white" : "text-gray-700"}`}>
                {date.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Time Picker ── */}
      <Text className="font-black mt-6 mb-1">Select Time</Text>
      <Text className="text-xs text-gray-400 mb-4">Scroll to pick any time</Text>

      <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Selected time display */}
        <View className="bg-[#0F6E56] px-4 py-3 flex-row items-center justify-center gap-2">
          <Text className="text-white text-2xl">🕐</Text>
          <Text className="text-white text-xl font-black">{timeLabel}</Text>
        </View>

        {/* Drum wheels */}
        <View className="flex-row items-center justify-center py-4 gap-2">
          {/* Hour drum */}
          <View className="items-center">
            <Text className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wider">Hour</Text>
            <Drum
              items={HOURS}
              selected={hour}
              onSelect={setHour}
              label={(h) => to12(h)}
            />
          </View>

          <Text className="text-3xl font-black text-gray-300 mb-2">:</Text>

          {/* Minute drum */}
          <View className="items-center">
            <Text className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wider">Minute</Text>
            <Drum
              items={MINUTES}
              selected={minute}
              onSelect={setMinute}
              label={(m) => pad(m)}
            />
          </View>
        </View>

        <View className="px-4 pb-4">
          <Text className="text-xs text-center text-gray-400">
            Our team will arrive at your doorstep at the selected time
          </Text>
        </View>
      </View>

      {/* ── Order Summary ── */}
      <View className="bg-white rounded-2xl p-4 mt-5 border border-gray-100">
        <Text className="font-black">Order Summary</Text>
        <Text className="text-gray-600 mt-2 text-sm">{summary}</Text>
        <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-50">
          <Text className="text-gray-500 text-sm">Collection on</Text>
          <Text className="font-bold text-sm text-[#1a1a1a]">
            {new Date(selectedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} at {timeLabel}
          </Text>
        </View>
        <Text className="text-[#C41E3A] text-2xl font-black mt-3">₹{total}</Text>
      </View>

      {/* ── Payment Method ── */}
      <Text className="font-black mt-6 mb-3">Payment Method</Text>
      <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-2">
        <TouchableOpacity
          className={`flex-row items-center p-4 border-b border-gray-50 ${
            paymentType === "online_prepaid" ? "bg-emerald-50" : ""
          }`}
          onPress={() => setPaymentType("online_prepaid")}
        >
          <View
            className={`h-5 w-5 rounded-full border-2 mr-3 items-center justify-center ${
              paymentType === "online_prepaid"
                ? "border-emerald-600"
                : "border-gray-300"
            }`}
          >
            {paymentType === "online_prepaid" && (
              <View className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
            )}
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-[#1a1a1a]">Pay Now (Online)</Text>
            <Text className="text-xs text-gray-400 mt-0.5">UPI / Card / Net Banking</Text>
          </View>
          <Text className="text-base">💳</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-row items-center p-4 ${
            paymentType === "pay_on_collection" ? "bg-orange-50" : ""
          }`}
          onPress={() => setPaymentType("pay_on_collection")}
        >
          <View
            className={`h-5 w-5 rounded-full border-2 mr-3 items-center justify-center ${
              paymentType === "pay_on_collection"
                ? "border-orange-500"
                : "border-gray-300"
            }`}
          >
            {paymentType === "pay_on_collection" && (
              <View className="h-2.5 w-2.5 rounded-full bg-orange-500" />
            )}
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-[#1a1a1a]">Pay After Collection</Text>
            <Text className="text-xs text-gray-400 mt-0.5">
              Pay cash or UPI when collector arrives
            </Text>
          </View>
          <Text className="text-base">🏠</Text>
        </TouchableOpacity>
      </View>

      {/* ── Pay Button ── */}
      <TouchableOpacity
        disabled={payMutation.isPending}
        onPress={() => payMutation.mutate()}
        className={`rounded-xl py-4 mt-4 items-center ${payMutation.isPending ? "bg-[#C41E3A]/50" : "bg-[#C41E3A]"}`}
      >
        {payMutation.isPending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-center font-bold text-base">
            {paymentType === "pay_on_collection" ? "Confirm Booking" : `Pay ₹${total}`}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
