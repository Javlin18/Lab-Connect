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

import { registerEmployee } from "@/api/auth";
import { useAuthStore } from "@/store/auth-store";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:4000/api";

const APP_VERSION = "1.0.0";

export default function EmployeeLoginScreen() {
  const setSession = useAuthStore((s) => s.setSession);

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [zone, setZone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const passwordRef = useRef<TextInput>(null);

  // ── Validation ────────────────────────────────────────────────────────────
  function validate(): boolean {
    let valid = true;
    setNameError("");
    setEmailError("");
    setPhoneError("");
    setPasswordError("");
    setError("");
    setSuccess("");

    if (mode === "signup") {
      if (!name.trim()) {
        setNameError("Name is required");
        valid = false;
      }

      if (!email.trim()) {
        setEmailError("Email is required");
        valid = false;
      } else if (!email.includes("@")) {
        setEmailError("Enter a valid email");
        valid = false;
      }
    }

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
    } else if (mode === "signup" && password.length < 6) {
      setPasswordError("Minimum 6 chars");
      valid = false;
    }

    return valid;
  }

  // ── Login handler ─────────────────────────────────────────────────────────
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
    } catch {
      setError("No internet connection. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignup() {
    if (!validate()) return;

    setIsLoading(true);
    setError("");

    try {
      await registerEmployee({
        email: email.trim(),
        name: name.trim(),
        password,
        phone: phone.trim(),
        zone: zone.trim() || undefined,
      });

      setMode("login");
      setPassword("");
      setSuccess("Account created. Login now.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setIsLoading(false);
    }
  }

  function toggleMode(nextMode: "login" | "signup") {
    setMode(nextMode);
    setError("");
    setSuccess("");
    setNameError("");
    setEmailError("");
    setPhoneError("");
    setPasswordError("");
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
            <Text className="text-2xl font-bold text-[#101828]">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </Text>
            <Text className="text-sm text-[#9CA3AF] mt-1">
              {mode === "login" ? "Sign in to your account" : "Employee signup"}
            </Text>
          </View>

          {/* ── Form ── */}
          <View className="gap-5">

            {mode === "signup" ? (
              <>
                <View>
                  <Text className="text-sm font-semibold text-[#374151] mb-1.5">
                    Name
                  </Text>
                  <View
                    className={`bg-[#F8F9FA] border rounded-xl flex-row items-center px-4 h-[52px] ${
                      nameError ? "border-[#EF4444]" : "border-[#E5E7EB]"
                    }`}
                  >
                    <Ionicons name="person-outline" size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
                    <TextInput
                      className="flex-1 text-sm text-[#101828]"
                      value={name}
                      onChangeText={(t) => {
                        setName(t);
                        setNameError("");
                      }}
                      placeholder="Enter your name"
                      placeholderTextColor="#9CA3AF"
                      returnKeyType="next"
                      editable={!isLoading}
                    />
                  </View>
                  {nameError ? (
                    <Text className="text-xs text-[#EF4444] mt-1 ml-1">
                      {nameError}
                    </Text>
                  ) : null}
                </View>

                <View>
                  <Text className="text-sm font-semibold text-[#374151] mb-1.5">
                    Email
                  </Text>
                  <View
                    className={`bg-[#F8F9FA] border rounded-xl flex-row items-center px-4 h-[52px] ${
                      emailError ? "border-[#EF4444]" : "border-[#E5E7EB]"
                    }`}
                  >
                    <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
                    <TextInput
                      autoCapitalize="none"
                      className="flex-1 text-sm text-[#101828]"
                      keyboardType="email-address"
                      value={email}
                      onChangeText={(t) => {
                        setEmail(t);
                        setEmailError("");
                      }}
                      placeholder="Enter your email"
                      placeholderTextColor="#9CA3AF"
                      returnKeyType="next"
                      editable={!isLoading}
                    />
                  </View>
                  {emailError ? (
                    <Text className="text-xs text-[#EF4444] mt-1 ml-1">
                      {emailError}
                    </Text>
                  ) : null}
                </View>
              </>
            ) : null}

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
              {mode === "login" ? (
              <TouchableOpacity className="self-end mt-2">
                <Text className="text-xs font-semibold text-[#0F6E56]">
                  Forgot Password?
                </Text>
              </TouchableOpacity>
              ) : null}
            </View>

            {mode === "signup" ? (
              <View>
                <Text className="text-sm font-semibold text-[#374151] mb-1.5">
                  Zone
                </Text>
                <View className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl flex-row items-center px-4 h-[52px]">
                  <Ionicons name="location-outline" size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
                  <TextInput
                    className="flex-1 text-sm text-[#101828]"
                    value={zone}
                    onChangeText={setZone}
                    placeholder="Area or branch"
                    placeholderTextColor="#9CA3AF"
                    returnKeyType="done"
                    editable={!isLoading}
                  />
                </View>
              </View>
            ) : null}
          </View>

          {/* ── Login button ── */}
          <TouchableOpacity
            onPress={mode === "login" ? handleLogin : handleSignup}
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
                {mode === "login" ? "Login" : "Sign Up"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-5 items-center"
            disabled={isLoading}
            onPress={() => toggleMode(mode === "login" ? "signup" : "login")}
          >
            <Text className="text-sm font-semibold text-[#0F6E56]">
              {mode === "login" ? "Create employee account" : "Back to login"}
            </Text>
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

          {success ? (
            <View className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex-row items-center mt-4">
              <Ionicons name="checkmark-circle-outline" size={20} color="#059669" style={{ marginRight: 8 }} />
              <Text className="flex-1 text-sm text-emerald-700 font-medium">
                {success}
              </Text>
              <TouchableOpacity
                onPress={() => setSuccess("")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text className="text-emerald-500 text-base font-bold">✕</Text>
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
