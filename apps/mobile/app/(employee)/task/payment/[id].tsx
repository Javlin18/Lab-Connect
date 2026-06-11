import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import ConfettiCannon from "react-native-confetti-cannon";
import QRCode from "react-native-qrcode-svg";

import {
  checkQRPaymentStatus,
  createQRPaymentLink,
  getOrder,
  manualConfirmPayment,
  type OrderData,
} from "@/api/payments";
import { Screen } from "@/components/screen";
import { buildUpiLink } from "@/lib/upi";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type PaymentState = "checking" | "already_paid" | "show_qr" | "paid";

// ─── ManualPaymentModal ─────────────────────────────────────────────────────

function ManualPaymentModal({
  visible,
  onClose,
  orderId,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  orderId: string;
  onSuccess: () => void;
}) {
  const [txId, setTxId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!txId.trim()) return;
    setLoading(true);
    try {
      await manualConfirmPayment({ orderId, method: "upi_manual", transactionId: txId.trim() });
      onSuccess();
    } catch (err: any) {
      Alert.alert("Failed", err.message ?? "Failed to confirm. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-white rounded-t-3xl p-6">
          <Text className="text-base font-black text-slate-800 mb-1">
            Enter UPI Transaction ID
          </Text>
          <Text className="text-xs text-slate-400 mb-5">
            Ask patient to share the UPI transaction reference number
          </Text>

          <Text className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
            UPI Reference / Transaction ID
          </Text>
          <TextInput
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium mb-5"
            placeholder="e.g. 407890561234"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
            maxLength={20}
            value={txId}
            onChangeText={setTxId}
          />

          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-slate-100 rounded-2xl py-3.5 items-center"
              onPress={onClose}
            >
              <Text className="font-bold text-slate-600 text-sm">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 rounded-2xl py-3.5 items-center ${
                txId.trim() && !loading ? "bg-emerald-800" : "bg-slate-200"
              }`}
              disabled={!txId.trim() || loading}
              onPress={handleConfirm}
            >
              <Text className={`font-black text-sm ${txId.trim() ? "text-white" : "text-slate-400"}`}>
                {loading ? "Confirming..." : "Confirm Payment"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── CashConfirmModal ───────────────────────────────────────────────────────

function CashConfirmModal({
  visible,
  onClose,
  orderId,
  amount,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  orderId: string;
  amount: number;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await manualConfirmPayment({ orderId, method: "cash" });
      onSuccess();
    } catch (err: any) {
      Alert.alert("Failed", err.message ?? "Failed to confirm.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-white rounded-t-3xl p-6">
          <Text className="text-base font-black text-slate-800 mb-1">
            Confirm Cash Payment
          </Text>

          <View className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-4 mt-3 flex-row items-start gap-2">
            <Text className="text-orange-600 text-base">⚠️</Text>
            <Text className="text-xs font-bold text-orange-800 leading-relaxed flex-1">
              Only confirm if you have physically received the cash from the patient.
            </Text>
          </View>

          <Text className="text-xl font-black text-slate-800 text-center mb-5">
            Amount received: ₹{amount}
          </Text>

          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-slate-100 rounded-2xl py-3.5 items-center"
              onPress={onClose}
            >
              <Text className="font-bold text-slate-600 text-sm">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 rounded-2xl py-3.5 items-center ${
                loading ? "bg-slate-200" : "bg-orange-500"
              }`}
              disabled={loading}
              onPress={handleConfirm}
            >
              <Text className="font-black text-sm text-white">
                {loading ? "Confirming..." : "Yes, Cash Received"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Payment Screen ─────────────────────────────────────────────────────

export default function PaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [paymentState, setPaymentState] = useState<PaymentState>("checking");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [paymentLinkId, setPaymentLinkId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [showManualModal, setShowManualModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Polling ref
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Mount: fetch order and determine state ────────────────────────────

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        const res = await getOrder(id);
        const o = res.data;
        setOrder(o);

        if (o.paymentStatus === "paid") {
          setPaymentState("already_paid");
          return;
        }

        // Pending payment — create payment link for QR
        if (o.paymentStatus === "pending") {
          const fallbackUpiLink = buildUpiLink(
            o.totalAmount,
            o.id,
            o.patient?.name
          );

          setPaymentUrl(o.paymentLinkUrl ?? fallbackUpiLink);

          try {
            const linkRes = await createQRPaymentLink(o.id);
            setPaymentUrl(linkRes.data.paymentUrl);
            setPaymentLinkId(linkRes.data.paymentLinkId);
          } catch (err) {
            console.warn("Payment link creation failed, using UPI QR", err);
          }
          setPaymentState("show_qr");
        }
      } catch (err: any) {
        Alert.alert("Error", err.message ?? "Could not load order");
        router.back();
      }
    })();

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [id]);

  // ─── Polling ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (paymentState !== "show_qr" || !paymentLinkId) return;

    pollingRef.current = setInterval(async () => {
      try {
        const res = await checkQRPaymentStatus(paymentLinkId);
        if (res.data.status === "paid") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setPaymentMethod("UPI (Razorpay)");
          setPaymentState("paid");
        }
      } catch {
        // silent fail, keep polling
      }
    }, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [paymentState, paymentLinkId]);

  // ─── Pulsing dot animation ─────────────────────────────────────────────

  useEffect(() => {
    if (paymentState === "show_qr") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.4, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [paymentState]);

  // ─── Success animation ─────────────────────────────────────────────────

  useEffect(() => {
    if (paymentState === "paid") {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [paymentState]);

  // ─── Manual check ──────────────────────────────────────────────────────

  const manualCheck = async () => {
    if (!paymentLinkId) return;
    try {
      const res = await checkQRPaymentStatus(paymentLinkId);
      if (res.data.status === "paid") {
        if (pollingRef.current) clearInterval(pollingRef.current);
        setPaymentMethod("UPI (Razorpay)");
        setPaymentState("paid");
      } else {
        Alert.alert("Still Waiting", "Payment not received yet. Keep showing the QR code.");
      }
    } catch {
      Alert.alert("Error", "Could not check payment status.");
    }
  };

  const amount = order?.totalAmount ?? 0;
  const patientName = order?.patient?.name ?? "Patient";
  const shortId = (order?.id ?? "").slice(0, 8).toUpperCase();

  // ═══════════════════════════════════════════════════════════════════════
  // STATE 0 — CHECKING
  // ═══════════════════════════════════════════════════════════════════════

  if (paymentState === "checking") {
    return (
      <Screen title="">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0F6E56" />
          <Text className="text-xs text-slate-400 mt-3">Checking payment status...</Text>
        </View>
      </Screen>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STATE 1 — ALREADY PAID
  // ═══════════════════════════════════════════════════════════════════════

  if (paymentState === "already_paid") {
    return (
      <Screen title="">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="items-center py-8">
            <View className="h-20 w-20 bg-green-500 rounded-full items-center justify-center mb-4">
              <Text className="text-4xl text-white">✓</Text>
            </View>
            <Text className="text-2xl font-black text-green-600">Already Paid ✓</Text>
            <Text className="text-sm text-slate-400 mt-1">
              This patient paid online during booking.
            </Text>
          </View>

          <View className="bg-white border border-slate-100 rounded-2xl p-4 mx-1 mb-4" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
            <View className="flex-row justify-between py-2 border-b border-slate-50">
              <Text className="text-xs text-slate-500 font-semibold">Patient</Text>
              <Text className="text-xs font-bold text-slate-800">{patientName}</Text>
            </View>
            <View className="flex-row justify-between py-2 border-b border-slate-50">
              <Text className="text-xs text-slate-500 font-semibold">Amount Paid</Text>
              <Text className="text-xs font-bold text-green-600">₹{amount}</Text>
            </View>
            <View className="flex-row justify-between py-2 border-b border-slate-50">
              <Text className="text-xs text-slate-500 font-semibold">Payment Method</Text>
              <Text className="text-xs font-bold text-slate-800">Online (Razorpay)</Text>
            </View>
            {order?.paidAt && (
              <View className="flex-row justify-between py-2 border-b border-slate-50">
                <Text className="text-xs text-slate-500 font-semibold">Paid On</Text>
                <Text className="text-xs font-bold text-slate-800">
                  {new Date(order.paidAt).toLocaleString()}
                </Text>
              </View>
            )}
            {order?.razorpayPaymentId && (
              <View className="flex-row justify-between py-2">
                <Text className="text-xs text-slate-500 font-semibold">Payment ID</Text>
                <Text className="text-xs text-slate-400" numberOfLines={1}>
                  {order.razorpayPaymentId}
                </Text>
              </View>
            )}
          </View>

          <View className="bg-green-50 border border-green-200 rounded-2xl p-4 mx-1 mb-6 flex-row items-center gap-2">
            <Text className="text-green-600 text-base">🛡</Text>
            <Text className="text-xs font-bold text-green-700 flex-1 leading-relaxed">
              No payment collection needed. Patient is cleared to go.
            </Text>
          </View>

          <TouchableOpacity
            className="bg-emerald-800 rounded-2xl py-4 mx-1 items-center justify-center mb-8"
            onPress={() => router.back()}
          >
            <Text className="text-white font-black text-sm">← Back to Task</Text>
          </TouchableOpacity>
        </ScrollView>
      </Screen>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STATE 3 — PAYMENT RECEIVED
  // ═══════════════════════════════════════════════════════════════════════

  if (paymentState === "paid") {
    return (
      <Screen title="">
        <ConfettiCannon
          count={120}
          origin={{ x: SCREEN_WIDTH / 2, y: -10 }}
          fadeOut
        />
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <Animated.View
            className="items-center py-8"
            style={{ opacity: opacityAnim, transform: [{ scale: scaleAnim }] }}
          >
            <View className="h-24 w-24 bg-green-500 rounded-full items-center justify-center mb-4 border-4 border-green-300">
              <Text className="text-5xl text-white">✓</Text>
            </View>
            <Text className="text-2xl font-black text-slate-800 mt-2">
              Payment Received! 🎉
            </Text>
            <Text className="text-3xl font-black text-green-500 mt-1">₹{amount}</Text>
            <Text className="text-xs text-slate-400 mt-1">
              {paymentMethod ? `via ${paymentMethod}` : "Payment confirmed"}
            </Text>
          </Animated.View>

          <View className="bg-white border border-slate-100 rounded-2xl p-4 mx-1 mb-4" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
            <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
              🧾 Receipt
            </Text>
            <View className="flex-row justify-between py-2 border-b border-slate-50">
              <Text className="text-xs text-slate-500 font-semibold">Patient</Text>
              <Text className="text-xs font-bold text-slate-800">{patientName}</Text>
            </View>
            <View className="flex-row justify-between py-2 border-b border-slate-50">
              <Text className="text-xs text-slate-500 font-semibold">Amount</Text>
              <Text className="text-xs font-bold text-green-600">₹{amount}</Text>
            </View>
            <View className="flex-row justify-between py-2 border-b border-slate-50">
              <Text className="text-xs text-slate-500 font-semibold">Method</Text>
              <Text className="text-xs font-bold text-slate-800">{paymentMethod || "—"}</Text>
            </View>
            <View className="flex-row justify-between py-2 border-b border-slate-50">
              <Text className="text-xs text-slate-500 font-semibold">Time</Text>
              <Text className="text-xs font-bold text-slate-800">
                {new Date().toLocaleString()}
              </Text>
            </View>
            {transactionId ? (
              <View className="flex-row justify-between py-2">
                <Text className="text-xs text-slate-500 font-semibold">Transaction ID</Text>
                <Text className="text-xs text-slate-400">{transactionId}</Text>
              </View>
            ) : null}
          </View>

          <View className="mx-1 mt-2 mb-8 gap-2">
            <TouchableOpacity
              className="bg-emerald-800 rounded-2xl py-4 items-center justify-center"
              onPress={() => router.back()}
            >
              <Text className="text-white font-black text-sm">← Back to Task</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-white border border-slate-200 rounded-2xl py-3 items-center justify-center"
              onPress={() => router.replace("/(employee)" as never)}
            >
              <Text className="text-slate-600 font-bold text-sm">← Back to Home</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Screen>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STATE 2 — SHOW QR CODE
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <Screen title="Collect Payment">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

        {/* Amount Header */}
        <View
          className="rounded-2xl p-4 mb-4"
          style={{ backgroundColor: "#0F6E56" }}
        >
          <Text className="text-white text-xs opacity-80">Amount to Collect</Text>
          <Text className="text-white text-3xl font-black mt-0.5">₹{amount}</Text>
          <Text className="text-white text-xs opacity-60 mt-0.5">Order #{shortId}</Text>
        </View>

        {/* QR Card */}
        <View
          className="bg-white rounded-2xl p-5 mb-3 items-center"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
        >
          <Text className="text-xs text-slate-400 mb-3">Scan to Pay</Text>

          {paymentUrl ? (
            <View className="bg-white p-2 rounded-xl border border-slate-100">
              <QRCode
                value={paymentUrl}
                size={220}
                color="#000000"
                backgroundColor="#FFFFFF"
              />
            </View>
          ) : (
            <View className="h-[220px] w-[220px] items-center justify-center bg-slate-50 rounded-xl">
              <ActivityIndicator color="#0F6E56" />
              <Text className="text-xs text-slate-400 mt-2">Generating QR...</Text>
            </View>
          )}

          <Text className="text-xl font-black mt-3" style={{ color: "#C41E3A" }}>₹{amount}</Text>
          <Text className="text-xs text-slate-400">{patientName}</Text>

          <View className="w-full h-px bg-slate-100 my-4" />

          {/* UPI Apps Row */}
          <Text className="text-xs text-slate-400 mb-2">Pay using</Text>
          <View className="flex-row gap-2">
            {["PhonePe", "GPay", "Paytm", "Any UPI"].map((app) => (
              <View key={app} className="bg-slate-100 rounded-full px-3 py-1">
                <Text className="text-xs text-slate-500 font-medium">{app}</Text>
              </View>
            ))}
          </View>

          <Text className="text-xs text-slate-300 mt-3">
            QR code is valid for 30 minutes
          </Text>
        </View>

        {/* Payment Status */}
        <View
          className="bg-white rounded-2xl p-4 mb-3 flex-row items-center gap-3"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}
        >
          <Animated.View
            style={{ transform: [{ scale: pulseAnim }] }}
            className="w-2.5 h-2.5 rounded-full bg-orange-400"
          />
          <Text className="text-xs font-bold text-slate-600">Waiting for payment...</Text>
        </View>

        {/* Manual Refresh */}
        <View className="flex-row items-center justify-center mb-4">
          <Text className="text-xs text-slate-400">Not updating? </Text>
          <TouchableOpacity onPress={manualCheck}>
            <Text className="text-xs font-bold text-emerald-700">Tap to check</Text>
          </TouchableOpacity>
        </View>

        {/* Fallback Options */}
        <View className="mb-8">
          <Text className="text-xs text-slate-400 font-bold mb-3">
            Patient can't scan?
          </Text>

          <TouchableOpacity
            className="bg-white border border-slate-200 rounded-2xl py-3 items-center flex-row justify-center gap-2 mb-2"
            onPress={() => {
              if (paymentUrl) {
                Share.share({ message: `Pay ₹${amount} for your lab test: ${paymentUrl}` });
              }
            }}
          >
            <Text className="text-sm">📤</Text>
            <Text className="text-sm font-bold text-slate-700">Share Payment Link</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-white border border-slate-200 rounded-2xl py-3 items-center flex-row justify-center gap-2 mb-2"
            onPress={() => setShowManualModal(true)}
          >
            <Text className="text-sm">⌨️</Text>
            <Text className="text-sm font-bold text-slate-700">Enter UPI Transaction ID</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="py-3 items-center"
            onPress={() => setShowCashModal(true)}
          >
            <Text className="text-xs text-slate-400 font-medium">💵 Mark as Cash Payment</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modals */}
      <ManualPaymentModal
        visible={showManualModal}
        onClose={() => setShowManualModal(false)}
        orderId={order?.id ?? ""}
        onSuccess={() => {
          setShowManualModal(false);
          if (pollingRef.current) clearInterval(pollingRef.current);
          setPaymentMethod("Manual UPI");
          setPaymentState("paid");
        }}
      />

      <CashConfirmModal
        visible={showCashModal}
        onClose={() => setShowCashModal(false)}
        orderId={order?.id ?? ""}
        amount={amount}
        onSuccess={() => {
          setShowCashModal(false);
          if (pollingRef.current) clearInterval(pollingRef.current);
          setPaymentMethod("Cash");
          setPaymentState("paid");
        }}
      />
    </Screen>
  );
}
