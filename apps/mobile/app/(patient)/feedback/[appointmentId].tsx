import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ConfettiCannon from "react-native-confetti-cannon";
import { Ionicons } from "@expo/vector-icons";

import { submitFeedback } from "@/api/feedback";
import { getMyOrders } from "@/api/patient";

// ── helpers ──────────────────────────────────────────────────────────────────

const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

const RATING_COLORS: Record<number, string> = {
  1: "#EF4444",
  2: "#F97316",
  3: "#F59E0B",
  4: "#22C55E",
  5: "#16A34A",
};

function formatSlot(slot: string) {
  try {
    const d = new Date(slot);
    const date = d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    const time = d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return { date, time };
  } catch {
    return { date: slot, time: "" };
  }
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// ── sub-components ────────────────────────────────────────────────────────────

function StarRow({
  rating,
  onSelect,
}: {
  rating: number;
  onSelect: (r: number) => void;
}) {
  return (
    <View className="flex-row gap-3 mt-4">
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onSelect(star)} activeOpacity={0.7}>
          <Ionicons 
            name={star <= rating ? "star" : "star-outline"} 
            size={42} 
            color={star <= rating ? RATING_COLORS[rating] ?? "#F59E0B" : "#D1D5DB"} 
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function YesNoToggle({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <View className="flex-row border border-gray-200 rounded-xl overflow-hidden">
      <TouchableOpacity
        onPress={() => onChange(true)}
        className={`px-4 py-2 ${value === true ? "bg-[#0F6E56]" : "bg-white"}`}
      >
        <Text
          className={`text-xs font-bold ${value === true ? "text-white" : "text-gray-500"}`}
        >
          Yes
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onChange(false)}
        className={`px-4 py-2 ${value === false ? "bg-[#C41E3A]" : "bg-white"}`}
      >
        <Text
          className={`text-xs font-bold ${value === false ? "text-white" : "text-gray-500"}`}
        >
          No
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function ToggleRow({
  icon,
  label,
  value,
  onChange,
}: {
  icon: string;
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <View className="flex-row items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <View className="flex-row items-center flex-1 mr-3">
        <Ionicons name={icon as any} size={20} color="#4B5563" style={{ marginRight: 8 }} />
        <Text className="text-[13px] text-gray-700 flex-1">{label}</Text>
      </View>
      <YesNoToggle value={value} onChange={onChange} />
    </View>
  );
}

// ── success overlay ───────────────────────────────────────────────────────────

function SuccessOverlay({ onDone }: { onDone: () => void }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  // Animate in
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View className="absolute inset-0 bg-black/50 items-center justify-center z-50">
      <ConfettiCannon
        count={120}
        origin={{ x: 200, y: 0 }}
        fadeOut
        autoStart
      />
      <Animated.View
        style={{ transform: [{ scale: scaleAnim }] }}
        className="bg-white rounded-3xl p-8 mx-8 items-center"
      >
        <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center mb-4">
          <Ionicons name="checkmark" size={40} color="#16A34A" />
        </View>
        <Text className="text-xl font-black text-[#1a1a1a] text-center">
          Thank you for your feedback!
        </Text>
        <Text className="text-gray-500 text-sm text-center mt-2">
          Your response helps us improve our service.
        </Text>
        <TouchableOpacity
          onPress={onDone}
          className="mt-6 bg-[#0F6E56] rounded-2xl px-8 py-3"
        >
          <Text className="text-white font-bold">Done</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ── main screen ───────────────────────────────────────────────────────────────

export default function FeedbackScreen() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const queryClient = useQueryClient();

  // Find appointment/employee info from cached orders
  const ordersQuery = useQuery({
    queryKey: ["patient-orders"],
    queryFn: () => getMyOrders(),
  });

  const order = (ordersQuery.data?.data ?? []).find(
    (o) => o.appointment?.id === appointmentId || o.appointmentId === appointmentId
  );
  const appointment = order?.appointment;
  const employeeName: string = appointment?.employee?.name ?? "Your Collector";
  const slot: string = appointment?.slot ?? order?.items?.slot ?? "";
  const { date: visitDate, time: visitTime } = formatSlot(slot);

  // Form state
  const [rating, setRating] = useState(0);
  const [gloves, setGloves] = useState<boolean | null>(null);
  const [mask, setMask] = useState<boolean | null>(null);
  const [punctual, setPunctual] = useState<boolean | null>(null);
  const [professional, setProfessional] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const isReady =
    rating > 0 &&
    gloves !== null &&
    mask !== null &&
    punctual !== null &&
    professional !== null;

  const mutation = useMutation({
    mutationFn: () =>
      submitFeedback({
        appointmentId,
        overallRating: rating,
        woreGloves: gloves!,
        woreMask: mask!,
        wasPunctual: punctual!,
        wasProfessional: professional!,
        comment: comment.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-orders"] });
      queryClient.invalidateQueries({ queryKey: ["feedback-pending"] });
      setShowSuccess(true);
      // Auto-navigate after 2.5 s
      setTimeout(() => {
        router.back();
      }, 2500);
    },
  });

  function handleDone() {
    router.back();
  }

  const ratingColor = rating > 0 ? RATING_COLORS[rating] : "#9CA3AF";

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F5]" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View className="px-5 pt-4 pb-2">
          <TouchableOpacity onPress={() => router.back()} className="mb-3">
            <Text className="text-[#0F6E56] font-bold">← Back</Text>
          </TouchableOpacity>
          <Text className="text-[20px] font-black text-[#1a1a1a]">
            Rate Your Experience
          </Text>
          <Text className="text-gray-400 text-sm mt-1">
            Help us improve our service
          </Text>
        </View>

        {/* ── Employee Card ── */}
        <View className="mx-4 mt-3 bg-white rounded-2xl p-4 border border-gray-100 flex-row items-center">
          <View className="w-14 h-14 rounded-full bg-[#0F6E56] items-center justify-center mr-4">
            <Text className="text-white font-black text-lg">
              {initials(employeeName)}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="font-black text-[#1a1a1a] text-base">
              {employeeName}
            </Text>
            {visitDate ? (
              <Text className="text-gray-400 text-xs mt-1">
                Visited on {visitDate}
                {visitTime ? ` at ${visitTime}` : ""}
              </Text>
            ) : null}
          </View>
        </View>

        {/* ── Overall Rating ── */}
        <View className="mx-4 mt-3 bg-white rounded-2xl p-4 border border-gray-100 items-center">
          <Text className="font-black text-[15px] text-[#1a1a1a] text-center">
            How was your overall experience?
          </Text>
          <StarRow rating={rating} onSelect={setRating} />
          {rating > 0 ? (
            <Text
              className="mt-3 text-sm font-bold"
              style={{ color: ratingColor }}
            >
              {RATING_LABELS[rating]}
            </Text>
          ) : (
            <Text className="mt-3 text-sm text-gray-300">Tap a star to rate</Text>
          )}
        </View>

        <View className="mx-4 mt-3 bg-white rounded-2xl p-4 border border-gray-100">
          <View className="flex-row items-center gap-1.5 mb-2">
            <Ionicons name="medical-outline" size={16} color="#1a1a1a" />
            <Text className="font-black text-[14px] text-[#1a1a1a]">
              Hygiene & Safety
            </Text>
          </View>
          <ToggleRow
            icon="hand-left-outline"
            label="Did the collector wear gloves?"
            value={gloves}
            onChange={setGloves}
          />
          <ToggleRow
            icon="medkit-outline"
            label="Did the collector wear a mask?"
            value={mask}
            onChange={setMask}
          />
        </View>

        <View className="mx-4 mt-3 bg-white rounded-2xl p-4 border border-gray-100">
          <View className="flex-row items-center gap-1.5 mb-2">
            <Ionicons name="star-outline" size={16} color="#1a1a1a" />
            <Text className="font-black text-[14px] text-[#1a1a1a]">
              Professionalism
            </Text>
          </View>
          <ToggleRow
            icon="time-outline"
            label="Was the collector on time?"
            value={punctual}
            onChange={setPunctual}
          />
          <ToggleRow
            icon="person-outline"
            label="Was the collector polite and professional?"
            value={professional}
            onChange={setProfessional}
          />
        </View>

        {/* ── Comment ── */}
        <View className="mx-4 mt-3 bg-white rounded-2xl p-4 border border-gray-100">
          <Text className="text-gray-400 text-[13px] mb-2">
            Additional Comments (Optional)
          </Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Tell us more about your experience..."
            placeholderTextColor="#D1D5DB"
            multiline
            numberOfLines={4}
            maxLength={300}
            className="text-[#1a1a1a] text-sm leading-5"
            style={{ minHeight: 90, textAlignVertical: "top" }}
          />
          <Text className="text-gray-300 text-xs text-right mt-2">
            {comment.length}/300
          </Text>
        </View>

        {/* ── Submit ── */}
        <View className="mx-4 mt-4">
          <TouchableOpacity
            disabled={!isReady || mutation.isPending}
            onPress={() => mutation.mutate()}
            className={`rounded-2xl py-4 items-center ${
              isReady ? "bg-[#C41E3A]" : "bg-gray-200"
            }`}
          >
            <Text
              className={`font-black text-base ${isReady ? "text-white" : "text-gray-400"}`}
            >
              {mutation.isPending ? "Submitting…" : "Submit Feedback"}
            </Text>
          </TouchableOpacity>

          {!isReady && (
            <Text className="text-gray-400 text-xs text-center mt-2">
              Please answer all questions to submit
            </Text>
          )}

          {mutation.isError && (
            <Text className="text-red-500 text-xs text-center mt-2">
              {(mutation.error as Error)?.message ?? "Something went wrong"}
            </Text>
          )}
        </View>

        {/* ── Skip ── */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="items-center mt-6 mb-2"
        >
          <Text className="text-gray-400 text-sm underline">Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Success overlay ── */}
      {showSuccess && <SuccessOverlay onDone={handleDone} />}
    </SafeAreaView>
  );
}
