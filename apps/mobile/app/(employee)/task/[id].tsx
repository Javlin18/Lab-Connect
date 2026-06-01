import React, { useEffect, useState } from "react";
import { Alert, Clipboard, Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";

import { getAppointment } from "@/api/appointments";
import { acceptAppointment, updateStatus } from "@/api/employee";
import { Screen } from "@/components/screen";
import { StatusBadge } from "@/components/employee/StatusBadge";

export default function EmployeeTaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [region, setRegion] = useState({
    latitude: 23.2599,
    longitude: 77.4126,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015
  });

  const query = useQuery({
    enabled: Boolean(id),
    queryKey: ["appointment", id],
    queryFn: () => getAppointment(id as string)
  });

  const appointment = query.data?.data;

  // Geocode address
  useEffect(() => {
    if (appointment?.address) {
      void (async () => {
        const geocoded = await Location.geocodeAsync(appointment.address).catch(() => []);
        if (geocoded.length > 0) {
          setRegion((prev) => ({
            ...prev,
            latitude: geocoded[0].latitude,
            longitude: geocoded[0].longitude
          }));
        }
      })();
    }
  }, [appointment?.address]);

  // Mutations
  const acceptMutation = useMutation({
    mutationFn: () => acceptAppointment(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment", id] });
      queryClient.invalidateQueries({ queryKey: ["appointments", "assigned"] });
      toast("Task Accepted", "You have accepted this task.");
    },
    onError: (err: any) => {
      toast("Error", err.message);
    }
  });

  const enRouteMutation = useMutation({
    mutationFn: () => updateStatus(id as string, "en_route"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment", id] });
      queryClient.invalidateQueries({ queryKey: ["appointments", "assigned"] });
      router.push(`/(employee)/task/navigate/${id}`);
    }
  });

  const toast = (title: string, msg: string) => {
    Alert.alert(title, msg);
  };

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

  const handleCopyAddress = () => {
    Clipboard.setString(appointment.address);
    toast("Copied", "Address copied to clipboard!");
  };

  const handleCallPatient = () => {
    const phone = appointment.patient?.phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      toast("Unavailable", "No patient phone number found.");
    }
  };

  const isAssigned = appointment.status === "assigned";
  const isAccepted = appointment.status === "accepted";
  const isEnRoute = appointment.status === "en_route";
  const isCollected = appointment.status === "completed" || (appointment.status as string) === "collected";

  return (
    <Screen title={`Task #A-${id.slice(0, 8).toUpperCase()}`}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Large Status Badge Banner */}
        <View className="w-full bg-slate-100 border border-slate-200/50 rounded-2xl p-4 flex-row justify-between items-center mb-6">
          <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Current Booking Status
          </Text>
          <StatusBadge status={appointment.status} />
        </View>

        {/* Patient Info Card */}
        <View className="bg-white border border-slate-100 rounded-3xl p-5 mb-6 shadow-sm space-y-4">
          <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
            Patient Information
          </Text>
          <View>
            <Text className="text-base font-black text-slate-800">
              {appointment.patient?.name ?? "Patient"}
            </Text>
            <Text className="text-xs text-slate-500 mt-1">
              Age: 32 | Gender: Male
            </Text>
          </View>

          {/* Action Row */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-2.5 items-center flex-row justify-center gap-1.5"
              onPress={handleCallPatient}
            >
              <Text className="text-slate-600 font-bold text-xs">📞 Call Patient</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-2.5 items-center flex-row justify-center gap-1.5"
              onPress={handleCopyAddress}
            >
              <Text className="text-slate-600 font-bold text-xs">📋 Copy Address</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100/50">
            📍 {appointment.address}
          </Text>

          {/* Map Preview */}
          <View className="h-40 w-full overflow-hidden rounded-2xl border border-slate-100">
            <MapView
              initialRegion={region}
              region={region}
              scrollEnabled={false}
              style={{ height: "100%", width: "100%" }}
              zoomEnabled={false}
            >
              <Marker
                coordinate={{ latitude: region.latitude, longitude: region.longitude }}
                title={appointment.patient?.name ?? "Patient Location"}
              />
            </MapView>
          </View>
        </View>

        {/* Tests Required Card */}
        <View className="bg-white border border-slate-100 rounded-3xl p-5 mb-6 shadow-sm space-y-4">
          <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
            Tests Required
          </Text>
          <View className="space-y-2">
            {appointment.testTypes.map((test) => (
              <View className="flex-row items-center justify-between p-3.5 rounded-xl border bg-slate-50 border-slate-100" key={test}>
                <Text className="text-xs font-bold text-slate-700">✓ {test}</Text>
                <Text className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                  Blood
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Appointment details */}
        <View className="bg-white border border-slate-100 rounded-3xl p-5 mb-8 shadow-sm space-y-3">
          <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
            Visit Details
          </Text>
          <View className="text-xs text-slate-600 space-y-1.5 pt-1">
            <Text className="font-semibold text-slate-700">
              Slot: <Text className="font-normal text-slate-500">{appointment.slot}</Text>
            </Text>
            <Text className="font-semibold text-slate-700">
              Admin Notes: <Text className="font-normal text-slate-500">{appointment.notes || "No special instructions."}</Text>
            </Text>
          </View>
        </View>

        {/* Footer actions based on status */}
        <View className="mb-8">
          {isAssigned && (
            <TouchableOpacity
              className="w-full bg-blue-500 rounded-2xl py-4 items-center justify-center shadow-lg shadow-blue-200"
              onPress={() => acceptMutation.mutate()}
            >
              <Text className="text-white font-black text-sm">ACCEPT TASK</Text>
            </TouchableOpacity>
          )}

          {isAccepted && (
            <View className="space-y-3">
              <TouchableOpacity
                className="w-full bg-emerald-800 rounded-2xl py-4 items-center justify-center shadow-lg shadow-emerald-700/25"
                onPress={() => enRouteMutation.mutate()}
              >
                <Text className="text-white font-black text-sm">START NAVIGATION</Text>
              </TouchableOpacity>
            </View>
          )}

          {isEnRoute && (
            <View className="space-y-3">
              <Text className="text-center text-xs font-bold text-orange-600 animate-pulse">
                🚗 Currently navigating to patient home...
              </Text>
              <TouchableOpacity
                className="w-full bg-emerald-800 rounded-2xl py-4 items-center justify-center shadow-lg shadow-emerald-700/25"
                onPress={() => router.push(`/(employee)/task/collect/${id}`)}
              >
                <Text className="text-white font-black text-sm">I HAVE ARRIVED — START COLLECTION</Text>
              </TouchableOpacity>
            </View>
          )}

          {isCollected && (
            <View className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 items-center">
              <Text className="text-xl">🎉</Text>
              <Text className="text-sm font-bold text-emerald-800 mt-2">
                Sample Collected Successfully
              </Text>
              <Text className="text-xs text-slate-400 mt-1">
                Completed today at {new Date(appointment.updatedAt).toLocaleTimeString()}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
