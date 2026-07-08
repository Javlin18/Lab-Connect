import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { checkInAttendance, getTodayAttendance, getMyAttendance } from "@/api/attendance";
import { Screen } from "@/components/screen";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function todayIST(): string {
  const d = new Date();
  const ist = new Date(d.getTime() + 330 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
}

function currentMonthIST(): string {
  const d = new Date();
  const ist = new Date(d.getTime() + 330 * 60 * 1000);
  return ist.toISOString().slice(0, 7);
}

export default function AttendanceScreen() {
  const queryClient = useQueryClient();
  const cameraRef = useRef<CameraView>(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const selectedMonth = currentMonthIST();

  // Today's status
  const todayQuery = useQuery({
    queryKey: ["attendance-today"],
    queryFn: getTodayAttendance,
    refetchInterval: 30000,
  });
  const todayRecord = todayQuery.data?.data ?? null;
  const alreadyCheckedIn = todayRecord?.status === "present";

  // Monthly history
  const historyQuery = useQuery({
    queryKey: ["attendance-my", selectedMonth],
    queryFn: () => getMyAttendance(selectedMonth),
  });
  const history = historyQuery.data?.data ?? [];

  const presentCount = history.filter((r) => r.status === "present").length;
  const absentCount = history.filter((r) => r.status === "absent").length;
  const totalMarked = history.length;
  const attendancePct = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0;

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: (selfieUrl: string) => checkInAttendance(selfieUrl),
    onSuccess: () => {
      Alert.alert("✅ Checked In!", "Your attendance has been marked for today.");
      queryClient.invalidateQueries({ queryKey: ["attendance-today"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-my"] });
      setCapturedImage(null);
      setCameraOpen(false);
    },
    onError: (err: Error) => {
      Alert.alert("Check-in Failed", err.message);
    },
  });

  const openCamera = useCallback(async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert("Permission Required", "Camera permission is needed to take your attendance selfie.");
        return;
      }
    }
    setCapturedImage(null);
    setCameraOpen(true);
  }, [permission, requestPermission]);

  const capturePhoto = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.1,
        exif: false,
        imageType: "jpg",
      });
      if (photo?.base64) {
        const dataUrl = `data:image/jpeg;base64,${photo.base64}`;
        setCapturedImage(dataUrl);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to capture photo. Please try again.");
    }
  }, []);

  const submitCheckIn = useCallback(() => {
    if (!capturedImage) return;
    checkInMutation.mutate(capturedImage);
  }, [capturedImage, checkInMutation]);

  // Calendar data
  const todayStr = todayIST();
  const [calYear, calMonth] = selectedMonth.split("-").map(Number);
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth - 1, 1).getDay();
  const attendanceMap = new Map(history.map((r) => [r.date, r.status]));

  return (
    <Screen title="Attendance">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Today's Status Card */}
        <View
          className={`rounded-2xl p-5 mb-4 ${alreadyCheckedIn ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}
        >
          <View className="flex-row items-center gap-3">
            <View
              className={`h-14 w-14 rounded-2xl items-center justify-center ${alreadyCheckedIn ? "bg-emerald-100" : "bg-amber-100"}`}
            >
              {todayQuery.isLoading ? (
                <ActivityIndicator color="#64748b" />
              ) : (
                <Ionicons
                  name={alreadyCheckedIn ? "checkmark-circle" : "time-outline"}
                  size={30}
                  color={alreadyCheckedIn ? "#059669" : "#d97706"}
                />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-lg font-black" style={{ color: alreadyCheckedIn ? "#065f46" : "#92400e" }}>
                {alreadyCheckedIn ? "Checked In ✓" : "Not Checked In"}
              </Text>
              <Text className="text-xs mt-0.5" style={{ color: alreadyCheckedIn ? "#059669" : "#b45309" }}>
                {alreadyCheckedIn && todayRecord?.checkInAt
                  ? `Checked in at ${new Date(todayRecord.checkInAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
                  : "Take a selfie to mark your attendance"}
              </Text>
            </View>
          </View>

          {/* Selfie preview if checked in */}
          {alreadyCheckedIn && todayRecord?.selfieUrl && (
            <View className="flex-row items-center gap-3 mt-4 pt-4 border-t border-emerald-200/60">
              <Image
                source={{ uri: todayRecord.selfieUrl }}
                className="h-12 w-12 rounded-xl"
                resizeMode="cover"
              />
              <Text className="text-xs text-emerald-600">Your check-in photo</Text>
            </View>
          )}

          {/* Check-in button */}
          {!alreadyCheckedIn && (
            <TouchableOpacity
              onPress={openCamera}
              className="mt-4 bg-blue-600 rounded-2xl py-3.5 flex-row items-center justify-center gap-2"
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={20} color="white" />
              <Text className="text-white font-bold text-sm">Take Selfie & Check In</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Row */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-emerald-50 border border-emerald-200/60 p-3.5 rounded-2xl items-center">
            <Text className="text-xl font-black text-emerald-700">{presentCount}</Text>
            <Text className="text-[10px] font-bold text-emerald-500 mt-0.5">Present</Text>
          </View>
          <View className="flex-1 bg-rose-50 border border-rose-200/60 p-3.5 rounded-2xl items-center">
            <Text className="text-xl font-black text-rose-700">{absentCount}</Text>
            <Text className="text-[10px] font-bold text-rose-500 mt-0.5">Absent</Text>
          </View>
          <View className="flex-1 bg-blue-50 border border-blue-200/60 p-3.5 rounded-2xl items-center">
            <Text className="text-xl font-black text-blue-700">
              {totalMarked > 0 ? `${attendancePct}%` : "—"}
            </Text>
            <Text className="text-[10px] font-bold text-blue-500 mt-0.5">Rate</Text>
          </View>
        </View>

        {/* Calendar */}
        <View className="bg-white rounded-2xl border border-slate-200/60 p-4 mb-4">
          <View className="flex-row items-center gap-2 mb-3">
            <Ionicons name="calendar" size={16} color="#3b82f6" />
            <Text className="font-black text-slate-800 text-sm">Monthly Calendar</Text>
          </View>

          {/* Day labels */}
          <View className="flex-row mb-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <View key={`day-${i}`} className="flex-1 items-center py-1">
                <Text className="text-[10px] font-bold text-slate-400">{d}</Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          <View className="flex-row flex-wrap">
            {/* Empty cells */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <View key={`empty-${i}`} style={{ width: "14.28%", aspectRatio: 1 }} />
            ))}
            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${selectedMonth}-${String(dayNum).padStart(2, "0")}`;
              const status = attendanceMap.get(dateStr);
              const isToday = dateStr === todayStr;
              const isFuture = dateStr > todayStr;

              let bgColor = "#f1f5f9"; // slate-100
              let textColor = "#94a3b8"; // slate-400
              if (status === "present") { bgColor = "#10b981"; textColor = "#ffffff"; }
              else if (status === "absent") { bgColor = "#ef4444"; textColor = "#ffffff"; }
              if (isFuture) { bgColor = "#f8fafc"; textColor = "#cbd5e1"; }

              return (
                <View key={dateStr} style={{ width: "14.28%", aspectRatio: 1, padding: 2 }}>
                  <View
                    style={{
                      flex: 1,
                      borderRadius: 8,
                      backgroundColor: bgColor,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: isToday ? 2 : 0,
                      borderColor: isToday ? "#3b82f6" : "transparent",
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "700", color: textColor }}>
                      {dayNum}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Legend */}
          <View className="flex-row items-center justify-center gap-4 mt-3 pt-3 border-t border-slate-100">
            {[
              { color: "#10b981", label: "Present" },
              { color: "#ef4444", label: "Absent" },
              { color: "#f1f5f9", label: "N/A" },
            ].map((l) => (
              <View key={l.label} className="flex-row items-center gap-1.5">
                <View style={{ height: 10, width: 10, borderRadius: 4, backgroundColor: l.color }} />
                <Text className="text-[10px] text-slate-500">{l.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ── Camera Modal ────────────────────────────────────────────────── */}
      <Modal visible={cameraOpen} animationType="slide" presentationStyle="fullScreen">
        <View className="flex-1 bg-black">
          {capturedImage ? (
            /* Preview captured photo */
            <View className="flex-1">
              <Image source={{ uri: capturedImage }} className="flex-1" resizeMode="cover" />

              {/* Bottom bar */}
              <View className="absolute bottom-0 left-0 right-0 pb-10 pt-6 px-5 bg-black/70">
                <Text className="text-white text-center text-base font-bold mb-4">
                  Looking good? Submit to check in.
                </Text>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => setCapturedImage(null)}
                    className="flex-1 bg-white/20 rounded-2xl py-3.5 flex-row items-center justify-center gap-2"
                    activeOpacity={0.7}
                    disabled={checkInMutation.isPending}
                  >
                    <Ionicons name="refresh" size={18} color="white" />
                    <Text className="text-white font-bold text-sm">Retake</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={submitCheckIn}
                    className="flex-1 bg-emerald-600 rounded-2xl py-3.5 flex-row items-center justify-center gap-2"
                    activeOpacity={0.7}
                    disabled={checkInMutation.isPending}
                  >
                    {checkInMutation.isPending ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={18} color="white" />
                        <Text className="text-white font-bold text-sm">Submit</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            /* Live camera */
            <View className="flex-1">
              <CameraView
                ref={cameraRef}
                facing="front"
                style={{ flex: 1 }}
              />

              {/* Face guide overlay */}
              <View
                className="absolute items-center justify-center"
                style={{ top: 0, left: 0, right: 0, bottom: 0 }}
                pointerEvents="none"
              >
                <View
                  style={{
                    width: SCREEN_WIDTH * 0.55,
                    height: SCREEN_WIDTH * 0.7,
                    borderRadius: SCREEN_WIDTH * 0.275,
                    borderWidth: 2,
                    borderColor: "rgba(255,255,255,0.4)",
                    borderStyle: "dashed",
                  }}
                />
                <Text className="text-white/70 text-xs font-semibold mt-3">
                  Position your face in the frame
                </Text>
              </View>

              {/* Top bar — close button */}
              <View className="absolute top-14 left-5 right-5 flex-row items-center justify-between">
                <TouchableOpacity
                  onPress={() => setCameraOpen(false)}
                  className="bg-black/50 rounded-full h-10 w-10 items-center justify-center"
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
                <View className="bg-black/50 rounded-full px-3 py-1.5">
                  <Text className="text-white text-xs font-bold">Attendance Selfie</Text>
                </View>
              </View>

              {/* Bottom capture button */}
              <View className="absolute bottom-12 left-0 right-0 items-center">
                <TouchableOpacity
                  onPress={capturePhoto}
                  activeOpacity={0.7}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    borderWidth: 4,
                    borderColor: "white",
                    backgroundColor: "rgba(255,255,255,0.3)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "white" }} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </Screen>
  );
}
