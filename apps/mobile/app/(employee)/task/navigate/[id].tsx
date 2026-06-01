import React, { useEffect, useState } from "react";
import { Alert, Linking, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import MapView, { Marker, Polyline } from "react-native-maps";

import { getAppointment } from "@/api/appointments";
import { updateLocation, updateStatus } from "@/api/employee";
import { Screen } from "@/components/screen";
import { Button } from "@/components/button";

export default function NavigationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [currentLoc, setCurrentLoc] = useState({
    latitude: 23.2599,
    longitude: 77.4126
  });
  const [patientLoc, setPatientLoc] = useState({
    latitude: 23.2680,
    longitude: 77.4200
  });

  const [permissionGranted, setPermissionGranted] = useState(false);
  const [etaText, setEtaText] = useState("12 mins");
  const [distanceText, setDistanceText] = useState("2.4 km");

  const query = useQuery({
    enabled: Boolean(id),
    queryKey: ["appointment", id],
    queryFn: () => getAppointment(id as string)
  });

  const appointment = query.data?.data;

  // Immediately call status en_route on mount
  useEffect(() => {
    if (id) {
      updateStatus(id as string, "en_route").catch(() => {});
    }
  }, [id]);

  // Request Location Permissions & Start Tracking
  useEffect(() => {
    void (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location access is required to navigate to the patient's home."
        );
        return;
      }
      setPermissionGranted(true);

      // Track location every 30s
      const timer = setInterval(async () => {
        try {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced
          });
          setCurrentLoc({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude
          });

          // Call API to sync location
          await updateLocation(loc.coords.latitude, loc.coords.longitude);
        } catch (e) {}
      }, 30000);

      return () => clearInterval(timer);
    })();
  }, []);

  // Geocode patient address
  useEffect(() => {
    if (appointment?.address) {
      void (async () => {
        const geocoded = await Location.geocodeAsync(appointment.address).catch(() => []);
        if (geocoded.length > 0) {
          setPatientLoc({
            latitude: geocoded[0].latitude,
            longitude: geocoded[0].longitude
          });
        }
      })();
    }
  }, [appointment?.address]);

  const handleOpenMaps = () => {
    if (appointment?.address) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        appointment.address
      )}`;
      Linking.openURL(url);
    }
  };

  const handleCallPatient = () => {
    const phone = appointment?.patient?.phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  if (!appointment) {
    return (
      <Screen title="Navigation">
        <View className="flex-1 items-center justify-center">
          <Text className="text-slate-400">Loading map...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Back Button */}
      <TouchableOpacity
        className="absolute top-12 left-4 z-50 h-10 w-10 bg-white/95 rounded-full items-center justify-center shadow-md border border-slate-100"
        onPress={() => router.back()}
      >
        <Text className="font-bold text-slate-800">←</Text>
      </TouchableOpacity>

      {/* Full Screen Map */}
      <View className="flex-grow">
        <MapView
          initialRegion={{
            latitude: (currentLoc.latitude + patientLoc.latitude) / 2,
            longitude: (currentLoc.longitude + patientLoc.longitude) / 2,
            latitudeDelta: Math.abs(currentLoc.latitude - patientLoc.latitude) * 2 || 0.03,
            longitudeDelta: Math.abs(currentLoc.longitude - patientLoc.longitude) * 2 || 0.03
          }}
          style={{ height: "100%", width: "100%" }}
        >
          {/* Employee Marker (Blue Dot) */}
          <Marker
            coordinate={currentLoc}
            pinColor="blue"
            title="My Location"
          />

          {/* Patient Marker (Red Pin) */}
          <Marker
            coordinate={patientLoc}
            title={appointment.patient?.name ?? "Patient"}
          />

          {/* Draw Route Polyline */}
          <Polyline
            strokeColor="#0F6E56"
            strokeWidth={4}
            coordinates={[currentLoc, patientLoc]}
          />
        </MapView>
      </View>

      {/* Bottom Sheet Details */}
      <View className="bg-white border-t border-slate-100 p-6 space-y-4 shadow-2xl h-[32%] justify-between">
        <View className="flex-row justify-between items-start">
          <View className="flex-1 pr-2">
            <Text className="text-base font-black text-slate-800">
              {appointment.patient?.name ?? "Patient"}
            </Text>
            <Text className="text-xs text-slate-400 mt-1 line-clamp-1 leading-relaxed">
              📍 {appointment.address}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-sm font-bold text-emerald-800">{distanceText}</Text>
            <Text className="text-[10px] text-slate-400 mt-0.5">ETA: {etaText}</Text>
          </View>
        </View>

        {/* Action Row */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            className="flex-1 bg-slate-50 border border-slate-100 rounded-xl py-3 items-center justify-center"
            onPress={handleOpenMaps}
          >
            <Text className="text-slate-600 font-bold text-xs">🗺 Open in G-Maps</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-slate-50 border border-slate-100 rounded-xl py-3 items-center justify-center"
            onPress={handleCallPatient}
          >
            <Text className="text-slate-600 font-bold text-xs">📞 Call Patient</Text>
          </TouchableOpacity>
        </View>

        {/* Arrived Button */}
        <TouchableOpacity
          className="w-full bg-emerald-800 rounded-2xl py-3.5 items-center justify-center shadow-lg shadow-emerald-700/20"
          onPress={() => router.push(`/(employee)/task/collect/${id}`)}
        >
          <Text className="text-white font-black text-sm">I Have Arrived</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
