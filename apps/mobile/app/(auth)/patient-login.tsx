import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";

import { useAuthStore } from "@/store/auth-store";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:4000/api";

export default function PatientLoginScreen() {
  const setSession = useAuthStore((s) => s.setSession);

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const passwordRef = useRef<TextInput>(null);

  function validate(): boolean {
    let valid = true;
    setPhoneError("");
    setPasswordError("");
    setError("");

    if (!phone.trim()) {
      setPhoneError("Phone number is required");
      valid = false;
    } else if (phone.trim().length < 10) {
      setPhoneError("Enter a valid 10-digit phone number");
      valid = false;
    }

    if (!password) {
      setPasswordError("Password is required");
      valid = false;
    }

    return valid;
  }

  async function handleLogin() {
    if (!validate()) return;
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), password }),
      });

      const json = await response.json().catch(() => null);

      if (response.status === 401) {
        setError("Incorrect phone number or password");
        return;
      }
      if (response.status === 403) {
        setError("Your account has been deactivated. Contact admin.");
        return;
      }
      if (!response.ok || !json?.success) {
        setError(json?.message ?? "Something went wrong. Please try again.");
        return;
      }

      const { accessToken, user } = json.data as {
        accessToken: string;
        user: { id: string; name: string; email: string; phone: string; role: string; createdAt: string };
      };

      if (user.role !== "patient") {
        setError("Access denied. This login is for patients only.");
        return;
      }

      await Promise.all([
        SecureStore.setItemAsync("jwt_token", accessToken),
        SecureStore.setItemAsync("user_role", user.role),
        SecureStore.setItemAsync("user_id", user.id),
      ]);

      await setSession(accessToken, {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role as "patient",
        createdAt: user.createdAt,
      });

      router.replace("/(patient)");
    } catch {
      setError("No internet connection. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 pt-14 pb-10">

          {/* Header */}
          <View className="items-center mb-10">
            <View className="w-20 h-20 rounded-3xl bg-[#0F766E] items-center justify-center mb-4">
              <Text className="text-4xl">🏥</Text>
            </View>
            <Text className="text-xs font-bold text-[#0F766E] uppercase tracking-widest mb-3">
              Patient Portal
            </Text>
            <Text className="text-2xl font-bold text-[#101828]">Welcome Back</Text>
            <Text className="text-sm text-[#9CA3AF] mt-1">Sign in to your account</Text>
          </View>

          {/* Form */}
          <View className="gap-5">
            <View>
              <Text className="text-sm font-semibold text-[#374151] mb-1.5">Phone Number</Text>
              <View className={`bg-[#F8F9FA] border rounded-xl flex-row items-center px-4 h-[52px] ${phoneError ? "border-[#EF4444]" : "border-[#E5E7EB]"}`}>
                <Text className="text-base mr-3">📞</Text>
                <TextInput
                  className="flex-1 text-sm text-[#101828]"
                  value={phone}
                  onChangeText={(t) => { setPhone(t.replace(/[^\d+]/g, "").slice(0, 15)); setPhoneError(""); }}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  maxLength={15}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  accessibilityLabel="Phone number input"
                  editable={!isLoading}
                />
              </View>
              {phoneError ? <Text className="text-xs text-[#EF4444] mt-1 ml-1" accessibilityRole="alert">{phoneError}</Text> : null}
            </View>

            <View>
              <Text className="text-sm font-semibold text-[#374151] mb-1.5">Password</Text>
              <View className={`bg-[#F8F9FA] border rounded-xl flex-row items-center px-4 h-[52px] ${passwordError ? "border-[#EF4444]" : "border-[#E5E7EB]"}`}>
                <Text className="text-base mr-3">🔒</Text>
                <TextInput
                  ref={passwordRef}
                  className="flex-1 text-sm text-[#101828]"
                  value={password}
                  onChangeText={(t) => { setPassword(t); setPasswordError(""); }}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  accessibilityLabel="Password input"
                  editable={!isLoading}
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text className="text-base">{showPassword ? "🙈" : "👁️"}</Text>
                </TouchableOpacity>
              </View>
              {passwordError ? <Text className="text-xs text-[#EF4444] mt-1 ml-1" accessibilityRole="alert">{passwordError}</Text> : null}
              <TouchableOpacity className="self-end mt-2">
                <Text className="text-xs font-semibold text-[#0F766E]">Forgot Password?</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            className={`w-full rounded-xl items-center justify-center mt-8 h-[52px] ${isLoading ? "bg-[#0F766E]/50" : "bg-[#0F766E]"}`}
            accessibilityLabel="Login button"
            accessibilityRole="button"
          >
            {isLoading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text className="text-white font-semibold text-base">Login</Text>}
          </TouchableOpacity>

          {/* Error banner */}
          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-xl p-3 flex-row items-center mt-4" accessibilityRole="alert">
              <Text className="text-red-500 text-base mr-2">⚠️</Text>
              <Text className="flex-1 text-sm text-red-700 font-medium">{error}</Text>
              <TouchableOpacity onPress={() => setError("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text className="text-red-400 text-base font-bold">✕</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Register link */}
          <TouchableOpacity className="mt-6 items-center" onPress={() => router.push("/(auth)/register")}>
            <Text className="text-sm text-[#9CA3AF]">
              New patient?{" "}
              <Text className="text-[#0F766E] font-semibold">Register here</Text>
            </Text>
          </TouchableOpacity>

          <View className="flex-1" />
          <View className="items-center mt-10 gap-2">
            <Text className="text-sm text-[#9CA3AF] text-center">Having trouble? Contact your admin</Text>
            <Text className="text-xs text-[#D1D5DB]">v1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
