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

import { useAuthStore } from "@/store/auth-store";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:4000/api";

const APP_VERSION = "1.0.0";

type LoginMethod = "phone" | "email";

export default function LoginScreen() {
  const setSession = useAuthStore((s) => s.setSession);

  const [method, setMethod] = useState<LoginMethod>("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const passwordRef = useRef<TextInput>(null);

  // ── Validation ──────────────────────────────────────────────────────────
  function validate(): boolean {
    let valid = true;
    setPhoneError("");
    setEmailError("");
    setPasswordError("");
    setError("");

    if (method === "phone") {
      if (!phone.trim()) {
        setPhoneError("Phone number is required");
        valid = false;
      } else if (phone.trim().length < 10) {
        setPhoneError("Enter a valid 10-digit phone number");
        valid = false;
      }
    } else {
      if (!email.trim()) {
        setEmailError("Email is required");
        valid = false;
      } else if (!email.includes("@")) {
        setEmailError("Enter a valid email address");
        valid = false;
      }
    }

    if (!password) {
      setPasswordError("Password is required");
      valid = false;
    }

    return valid;
  }

  // ── Login handler ───────────────────────────────────────────────────────
  async function handleLogin() {
    if (!validate()) return;

    setIsLoading(true);
    setError("");

    try {
      const body =
        method === "phone"
          ? { phone: phone.trim(), password }
          : { email: email.trim().toLowerCase(), password };

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await response.json().catch(() => null);

      if (response.status === 401) {
        setError(
          method === "phone"
            ? "Incorrect phone number or password"
            : "Incorrect email or password"
        );
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
        user: {
          id: string;
          name: string;
          email: string;
          phone: string;
          role: string;
          createdAt: string;
        };
      };

      // Persist to SecureStore
      await Promise.all([
        SecureStore.setItemAsync("jwt_token", accessToken),
        SecureStore.setItemAsync("user_role", user.role),
        SecureStore.setItemAsync("user_id", user.id),
      ]);

      // Update Zustand auth store
      await setSession(accessToken, {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role as "employee" | "patient" | "admin",
        createdAt: user.createdAt,
      });

      // Redirect based on role
      if (user.role === "admin") {
        router.replace("/(admin)");
      } else if (user.role === "employee") {
        router.replace("/(employee)");
      } else {
        router.replace("/(patient)");
      }
    } catch {
      setError("No internet connection. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function switchMethod(next: LoginMethod) {
    setMethod(next);
    setError("");
    setPhoneError("");
    setEmailError("");
    setPasswordError("");
  }

  // ── UI ──────────────────────────────────────────────────────────────────
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
            <View className="w-20 h-20 rounded-3xl bg-[#0F6E56] items-center justify-center mb-4 shadow-lg">
              <Ionicons name="flask" size={40} color="white" />
            </View>

            <Text className="text-2xl font-bold text-[#101828]">
              LabConnect
            </Text>
            <Text className="text-sm text-[#9CA3AF] mt-1">
              Sign in to your account
            </Text>
          </View>

          {/* ── Method toggle ── */}
          <View className="flex-row bg-[#F3F4F6] rounded-xl p-1 mb-6">
            <TouchableOpacity
              onPress={() => switchMethod("phone")}
              className={`flex-1 rounded-lg py-2.5 items-center ${
                method === "phone" ? "bg-white shadow-sm" : ""
              }`}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="call-outline" size={16} color={method === "phone" ? "#0F6E56" : "#9CA3AF"} />
                <Text
                  className={`text-sm font-semibold ${
                    method === "phone" ? "text-[#0F6E56]" : "text-[#9CA3AF]"
                  }`}
                >
                  Phone
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => switchMethod("email")}
              className={`flex-1 rounded-lg py-2.5 items-center ${
                method === "email" ? "bg-white shadow-sm" : ""
              }`}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="mail-outline" size={16} color={method === "email" ? "#0F6E56" : "#9CA3AF"} />
                <Text
                  className={`text-sm font-semibold ${
                    method === "email" ? "text-[#0F6E56]" : "text-[#9CA3AF]"
                  }`}
                >
                  Email
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Form ── */}
          <View className="gap-5">

            {/* Phone field */}
            {method === "phone" ? (
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
            ) : (
              <View>
                <Text className="text-sm font-semibold text-[#374151] mb-1.5">
                  Email Address
                </Text>
                <View
                  className={`bg-[#F8F9FA] border rounded-xl flex-row items-center px-4 h-[52px] ${
                    emailError ? "border-[#EF4444]" : "border-[#E5E7EB]"
                  }`}
                >
                  <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
                  <TextInput
                    className="flex-1 text-sm text-[#101828]"
                    value={email}
                    onChangeText={(t) => {
                      setEmail(t);
                      setEmailError("");
                    }}
                    placeholder="Enter your email"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    accessibilityLabel="Email input"
                    editable={!isLoading}
                  />
                </View>
                {emailError ? (
                  <Text
                    className="text-xs text-[#EF4444] mt-1 ml-1"
                    accessibilityRole="alert"
                  >
                    {emailError}
                  </Text>
                ) : null}
              </View>
            )}

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
              <Text className="flex-1 text-sm text-red-700 font-medium">{error}</Text>
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
