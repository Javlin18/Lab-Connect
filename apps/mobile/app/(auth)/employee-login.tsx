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
import { Ionicons } from "@expo/vector-icons";

import { login } from "@/api/auth";
import { useAuthStore } from "@/store/auth-store";

const APP_VERSION = "1.0.0";

export default function EmployeeLoginScreen() {
  const setSession = useAuthStore((s) => s.setSession);

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const passwordRef = useRef<TextInput>(null);

  // ── Validation ────────────────────────────────────────────────────────────
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

  // ── Login handler ─────────────────────────────────────────────────────────
  async function handleLogin() {
    if (isLoading) return;
    if (!validate()) return;

    setIsLoading(true);
    setError("");

    try {
      const { data } = await login({ phone: phone.trim(), password });
      const { accessToken, user } = data;

      if (user.role !== "employee") {
        setError("Access denied. This login is for employees only.");
        return;
      }

      // Persist to SecureStore (legacy keys for compatibility)
      await Promise.all([
        SecureStore.setItemAsync("jwt_token", accessToken),
        SecureStore.setItemAsync("user_role", user.role),
        SecureStore.setItemAsync("user_id", user.id),
      ]);

      // Also update the Zustand auth store so the rest of the app works
      await setSession(accessToken, {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role as "employee",
        createdAt: user.createdAt,
      });

      router.replace("/(employee)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Incorrect phone number or password");
    } finally {
      setIsLoading(false);
    }
  }



  // ── UI ────────────────────────────────────────────────────────────────────
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

          {/* ── Header ── */}
          <View className="items-center mb-10">
            {/* Logo */}
            <View className="w-20 h-20 rounded-3xl bg-[#0F6E56] items-center justify-center mb-4 shadow-lg">
              <Ionicons name="flask" size={40} color="white" />
            </View>

            <Text className="text-xs font-bold text-[#0F6E56] uppercase tracking-widest mb-3">
              Employee Portal
            </Text>
            <Text className="text-2xl font-bold text-[#101828] text-center">
              Welcome Back
            </Text>
            <Text className="text-sm text-[#9CA3AF] mt-1 text-center">
              Sign in to your account
            </Text>
          </View>

          {/* ── Form ── */}
          <View className="gap-5">



            {/* Phone field */}
            <View>
              <Text className="text-sm font-semibold text-[#374151] mb-1.5">
                Phone Number
              </Text>
              <View
                className={`bg-[#F8F9FA] border rounded-xl flex-row items-center px-4 h-[52px] ${
                  phoneError ? "border-[#EF4444]" : "border-[#E5E7EB]"
                }`}
              >
                <Ionicons name="call-outline" size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
                <TextInput
                  className="flex-1 text-sm text-[#101828]"
                  value={phone}
                  onChangeText={(t) => {
                    setPhone(t.replace(/[^\d+]/g, "").slice(0, 15));
                    setPhoneError("");
                  }}
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
              {phoneError ? (
                <Text
                  className="text-xs text-[#EF4444] mt-1 ml-1"
                  accessibilityRole="alert"
                >
                  {phoneError}
                </Text>
              ) : null}
            </View>

            {/* Password field */}
            <View>
              <Text className="text-sm font-semibold text-[#374151] mb-1.5">
                Password
              </Text>
              <View
                className={`bg-[#F8F9FA] border rounded-xl flex-row items-center px-4 h-[52px] ${
                  passwordError ? "border-[#EF4444]" : "border-[#E5E7EB]"
                }`}
              >
                <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
                <TextInput
                  ref={passwordRef}
                  className="flex-1 text-sm text-[#101828]"
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    setPasswordError("");
                  }}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  accessibilityLabel="Password input"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Text
                  className="text-xs text-[#EF4444] mt-1 ml-1"
                  accessibilityRole="alert"
                >
                  {passwordError}
                </Text>
              ) : null}

              {/* Forgot password */}
              <TouchableOpacity className="self-end mt-2">
                <Text className="text-xs font-semibold text-[#0F6E56]">
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>


          </View>

          {/* ── Login button ── */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            className={`w-full rounded-xl items-center justify-center mt-8 h-[52px] ${
              isLoading ? "bg-[#0F6E56]/50" : "bg-[#0F6E56]"
            }`}
            accessibilityLabel="Login button"
            accessibilityRole="button"
            accessibilityState={{ disabled: isLoading, busy: isLoading }}
            accessibilityHint={isLoading ? "Logging in" : "Tap to login"}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Login
              </Text>
            )}
          </TouchableOpacity>

          {/* ── Error banner ── */}
          {error ? (
            <View
              className="bg-red-50 border border-red-200 rounded-xl p-3 flex-row items-center mt-4"
              accessibilityRole="alert"
            >
              <Ionicons name="warning-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
              <Text className="flex-1 text-sm text-red-700 font-medium" numberOfLines={3}>
                {error}
              </Text>
              <TouchableOpacity
                onPress={() => setError("")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text className="text-red-400 text-base font-bold">✕</Text>
              </TouchableOpacity>
            </View>
          ) : null}



          {/* ── Spacer ── */}
          <View className="flex-1" />

          {/* ── Bottom ── */}
          <View className="items-center mt-10 gap-2">
            <Text className="text-sm text-[#9CA3AF] text-center">
              Having trouble? Contact your admin
            </Text>
            <Text className="text-xs text-[#D1D5DB]">v{APP_VERSION}</Text>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
