import React from "react";
import { View } from "react-native";
import MapView, { Marker } from "react-native-maps";

interface MapPreviewProps {
  latitude: number;
  longitude: number;
  patientName: string;
}

export function MapPreview({ latitude, longitude, patientName }: MapPreviewProps) {
  return (
    <View className="h-40 w-full overflow-hidden rounded-2xl border border-slate-100 bg-slate-100">
      <MapView
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        }}
        scrollEnabled={false}
        style={{ height: "100%", width: "100%" }}
        zoomEnabled={false}
      >
        <Marker
          coordinate={{ latitude, longitude }}
          description="Patient location"
          title={patientName}
        />
      </MapView>
    </View>
  );
}
