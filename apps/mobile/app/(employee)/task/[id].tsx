import React, { useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import { getAppointment } from "@/api/appointments";
import { acceptAppointment, claimAppointment, updateStatus } from "@/api/employee";
import { apiFetch } from "@/api/client";
import { Screen } from "@/components/screen";
import { StatusBadge } from "@/components/employee/StatusBadge";

const REASSIGN_REASONS = [
  "patient_not_home",
  "wrong_address",
  "patient_cancelled",
  "emergency",
  "vehicle_breakdown",
  "other",
] as const;

const REASON_LABELS: Record<string, string> = {
  patient_not_home: "Patient not home",
  wrong_address: "Wrong address / Cannot find location",
  patient_cancelled: "Patient cancelled",
  emergency: "Personal emergency",
  vehicle_breakdown: "Vehicle breakdown",
  other: "Other",
};

function ReassignModal({
  visible,
  onClose,
  appointmentId,
}: {
  visible: boolean;
  onClose: () => void;
  appointmentId: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState<string>("");
  const [note, setNote] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch(`/appointments/${appointmentId}/reassign-request`, {
        method: "POST",
        body: { reason, note: note || undefined },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", "assigned"] });
      onClose();
      Alert.alert("Request Sent", "Reassignment request sent to admin.");
      router.replace("/(employee)");
    },
    onError: (err: Error) => Alert.alert("Failed", err.message),
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-white rounded-t-3xl p-6">
          <Text className="text-base font-black text-slate-800 mb-1">
            Request Reassignment
          </Text>
          <Text className="text-xs text-slate-400 mb-5">
            This will notify admin to assign another collector
          </Text>

          <Text className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
            Reason (required)
          </Text>
          <View className="gap-2 mb-4">
            {REASSIGN_REASONS.map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setReason(r)}
                className={`flex-row items-center p-3 rounded-xl border ${
                  reason === r
                    ? "bg-red-50 border-red-300"
                    : "bg-slate-50 border-slate-100"
                }`}
              >
                <View
                  className={`h-4 w-4 rounded-full border-2 mr-3 ${
                    reason === r ? "border-red-500 bg-red-500" : "border-slate-300"
                  }`}
                />
                <Text
                  className={`text-xs font-semibold ${
                    reason === r ? "text-red-700" : "text-slate-600"
                  }`}
                >
                  {REASON_LABELS[r]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
            Additional Note (optional)
          </Text>
          <TextInput
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 mb-5 min-h-[72px]"
            multiline
            maxLength={200}
            onChangeText={setNote}
            placeholder="Any details that will help admin..."
            placeholderTextColor="#94a3b8"
            textAlignVertical="top"
            value={note}
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
                reason && !mutation.isPending
                  ? "bg-red-500"
                  : "bg-slate-200"
              }`}
              disabled={!reason || mutation.isPending}
              onPress={() => mutation.mutate()}
            >
              <Text
                className={`font-black text-sm ${
                  reason ? "text-white" : "text-slate-400"
                }`}
              >
                {mutation.isPending ? "Sending..." : "Submit Request"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function EmployeeTaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showReassign, setShowReassign] = useState(false);

  const query = useQuery({
    enabled: Boolean(id),
    queryKey: ["appointment", id],
    queryFn: () => getAppointment(id as string),
  });

  const appointment = query.data?.data;

  const acceptMutation = useMutation({
    mutationFn: () => acceptAppointment(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment", id] });
      queryClient.invalidateQueries({ queryKey: ["appointments", "assigned"] });
      Alert.alert("Accepted", "Task accepted successfully.");
    },
    onError: (err: any) => Alert.alert("Error", err.message),
  });

  const claimMutation = useMutation({
    mutationFn: () => claimAppointment(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment", id] });
      queryClient.invalidateQueries({ queryKey: ["appointments", "assigned"] });
      queryClient.invalidateQueries({ queryKey: ["appointments", "available"] });
      Alert.alert("Claimed", "Task added to your list.");
    },
    onError: (err: any) => Alert.alert("Error", err.message),
  });

  const enRouteMutation = useMutation({
    mutationFn: () => updateStatus(id as string, "en_route"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment", id] });
      queryClient.invalidateQueries({ queryKey: ["appointments", "assigned"] });
      router.push(`/(employee)/task/navigate/${id}`);
    },
  });

  if (query.isLoading) {
    return (
      <Screen title="Task Details">
        <View className="flex-1 items-center justify-center">
          <Text className="text-xs text-slate-400">Loading details...</Text>
        </View>
      </Screen>
    );
  }

  if (!appointment) {
    return (
      <Screen title="Task Details">
        <View className="flex-1 items-center justify-center">
          <Text className="text-xs text-slate-400">Task not found</Text>
        </View>
      </Screen>
    );
  }

  const isAvailable = appointment.status === "pending" && !appointment.employeeId;
  const isAssigned = appointment.status === "assigned";
  const isAccepted = appointment.status === "accepted";
  const isEnRoute = appointment.status === "en_route";
  const isCollected =
    appointment.status === "completed" ||
    (appointment.status as string) === "collected";
  const canReassign = isAssigned || isAccepted || isEnRoute;

  return (
    <Screen title={`Task #A-${id.slice(0, 8).toUpperCase()}`}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        <View className="w-full bg-slate-100 border border-slate-200/50 rounded-2xl p-4 flex-row justify-between items-center mb-6">
          <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Status
          </Text>
          <StatusBadge status={appointment.status} />
        </View>

        {/* Patient Info */}
        <View className="bg-white border border-slate-100 rounded-3xl p-5 mb-6 shadow-sm">
          <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
            Patient Information
          </Text>
          <Text className="text-base font-black text-slate-800">
            {appointment.patient?.name ?? "Patient"}
          </Text>

          <View className="flex-row gap-3 mt-3">
            <TouchableOpacity
              className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-2.5 items-center flex-row justify-center gap-1.5"
              onPress={() => {
                const phone = appointment.patient?.phone;
                if (phone) Linking.openURL(`tel:${phone}`);
              }}
            >
              <Ionicons name="call-outline" size={14} color="#475569" />
              <Text className="text-slate-600 font-bold text-xs">Call Patient</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-2.5 items-center flex-row justify-center gap-1.5"
              onPress={async () => {
                await Clipboard.setStringAsync(appointment.address);
                Alert.alert("Copied", "Address copied!");
              }}
            >
              <Ionicons name="copy-outline" size={14} color="#475569" />
              <Text className="text-slate-600 font-bold text-xs">Copy Address</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100/50 mt-3 flex-row items-center">
            <Ionicons name="location-outline" size={14} color="#475569" /> {appointment.address}
          </Text>

          <TouchableOpacity
            className="mt-3 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex-row items-center justify-center gap-2"
            onPress={() => {
              const addr = encodeURIComponent(appointment.address);
              Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${addr}`);
            }}
          >
            <Ionicons name="navigate-outline" size={18} color="#2563EB" />
            <Text className="text-sm font-bold text-blue-600">Open in Google Maps</Text>
          </TouchableOpacity>
        </View>

        {/* Tests */}
        <View className="bg-white border border-slate-100 rounded-3xl p-5 mb-6 shadow-sm">
          <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
            Tests Required
          </Text>
          {(appointment.testTypes ?? []).length ? (
            appointment.testTypes.map((test) => (
              <View
                className="flex-row items-center justify-between p-3.5 rounded-xl border bg-slate-50 border-slate-100 mb-2"
                key={test}
              >
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="checkmark-circle" size={14} color="#334155" />
                  <Text className="text-xs font-bold text-slate-700">{test}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text className="text-xs text-slate-400">No tests listed for this booking.</Text>
          )}
        </View>

        {/* Visit Details */}
        <View className="bg-white border border-slate-100 rounded-3xl p-5 mb-6 shadow-sm">
          <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
            Visit Details
          </Text>
          <Text className="text-xs font-semibold text-slate-700">
            Slot: <Text className="font-normal text-slate-500">{appointment.slot}</Text>
          </Text>
          <Text className="text-xs font-semibold text-slate-700 mt-1.5">
            Notes:{" "}
            <Text className="font-normal text-slate-500">
              {appointment.notes || "No special instructions."}
            </Text>
          </Text>
        </View>

        {/* Actions */}
        <View className="mb-4 gap-3">
          {isAvailable && (
            <TouchableOpacity
              className="w-full bg-blue-500 rounded-2xl py-4 items-center justify-center"
              onPress={() => claimMutation.mutate()}
            >
              <Text className="text-white font-black text-sm">
                {claimMutation.isPending ? "CLAIMING..." : "CLAIM TASK"}
              </Text>
            </TouchableOpacity>
          )}

          {isAssigned && (
            <TouchableOpacity
              className="w-full bg-blue-500 rounded-2xl py-4 items-center justify-center"
              onPress={() => acceptMutation.mutate()}
            >
              <Text className="text-white font-black text-sm">ACCEPT TASK</Text>
            </TouchableOpacity>
          )}

          {isAccepted && (
            <TouchableOpacity
              className="w-full bg-emerald-800 rounded-2xl py-4 items-center justify-center"
              onPress={() => enRouteMutation.mutate()}
            >
              <Text className="text-white font-black text-sm">START NAVIGATION</Text>
            </TouchableOpacity>
          )}

          {isEnRoute && (
            <>
              <View className="flex-row justify-center items-center gap-1.5 mb-2">
                <Ionicons name="car-outline" size={16} color="#EA580C" />
                <Text className="text-center text-xs font-bold text-orange-600">
                  Currently navigating to patient home...
                </Text>
              </View>
              <TouchableOpacity
                className="w-full bg-emerald-800 rounded-2xl py-4 items-center justify-center"
                onPress={() => router.push(`/(employee)/task/collect/${id}`)}
              >
                <Text className="text-white font-black text-sm">
                  I HAVE ARRIVED — START COLLECTION
                </Text>
              </TouchableOpacity>
            </>
          )}

          {isCollected && (
            <>
              {appointment.payment ? (
                <>
                  {/* Pay on Collection — Pending → Show Collect Payment button */}
                  {appointment.payment.paymentType === "pay_on_collection" &&
                    appointment.payment.paymentStatus === "pending" && (
                      <TouchableOpacity
                        className="w-full bg-orange-500 rounded-2xl py-4 items-center justify-center flex-row gap-2"
                        onPress={() => router.push(`/(employee)/task/payment/${appointment.payment!.orderId}`)}
                      >
                        <Ionicons name="card-outline" size={18} color="white" />
                        <Text className="text-white font-black text-sm">
                          Collect Payment ₹{appointment.payment.totalAmount}
                        </Text>
                      </TouchableOpacity>
                    )}

                  {/* Pay on Collection — Paid → Green info row */}
                  {appointment.payment.paymentType === "pay_on_collection" &&
                    appointment.payment.paymentStatus === "paid" && (
                      <View className="w-full bg-green-50 border border-green-200 rounded-2xl py-3 px-4 flex-row items-center gap-2">
                        <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                        <Text className="text-sm font-bold text-green-700">
                          Payment collected ₹{appointment.payment.totalAmount}
                        </Text>
                      </View>
                    )}

                  {/* Online Prepaid — Paid → Green info row */}
                  {appointment.payment.paymentType === "online_prepaid" &&
                    appointment.payment.paymentStatus === "paid" && (
                      <View className="w-full bg-green-50 border border-green-200 rounded-2xl py-3 px-4 flex-row items-center gap-2">
                        <Ionicons name="shield-checkmark" size={18} color="#16A34A" />
                        <Text className="text-sm font-bold text-green-700">
                          Patient paid online
                        </Text>
                      </View>
                    )}

                  {/* Online Prepaid — Pending (fallback) → Orange button */}
                  {appointment.payment.paymentType === "online_prepaid" &&
                    appointment.payment.paymentStatus === "pending" && (
                      <TouchableOpacity
                        className="w-full bg-orange-500 rounded-2xl py-4 items-center justify-center flex-row gap-2"
                        onPress={() => router.push(`/(employee)/task/payment/${appointment.payment!.orderId}`)}
                      >
                        <Ionicons name="card-outline" size={18} color="white" />
                        <Text className="text-white font-black text-sm">
                          Collect Payment ₹{appointment.payment.totalAmount}
                        </Text>
                      </TouchableOpacity>
                    )}
                </>
              ) : null}

              <View className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 items-center">
                <Ionicons name="checkmark-circle" size={48} color="#065F46" />
                <Text className="text-sm font-bold text-emerald-800 mt-2">
                  Sample Collected Successfully
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Cannot Complete — Reassign Request */}
        {canReassign && (
          <TouchableOpacity
            className="w-full bg-white border border-red-300 rounded-2xl py-3.5 items-center justify-center mb-8"
            onPress={() => setShowReassign(true)}
          >
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="warning-outline" size={14} color="#DC2626" />
              <Text className="text-red-600 font-bold text-xs">
                I Cannot Complete This Task
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>

      <ReassignModal
        visible={showReassign}
        onClose={() => setShowReassign(false)}
        appointmentId={id as string}
      />
    </Screen>
  );
}
