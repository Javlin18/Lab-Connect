import React, { useRef, useState, useEffect } from "react";
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
import { router, Link } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Ionicons } from "@expo/vector-icons";

import { registerPatient, sendEmailOtp, verifyEmailOtp, login } from "@/api/auth";
import { useAuthStore } from "@/store/auth-store";

type RegisterStep = "form" | "otp";

export default function RegisterScreen() {
  const setSession = useAuthStore((s) => s.setSession);

  const [step, setStep] = useState<RegisterStep>("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const otpRef = useRef<TextInput>(null);

  // ── Validation ──────────────────────────────────────────────────────────
  function validateForm(): boolean {
    let valid = true;
    setNameError("");
    setPhoneError("");
    setEmailError("");
    setPasswordError("");
    setError("");

    if (!name.trim()) {
      setNameError("Full name is required");
      valid = false;
    }

    if (!phone.trim()) {
      setPhoneError("Phone number is required");
      valid = false;
    } else if (phone.trim().length < 10) {
      setPhoneError("Enter a valid 10-digit phone number");
      valid = false;
    }

    if (!email.trim()) {
      setEmailError("Email is required");
      valid = false;
    } else if (!email.includes("@")) {
      setEmailError("Enter a valid email address");
      valid = false;
    }

    if (!password) {
      setPasswordError("Password is required");
      valid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      valid = false;
    }

    return valid;
  }

  // ── Step 1: Send OTP ────────────────────────────────────────────────────
  async function handleSendOtp() {
    if (isLoading) return;
    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      const result = await sendEmailOtp(email.trim().toLowerCase());
      
      // Developer helper: Print the OTP to the frontend console (Expo logs)
      if ((result.data as any).devOtp) {
        console.log(`\n🔑 [DEV] OTP is: ${(result.data as any).devOtp}\n`);
      }

      setStep("otp");
      setCountdown(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP. Email may be invalid.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendOtp() {
    if (isLoading || countdown > 0) return;
    setIsLoading(true);
    setError("");

    try {
      const result = await sendEmailOtp(email.trim().toLowerCase());
      
      // Developer helper: Print the OTP to the frontend console (Expo logs)
      if ((result.data as any).devOtp) {
        console.log(`\n🔑 [DEV] OTP is: ${(result.data as any).devOtp}\n`);
      }

      setCountdown(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP.");
    } finally {
      setIsLoading(false);
    }
  }

  // ── Step 2: Verify & Register ───────────────────────────────────────────
  async function handleVerifyAndRegister() {
    if (isLoading) return;
    if (!otp.trim()) {
      setError("Please enter the OTP sent to your email.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // 1. Verify OTP
      await verifyEmailOtp({ email: email.trim().toLowerCase(), otp: otp.trim() });
      
      // 2. Complete Registration
      const credentials = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
      };
      await registerPatient(credentials);
      
      // 3. Auto-login
      const { data } = await login({ email: credentials.email, password: credentials.password });
      
      await completeLogin(data.accessToken, data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function completeLogin(accessToken: string, user: any) {
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
      role: user.role as "employee" | "patient" | "admin",
      createdAt: user.createdAt,
    });

    if (user.role === "admin") {
      router.replace("/(admin)");
    } else if (user.role === "employee") {
      router.replace("/(employee)");
    } else {
      router.replace("/(patient)");
    }
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
        <View className="flex-1 px-6 pt-12 pb-10">
          
          {/* ── Back Button ── */}
          <TouchableOpacity 
            onPress={() => {
              if (step === "otp") {
                setStep("form");
                setOtp("");
                setError("");
              } else {
                router.back();
              }
            }}
            className="w-10 h-10 items-center justify-center -ml-2 mb-2"
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>

          {/* ── Header ── */}
          <View className="mb-8">
            <Text className="text-3xl font-bold text-[#101828]">
              {step === "form" ? "Create Account" : "Verify Email"}
            </Text>
            <Text className="text-base text-[#6B7280] mt-2">
              {step === "form" 
                ? "Join LabConnect to manage your reports and bookings."
                : `We've sent a one-time password to ${email}. Please enter it below.`}
            </Text>
          </View>

          {step === "form" ? (
            /* ── Step 1: Form ── */
            <View className="gap-4">
              {/* Name field */}
              <View>
                <Text className="text-sm font-semibold text-[#374151] mb-1.5">Full Name</Text>
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
                    placeholder="Enter your full name"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() => phoneRef.current?.focus()}
                    editable={!isLoading}
                  />
                </View>
                {nameError ? <Text className="text-xs text-[#EF4444] mt-1 ml-1">{nameError}</Text> : null}
              </View>

              {/* Phone field */}
              <View>
                <Text className="text-sm font-semibold text-[#374151] mb-1.5">Phone Number</Text>
                <View
                  className={`bg-[#F8F9FA] border rounded-xl flex-row items-center px-4 h-[52px] ${
                    phoneError ? "border-[#EF4444]" : "border-[#E5E7EB]"
                  }`}
                >
                  <Ionicons name="call-outline" size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
                  <TextInput
                    ref={phoneRef}
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
                    onSubmitEditing={() => emailRef.current?.focus()}
                    editable={!isLoading}
                  />
                </View>
                {phoneError ? <Text className="text-xs text-[#EF4444] mt-1 ml-1">{phoneError}</Text> : null}
              </View>

              {/* Email field */}
              <View>
                <Text className="text-sm font-semibold text-[#374151] mb-1.5">Email Address</Text>
                <View
                  className={`bg-[#F8F9FA] border rounded-xl flex-row items-center px-4 h-[52px] ${
                    emailError ? "border-[#EF4444]" : "border-[#E5E7EB]"
                  }`}
                >
                  <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
                  <TextInput
                    ref={emailRef}
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
                    editable={!isLoading}
                  />
                </View>
                {emailError ? <Text className="text-xs text-[#EF4444] mt-1 ml-1">{emailError}</Text> : null}
              </View>

              {/* Password field */}
              <View>
                <Text className="text-sm font-semibold text-[#374151] mb-1.5">Password</Text>
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
                    placeholder="Create a password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleSendOtp}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
                {passwordError ? <Text className="text-xs text-[#EF4444] mt-1 ml-1">{passwordError}</Text> : null}
              </View>
            </View>
          ) : (
            /* ── Step 2: OTP ── */
            <View className="gap-4">
              <View>
                <Text className="text-sm font-semibold text-[#374151] mb-1.5">One-Time Password (OTP)</Text>
                <View className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl flex-row items-center px-4 h-[52px]">
                  <Ionicons name="keypad-outline" size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
                  <TextInput
                    ref={otpRef}
                    className="flex-1 text-lg tracking-widest text-[#101828]"
                    value={otp}
                    onChangeText={setOtp}
                    placeholder="• • • • • •"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={6}
                    returnKeyType="done"
                    onSubmitEditing={handleVerifyAndRegister}
                    editable={!isLoading}
                    autoFocus
                  />
                </View>
                <View className="flex-row justify-end mt-2">
                  <TouchableOpacity onPress={handleResendOtp} disabled={isLoading || countdown > 0} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text className={`text-sm font-semibold ${countdown > 0 ? "text-[#9CA3AF]" : "text-[#0F6E56]"}`}>
                      {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* ── Action button ── */}
          <TouchableOpacity
            onPress={step === "form" ? handleSendOtp : handleVerifyAndRegister}
            disabled={isLoading}
            className={`w-full rounded-xl items-center justify-center mt-8 h-[52px] ${
              isLoading ? "bg-[#0F6E56]/50" : "bg-[#0F6E56]"
            }`}
            accessibilityLabel={step === "form" ? "Send OTP button" : "Verify and Register button"}
            accessibilityRole="button"
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text className="text-white font-semibold text-base">
                {step === "form" ? "Create Account" : "Verify & Register"}
              </Text>
            )}
          </TouchableOpacity>

          {/* ── Error banner ── */}
          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-xl p-3 flex-row items-center mt-4">
              <Ionicons name="warning-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
              <Text className="flex-1 text-sm text-red-700 font-medium" numberOfLines={3}>
                {error}
              </Text>
              <TouchableOpacity onPress={() => setError("")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text className="text-red-400 text-base font-bold">✕</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View className="flex-1" />

          {/* ── Bottom Links ── */}
          {step === "form" && (
            <View className="items-center mt-6 mb-4">
              <View className="flex-row items-center">
                <Text className="text-sm text-[#6B7280]">Already have an account? </Text>
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text className="text-sm font-semibold text-[#0F6E56]">Sign In</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          )}

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
