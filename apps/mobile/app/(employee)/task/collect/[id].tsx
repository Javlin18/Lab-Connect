import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import OTPTextInput from "react-native-otp-textinput";

import { getAppointment } from "@/api/appointments";
import { updateStatus } from "@/api/employee";
import { sendOtp, verifyOtp } from "@/api/auth";
import { Screen } from "@/components/screen";
import { StepIndicator } from "@/components/employee/StepIndicator";
import { CollectionChecklist } from "@/components/employee/CollectionChecklist";
import { PaymentQrCard } from "@/components/employee/PaymentQrCard";

export default function CollectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [allChecked, setAllChecked] = useState(false);
  // Per-test barcodes keyed by test name
  const [barcodes, setBarcodes] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const [collectedAt, setCollectedAt] = useState("");

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const query = useQuery({
    enabled: Boolean(id),
    queryKey: ["appointment", id],
    queryFn: () => getAppointment(id as string),
  });

  const appointment = query.data?.data;
  const patientPhone = appointment?.patient?.phone ?? "";
  const maskedPhone = patientPhone
    ? patientPhone.slice(0, 3) + "XXXXXX" + patientPhone.slice(-4)
    : "XXXXXXXXXX";

  const primaryBarcode = appointment?.testTypes[0]
    ? (barcodes[appointment.testTypes[0]] ?? "")
    : Object.values(barcodes)[0] ?? "";

  const allBarcodesEntered =
    (appointment?.testTypes ?? []).every((t) => (barcodes[t] ?? "").trim().length > 0);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  useEffect(() => {
    if (step === 4) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [step]);

  const sendOtpMutation = useMutation({
    mutationFn: () => sendOtp(patientPhone),
    onSuccess: () => { setOtpSent(true); setResendCountdown(30); },
    onError: (err: Error) => Alert.alert("Failed", err.message),
  });

  const verifyMutation = useMutation({
    mutationFn: () => verifyOtp({ phone: patientPhone, otp }),
    onSuccess: () => {
      const ts = new Date().toISOString();
      setCollectedAt(ts);
      confirmMutation.mutate(ts);
    },
    onError: () => setOtpError("Incorrect OTP, please try again"),
  });

  const confirmMutation = useMutation({
    mutationFn: (ts: string) =>
      updateStatus(id as string, "collected", {
        sampleId: primaryBarcode,
        collectionNotes: notes,
        collectedAt: ts,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["appointment", id] });
      await queryClient.invalidateQueries({ queryKey: ["appointments", "assigned"] });
      setStep(4);
    },
    onError: (err: Error) => Alert.alert("Error", err.message),
  });

  if (query.isLoading || !appointment) {
    return (
      <Screen title="Sample Collection">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0F6E56" />
        </View>
      </Screen>
    );
  }

  // ─── STEP 1 — Verify Patient ───────────────────────────────────────────────
  if (step === 1) {
    return (
      <Screen title="Sample Collection">
        <StepIndicator currentStep={1} totalSteps={4} />
        <View className="bg-white border border-slate-100 rounded-3xl p-5 mb-6" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
          <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">
            Patient Details
          </Text>
          <Text className="text-lg font-black text-slate-800">
            {appointment.patient?.name ?? "Patient"}
          </Text>
          <Text className="text-xs text-slate-500 mt-1">Phone: {patientPhone}</Text>
          <Text className="text-xs text-slate-500 mt-0.5">Address: {appointment.address}</Text>
        </View>
        <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8">
          <Text className="text-xs font-bold text-amber-800 text-center leading-relaxed">
            ⚠️ Confirm you are at the correct patient's home before proceeding
          </Text>
        </View>
        <TouchableOpacity
          className="w-full bg-emerald-800 rounded-2xl py-4 items-center justify-center"
          onPress={() => setStep(2)}
        >
          <Text className="text-white font-black text-sm">
            ✓ Yes, this is the correct patient
          </Text>
        </TouchableOpacity>
      </Screen>
    );
  }

  // ─── STEP 2 — Collect Samples + Barcodes ─────────────────────────────────
  if (step === 2) {
    return (
      <Screen title="Sample Collection" scroll={false}>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <StepIndicator currentStep={2} totalSteps={4} />

          <View className="bg-white border border-slate-100 rounded-3xl p-5 mb-4" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
            <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">
              Mark Samples as Collected
            </Text>
            <CollectionChecklist
              tests={appointment.testTypes}
              onAllChecked={setAllChecked}
            />
          </View>

          {/* Per-test barcode inputs */}
          <View className="bg-white border border-slate-100 rounded-3xl p-5 mb-4" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
            <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">
              Sample Barcodes / Tube IDs
            </Text>
            {appointment.testTypes.map((test) => (
              <View key={test} className="mb-3">
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  {test}
                </Text>
                <TextInput
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium"
                  onChangeText={(val) =>
                    setBarcodes((prev) => ({ ...prev, [test]: val }))
                  }
                  placeholder="Enter barcode or tube ID"
                  placeholderTextColor="#94a3b8"
                  value={barcodes[test] ?? ""}
                />
              </View>
            ))}
          </View>

          <View className="bg-white border border-slate-100 rounded-3xl p-5 mb-8" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
            <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
              Collection Notes (Optional)
            </Text>
            <TextInput
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium min-h-[80px]"
              multiline
              numberOfLines={3}
              onChangeText={setNotes}
              placeholder="e.g. Patient had difficulty, used left arm"
              placeholderTextColor="#94a3b8"
              textAlignVertical="top"
              value={notes}
            />
          </View>

          <TouchableOpacity
            className={`w-full rounded-2xl py-4 items-center justify-center mb-8 ${
              allChecked && allBarcodesEntered
                ? "bg-emerald-800"
                : "bg-slate-200"
            }`}
            style={allChecked && allBarcodesEntered ? { shadowColor: '#065f46', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 } : undefined}
            disabled={!allChecked || !allBarcodesEntered}
            onPress={() => setStep(3)}
          >
            <Text
              className={`font-black text-sm ${
                allChecked && allBarcodesEntered ? "text-white" : "text-slate-400"
              }`}
            >
              Proceed to Confirmation →
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </Screen>
    );
  }

  // ─── STEP 3 — OTP Verification ─────────────────────────────────────────────
  if (step === 3) {
    const isVerifying = verifyMutation.isPending || confirmMutation.isPending;
    return (
      <Screen title="Sample Collection">
        <StepIndicator currentStep={3} totalSteps={4} />
        <View className="bg-white border border-slate-100 rounded-3xl p-5 mb-6" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
          <Text className="text-base font-black text-slate-800 mb-2">
            Confirm with Patient OTP
          </Text>
          <Text className="text-xs text-slate-500 leading-relaxed">
            We will send a 4-digit OTP to{" "}
            <Text className="font-bold text-slate-700">+91 {maskedPhone}</Text>
          </Text>
        </View>

        <TouchableOpacity
          className={`w-full rounded-2xl py-4 items-center justify-center mb-4 border ${
            otpSent
              ? "bg-emerald-50 border-emerald-200"
              : "bg-emerald-800 border-emerald-800"
          }`}
          disabled={sendOtpMutation.isPending}
          onPress={() => sendOtpMutation.mutate()}
        >
          {sendOtpMutation.isPending ? (
            <ActivityIndicator color={otpSent ? "#0F6E56" : "#fff"} />
          ) : (
            <Text className={`font-black text-sm ${otpSent ? "text-emerald-700" : "text-white"}`}>
              {otpSent ? "✓ OTP Sent Successfully" : "Send OTP to Patient"}
            </Text>
          )}
        </TouchableOpacity>

        <View className="bg-white border border-slate-100 rounded-3xl p-5 mb-4 items-center" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
          <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">
            Enter 4-Digit OTP
          </Text>
          <OTPTextInput
            handleTextChange={(text) => { setOtp(text); setOtpError(""); }}
            inputCount={4}
            keyboardType="numeric"
            tintColor="#0F6E56"
            offTintColor="#e2e8f0"
            textInputStyle={{
              borderWidth: 2,
              borderRadius: 12,
              width: 52,
              height: 56,
              fontSize: 20,
              fontWeight: "800",
              color: "#1e293b",
            }}
          />
          {otpError ? (
            <Text className="text-xs text-red-500 font-bold mt-3">{otpError}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          className={`w-full rounded-2xl py-4 items-center justify-center mb-4 ${
            otp.length === 4 && !isVerifying ? "bg-emerald-800" : "bg-slate-200"
          }`}
          disabled={otp.length !== 4 || isVerifying}
          onPress={() => verifyMutation.mutate()}
        >
          {isVerifying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className={`font-black text-sm ${otp.length === 4 ? "text-white" : "text-slate-400"}`}>
              Verify & Confirm Collection
            </Text>
          )}
        </TouchableOpacity>

        {otpSent && (
          <View className="items-center">
            {resendCountdown > 0 ? (
              <Text className="text-xs text-slate-400">
                Resend OTP in{" "}
                <Text className="font-bold text-slate-600">{resendCountdown}s</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={() => sendOtpMutation.mutate()}>
                <Text className="text-xs font-bold text-emerald-700 underline">
                  Resend OTP
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Screen>
    );
  }

  // ─── STEP 4 — Success ──────────────────────────────────────────────────────
  return (
    <Screen title="">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Animated.View
          className="items-center py-8"
          style={{ opacity: opacityAnim, transform: [{ scale: scaleAnim }] }}
        >
          <View className="h-24 w-24 bg-emerald-100 rounded-full items-center justify-center border-4 border-emerald-300 mb-4">
            <Text className="text-5xl">✓</Text>
          </View>
          <Text className="text-2xl font-black text-emerald-800">Collection Confirmed!</Text>
          <Text className="text-xs text-slate-400 mt-1">
            {new Date(collectedAt || Date.now()).toLocaleString()}
          </Text>
        </Animated.View>

        {appointment.payment ? (
          <PaymentQrCard
            payment={appointment.payment}
            patientName={appointment.patient?.name}
          />
        ) : null}

        <View className="bg-white border border-slate-100 rounded-3xl p-5 mb-6" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
          <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
            Collection Summary
          </Text>
          <View className="flex-row justify-between py-2 border-b border-slate-50">
            <Text className="text-xs text-slate-500 font-semibold">Patient</Text>
            <Text className="text-xs font-bold text-slate-800">
              {appointment.patient?.name}
            </Text>
          </View>
          <View className="py-2 border-b border-slate-50">
            <Text className="text-xs text-slate-500 font-semibold mb-2">Tests & Barcodes</Text>
            {appointment.testTypes.map((t) => (
              <Text className="text-xs text-emerald-700 font-bold" key={t}>
                ✓ {t} — {barcodes[t] ?? "—"}
              </Text>
            ))}
          </View>
          {notes ? (
            <View className="py-2">
              <Text className="text-xs text-slate-500 font-semibold mb-1">Notes</Text>
              <Text className="text-xs text-slate-600">{notes}</Text>
            </View>
          ) : null}
        </View>

        <View className="flex-row justify-center gap-2 mb-6">
          {["bg-emerald-400", "bg-blue-400", "bg-amber-400", "bg-pink-400", "bg-purple-400"].map(
            (c, i) => <View className={`h-3 w-3 rounded-full ${c}`} key={i} />
          )}
        </View>

        <TouchableOpacity
          className="w-full bg-emerald-800 rounded-2xl py-4 items-center justify-center mb-8"
          onPress={() => router.replace("/(employee)" as never)}
        >
          <Text className="text-white font-black text-sm">← Back to Tasks</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}
