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
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

import { getAppointment } from "@/api/appointments";
import { sendCollectionOtp, updateStatus } from "@/api/employee";
import { createOtpAssistanceRequest, listOtpAssistanceRequests } from "@/api/otp-assistance";
import { Screen } from "@/components/screen";
import { StepIndicator } from "@/components/employee/StepIndicator";
import { CollectionChecklist } from "@/components/employee/CollectionChecklist";
import { PaymentQrCard } from "@/components/employee/PaymentQrCard";
import { BarcodeScannerModal } from "@/components/employee/BarcodeScannerModal";

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
  const [adminOverrideVerified, setAdminOverrideVerified] = useState(false);
  // Barcode scanner
  const [scanningTest, setScanningTest] = useState<string | null>(null);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const query = useQuery({
    enabled: Boolean(id),
    queryKey: ["appointment", id],
    queryFn: () => getAppointment(id as string),
  });

  const appointment = query.data?.data;
  const companyContact = appointment?.patient?.phone || "company number";

  const primaryBarcode = appointment?.testTypes[0]
    ? (barcodes[appointment.testTypes[0]] ?? "")
    : Object.values(barcodes)[0] ?? "";

  const allBarcodesEntered =
    (appointment?.testTypes ?? []).every((t) => (barcodes[t] ?? "").trim().length > 0);

  const assistanceQuery = useQuery({
    enabled: Boolean(id) && step === 3,
    queryKey: ["otp-assistance", id],
    queryFn: () => listOtpAssistanceRequests(id as string),
    refetchInterval: 5000,
  });

  const assistanceRequest = assistanceQuery.data?.data?.[0];

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
    mutationFn: () => sendCollectionOtp(id as string),
    onSuccess: () => { setOtpSent(true); setResendCountdown(30); },
    onError: (err: Error) => Alert.alert("Failed", err.message),
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      // Capture high-accuracy GPS at the moment of collection
      const { status } = await Location.requestForegroundPermissionsAsync();
      let coords: { latitude: number; longitude: number } | null = null;
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      }
      return coords;
    },
    onSuccess: (coords) => {
      const ts = new Date().toISOString();
      setCollectedAt(ts);
      confirmMutation.mutate({ ts, otp, coords });
    },
    onError: () => setOtpError("Incorrect OTP, please try again"),
  });

  const confirmMutation = useMutation({
    mutationFn: ({ ts, otp, coords }: { ts: string; otp: string; coords: { latitude: number; longitude: number } | null }) =>
      updateStatus(id as string, "collected", {
        sampleId: primaryBarcode,
        collectionNotes: notes,
        collectedAt: ts,
        otp,
        barcodes: Object.entries(barcodes).map(([testName, barcodeId]) => ({ testName, barcodeId })),
        ...(coords ? { latitude: coords.latitude, longitude: coords.longitude } : {}),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["appointment", id] });
      await queryClient.invalidateQueries({ queryKey: ["appointments", "assigned"] });
      setStep(4);
    },
    onError: (err: Error) => {
      setOtpError(err.message || "OTP verification failed");
      Alert.alert("Error", err.message);
    },
  });

  const askAdminMutation = useMutation({
    mutationFn: () =>
      createOtpAssistanceRequest({
        appointmentId: id as string,
        reason: notes.trim() || "Booking owner is unavailable or unable to share OTP",
      }),
    onSuccess: async () => {
      await assistanceQuery.refetch();
      Alert.alert("Request sent", "Admin has been notified for OTP assistance.");
    },
    onError: (err: Error) => Alert.alert("Request failed", err.message),
  });

  useEffect(() => {
    if (assistanceRequest?.status === "verified_by_admin" && !adminOverrideVerified) {
      setAdminOverrideVerified(true);
      setCollectedAt(assistanceRequest.resolvedAt ?? new Date().toISOString());
      queryClient.invalidateQueries({ queryKey: ["appointment", id] });
      queryClient.invalidateQueries({ queryKey: ["appointments", "assigned"] });
      setStep(4);
    }
  }, [adminOverrideVerified, assistanceRequest?.resolvedAt, assistanceRequest?.status, id, queryClient]);

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
          <Text className="text-xs text-slate-500 mt-1">Contact via: {companyContact}</Text>
          <Text className="text-xs text-slate-500 mt-0.5">Address: {appointment.address}</Text>
        </View>
        <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 flex-row items-center justify-center gap-2">
          <Ionicons name="warning-outline" size={16} color="#92400E" />
          <Text className="text-xs font-bold text-amber-800 text-center leading-relaxed">
            Confirm you are at the correct patient's home before proceeding
          </Text>
        </View>
        <TouchableOpacity
          className="w-full bg-emerald-800 rounded-2xl py-4 items-center justify-center"
          onPress={() => setStep(2)}
        >
          <View className="flex-row items-center gap-2">
            <Ionicons name="checkmark" size={16} color="white" />
            <Text className="text-white font-black text-sm">
              Yes, this is the correct patient
            </Text>
          </View>
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
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <TextInput
                    style={{ flex: 1 }}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium"
                    onChangeText={(val) =>
                      setBarcodes((prev) => ({ ...prev, [test]: val }))
                    }
                    placeholder="Enter or scan barcode"
                    placeholderTextColor="#94a3b8"
                    value={barcodes[test] ?? ""}
                  />
                  <TouchableOpacity
                    onPress={() => setScanningTest(test)}
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 12,
                      backgroundColor: barcodes[test] ? "#d1fae5" : "#065f46",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {barcodes[test] ? (
                      <Ionicons name="checkmark" size={24} color="#065f46" />
                    ) : (
                      <Ionicons name="camera-outline" size={24} color="white" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Barcode Scanner Modal */}
          {scanningTest !== null && (
            <BarcodeScannerModal
              visible={true}
              testName={scanningTest}
              onScanned={(code) => {
                setBarcodes((prev) => ({ ...prev, [scanningTest]: code }));
                setScanningTest(null);
              }}
              onClose={() => setScanningTest(null)}
            />
          )}

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

        {/* ── Info card ── */}
        <View style={{
          backgroundColor: "white",
          borderWidth: 1,
          borderColor: "#F1F5F9",
          borderRadius: 24,
          padding: 20,
          marginBottom: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <View style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              backgroundColor: "#ECFDF5",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Ionicons name="mail-outline" size={22} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "900", color: "#0F172A" }}>
                Confirm with Patient OTP
              </Text>
              <Text style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>
                Step 3 of 4 — Identity Verification
              </Text>
            </View>
          </View>
          <View style={{
            backgroundColor: "#F8FAFC",
            borderRadius: 12,
            padding: 10,
            borderWidth: 1,
            borderColor: "#E2E8F0",
          }}>
            <Text style={{ fontSize: 12, color: "#64748B", lineHeight: 18 }}>
              A 4-digit OTP will be sent to{" "}
              <Text style={{ fontWeight: "800", color: "#334155" }}>
                the booking owner's registered email.
              </Text>
              {" "}Ask them to share it with you.
            </Text>
          </View>
        </View>

        {/* ── Send OTP button ── */}
        <TouchableOpacity
          style={{
            width: "100%",
            borderRadius: 18,
            paddingVertical: 15,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
            borderWidth: 1.5,
            backgroundColor: otpSent ? "#F0FDF4" : "#065F46",
            borderColor: otpSent ? "#86EFAC" : "#065F46",
            shadowColor: otpSent ? "transparent" : "#065F46",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: otpSent ? 0 : 4,
          }}
          disabled={sendOtpMutation.isPending}
          onPress={() => sendOtpMutation.mutate()}
        >
          {sendOtpMutation.isPending ? (
            <ActivityIndicator color={otpSent ? "#059669" : "#fff"} />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons
                name={otpSent ? "checkmark-circle" : "send-outline"}
                size={18}
                color={otpSent ? "#16A34A" : "white"}
              />
              <Text style={{
                fontWeight: "800",
                fontSize: 14,
                color: otpSent ? "#16A34A" : "white",
              }}>
                {otpSent ? "OTP Sent — Tap to Resend" : "Send OTP to Patient"}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ── OTP Input card ── */}
        <View style={{
          backgroundColor: "white",
          borderWidth: 1,
          borderColor: "#F1F5F9",
          borderRadius: 24,
          paddingVertical: 24,
          paddingHorizontal: 20,
          marginBottom: 16,
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}>
          <Text style={{
            fontSize: 11,
            fontWeight: "800",
            color: "#94A3B8",
            textTransform: "uppercase",
            letterSpacing: 1.5,
            marginBottom: 20,
          }}>
            Enter 4-Digit OTP
          </Text>
          <OTPTextInput
            handleTextChange={(text) => { setOtp(text); setOtpError(""); }}
            inputCount={4}
            keyboardType="numeric"
            tintColor="#059669"
            offTintColor="#E2E8F0"
            textInputStyle={{
              borderWidth: 2,
              borderRadius: 16,
              width: 58,
              height: 64,
              fontSize: 24,
              fontWeight: "900",
              color: "#0F172A",
              backgroundColor: "#F8FAFC",
            } as any}
          />
          {otpError ? (
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginTop: 12,
              backgroundColor: "#FEF2F2",
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderWidth: 1,
              borderColor: "#FECACA",
            }}>
              <Ionicons name="alert-circle-outline" size={14} color="#EF4444" />
              <Text style={{ fontSize: 12, color: "#DC2626", fontWeight: "700" }}>{otpError}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Verify button ── */}
        <TouchableOpacity
          style={{
            width: "100%",
            borderRadius: 18,
            paddingVertical: 16,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
            backgroundColor: otp.length === 4 && !isVerifying ? "#065F46" : "#E2E8F0",
            shadowColor: otp.length === 4 ? "#065F46" : "transparent",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: otp.length === 4 ? 4 : 0,
          }}
          disabled={otp.length !== 4 || isVerifying}
          onPress={() => verifyMutation.mutate()}
        >
          {isVerifying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color={otp.length === 4 ? "white" : "#94A3B8"}
              />
              <Text style={{
                fontWeight: "800",
                fontSize: 14,
                color: otp.length === 4 ? "white" : "#94A3B8",
              }}>
                Verify & Confirm Collection
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ── Resend ── */}
        {otpSent && (
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            {resendCountdown > 0 ? (
              <Text style={{ fontSize: 12, color: "#94A3B8" }}>
                Resend OTP in{" "}
                <Text style={{ fontWeight: "800", color: "#475569" }}>{resendCountdown}s</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={() => sendOtpMutation.mutate()}>
                <Text style={{ fontSize: 12, fontWeight: "800", color: "#059669" }}>
                  Didn't receive it? Resend OTP
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Admin Assistance Card ── */}
        <View style={{
          backgroundColor: "#EFF6FF",
          borderWidth: 1,
          borderColor: "#BFDBFE",
          borderRadius: 24,
          padding: 16,
          marginBottom: 32,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: "#1D4ED8",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Ionicons name="shield-checkmark-outline" size={22} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "900", color: "#1E293B" }}>
                Booking owner unavailable?
              </Text>
              <Text style={{ fontSize: 11, color: "#64748B", marginTop: 2, lineHeight: 16 }}>
                Request OTP assistance from admin.
              </Text>
            </View>
          </View>

          {assistanceRequest ? (
            <View style={{
              backgroundColor: "white",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#BFDBFE",
              padding: 12,
              marginBottom: 12,
            }}>
              <Text style={{ fontSize: 10, fontWeight: "700", color: "#3B82F6", textTransform: "uppercase", letterSpacing: 0.8 }}>
                Request Status
              </Text>
              <Text style={{ fontSize: 13, fontWeight: "900", color: "#1E293B", marginTop: 4 }}>
                {assistanceRequest.status.replace(/_/g, " ").toUpperCase()}
              </Text>
              {assistanceRequest.otpShared ? (
                <View style={{
                  marginTop: 8,
                  backgroundColor: "#ECFDF5",
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: "#A7F3D0",
                  alignItems: "center",
                }}>
                  <Text style={{ fontSize: 11, color: "#065F46", fontWeight: "700", marginBottom: 4 }}>Admin OTP</Text>
                  <Text style={{ fontSize: 28, fontWeight: "900", color: "#047857", letterSpacing: 12 }}>
                    {assistanceRequest.otpShared}
                  </Text>
                </View>
              ) : null}
              {assistanceRequest.adminReason ? (
                <Text style={{ marginTop: 6, fontSize: 11, color: "#64748B" }}>
                  {assistanceRequest.adminReason}
                </Text>
              ) : null}
            </View>
          ) : null}

          <TouchableOpacity
            style={{
              borderRadius: 16,
              paddingVertical: 13,
              alignItems: "center",
              backgroundColor: askAdminMutation.isPending || assistanceRequest ? "#CBD5E1" : "#1D4ED8",
            }}
            disabled={askAdminMutation.isPending || Boolean(assistanceRequest)}
            onPress={() => askAdminMutation.mutate()}
          >
            {askAdminMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons
                  name={assistanceRequest ? "checkmark-circle-outline" : "headset-outline"}
                  size={16}
                  color="white"
                />
                <Text style={{ color: "white", fontSize: 13, fontWeight: "900" }}>
                  {assistanceRequest ? "Admin Request Sent" : "Request Admin OTP"}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
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
            <Ionicons name="checkmark" size={64} color="#059669" />
          </View>
          <Text className="text-2xl font-black text-emerald-800">Collection Confirmed!</Text>
          {adminOverrideVerified ? (
            <View className="mt-3 rounded-full bg-blue-50 border border-blue-200 px-4 py-1.5 self-center">
              <Text className="text-xs font-black text-blue-700 text-center">Verified by Admin</Text>
            </View>
          ) : null}
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
              <View className="flex-row items-center gap-1 mt-1" key={t}>
                <Ionicons name="checkmark-circle" size={14} color="#047857" />
                <Text className="text-xs text-emerald-700 font-bold">
                  {t} — {barcodes[t] ?? "—"}
                </Text>
              </View>
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
