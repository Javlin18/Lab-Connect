import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";

import { getAppointment } from "@/api/appointments";
import { useAuthStore } from "@/store/auth-store";
import { API_URL } from "@/lib/env";
import { Screen } from "@/components/screen";

export default function UploadReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  const [file, setFile] = useState<{
    name: string;
    uri: string;
    size: number;
  } | null>(null);
  const [fileError, setFileError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const query = useQuery({
    enabled: Boolean(id),
    queryKey: ["appointment", id],
    queryFn: () => getAppointment(id as string),
  });

  const appointment = query.data?.data;

  const pickFile = async () => {
    setFileError("");
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    if (!asset.name.toLowerCase().endsWith(".pdf") && asset.mimeType !== "application/pdf") {
      setFileError("Please select a PDF file only.");
      return;
    }
    setFile({ name: asset.name, uri: asset.uri, size: asset.size ?? 0 });
  };

  const uploadReport = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(20);
    try {
      const uploadResult = await FileSystem.uploadAsync(
        `${API_URL}/reports/${id}/upload`,
        file.uri,
        {
          httpMethod: "POST",
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: "file",
          mimeType: "application/pdf",
          headers: { Authorization: `Bearer ${token ?? ""}` },
        }
      );
      setProgress(100);
      const json = JSON.parse(uploadResult.body);
      if (uploadResult.status >= 400 || !json?.success) {
        throw new Error(json?.message ?? "Upload failed");
      }
      setDone(true);
    } catch (err: any) {
      Alert.alert("Upload failed", err.message ?? "Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (done) {
    return (
      <Screen title="">
        <View className="flex-1 items-center justify-center py-12">
          <View className="h-24 w-24 bg-emerald-100 rounded-full items-center justify-center border-4 border-emerald-300 mb-4">
            <Text className="text-5xl">✓</Text>
          </View>
          <Text className="text-xl font-black text-emerald-800 mt-2">Report Uploaded!</Text>
          <Text className="text-xs text-slate-400 mt-1 text-center">Patient has been notified</Text>
          <TouchableOpacity
            className="w-full bg-emerald-800 rounded-2xl py-4 items-center mt-8"
            onPress={() => router.replace("/(employee)")}
          >
            <Text className="text-white font-black text-sm">Back to Tasks</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen title="Upload Report">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {appointment && (
          <View className="bg-white border border-slate-100 rounded-2xl p-4 mb-4">
            <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
              Patient
            </Text>
            <Text className="text-base font-black text-slate-800">
              {appointment.patient?.name ?? "—"}
            </Text>
            <Text className="text-xs text-slate-500 mt-1">
              {appointment.testTypes.join(", ")}
            </Text>
            <View className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-1.5 self-start mt-3">
              <Text className="text-xs font-bold text-orange-700">Report upload required</Text>
            </View>
          </View>
        )}

        <View className="bg-white border border-slate-100 rounded-2xl p-5 mb-4">
          <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">
            Select PDF Report
          </Text>
          <TouchableOpacity
            className="flex-row items-center justify-center bg-emerald-50 border border-emerald-200 rounded-xl py-4 gap-2"
            onPress={pickFile}
            disabled={uploading}
          >
            <Text className="text-2xl">📄</Text>
            <Text className="text-emerald-800 font-bold text-sm">
              {file ? "Change File" : "Select PDF from Storage"}
            </Text>
          </TouchableOpacity>

          {fileError ? (
            <Text className="text-xs text-red-500 font-bold mt-2">{fileError}</Text>
          ) : null}

          {file && (
            <View className="mt-4 bg-slate-50 rounded-xl p-3 border border-slate-100 flex-row items-center gap-3">
              <Text className="text-xl">📄</Text>
              <View className="flex-1">
                <Text className="text-sm font-bold text-slate-800" numberOfLines={1}>
                  {file.name}
                </Text>
                <Text className="text-xs text-slate-400 mt-0.5">
                  {file.size > 0 ? `${(file.size / 1024).toFixed(1)} KB` : "PDF selected"}
                </Text>
              </View>
              <View className="h-6 w-6 bg-emerald-500 rounded-full items-center justify-center">
                <Text className="text-white text-xs font-bold">✓</Text>
              </View>
            </View>
          )}
        </View>

        {uploading && (
          <View className="bg-white border border-slate-100 rounded-2xl p-4 mb-4">
            <Text className="text-xs font-bold text-slate-600 mb-2">
              Uploading... {progress}%
            </Text>
            <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <View className="h-full bg-emerald-600 rounded-full" style={{ width: `${progress}%` }} />
            </View>
          </View>
        )}

        <TouchableOpacity
          className={`w-full rounded-2xl py-4 items-center justify-center mb-8 ${
            file && !uploading ? "bg-emerald-800 shadow-lg" : "bg-slate-200"
          }`}
          disabled={!file || uploading}
          onPress={uploadReport}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className={`font-black text-sm ${file ? "text-white" : "text-slate-400"}`}>
              Upload Report
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}
