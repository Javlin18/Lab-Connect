"use client";

import * as AuthSession from "expo-auth-session";
import * as Crypto from "expo-crypto";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { googleLogin, sendEmailOtp, verifyEmailOtp } from "@/api/auth";
import { useAuthStore } from "@/store/auth-store";

// Required for web browser redirect
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? "";

// ── Types ────────────────────────────────────────────────────────────────────
type Screen = "options" | "email-input" | "otp-input";

// ── Google OAuth discovery ───────────────────────────────────────────────────
const discovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
};

export default function PatientLoginScreen() {
  const setSession = useAuthStore((s) => s.setSession);

  const [screen, setScreen]       = useState<Screen>("options");
  const [email, setEmail]         = useState("");
  const [otp, setOtp]             = useState("");
  const [loading, setLoading]     = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]         = useState("");

  // ── Expo Auth Session (Google) ───────────────────────────────────────────
  // useProxy=true works in both Expo Go and standalone builds
  const redirectUri = AuthSession.makeRedirectUri({
    useProxy: true,
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      // Use Web Client ID with proxy — works in Expo Go
      clientId: GOOGLE_CLIENT_ID,
      redirectUri,
      scopes: ["openid", "profile", "email"],
      responseType: AuthSession.ResponseType.Token,
      usePKCE: false,
    },
    discovery
  );

  // Handle Google OAuth response
  useEffect(() => {
    if (response?.type !== "success") {
      if (response?.type === "error") {
        setError(response.error?.message ?? "Google sign-in failed");
      }
      return;
    }

    void (async () => {
      setGoogleLoading(true);
      setError("");
      try {
        // Fetch user profile from Google
        const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${response.params.access_token}` },
        });
        const userInfo = await userInfoRes.json() as { email: string; name?: string };

        // Exchange with our backend
        const res = await googleLogin({ email: userInfo.email, name: userInfo.name });
        await setSession(res.data.accessToken, res.data.user);
        router.replace("/(patient)");
      } catch (err: any) {
        setError(err?.message ?? "Google login failed");
      } finally {
        setGoogleLoading(false);
      }
    })();
  }, [response]);

  // ── Send Email OTP ───────────────────────────────────────────────────────
  async function handleSendOtp() {
    if (!email.trim() || !email.includes("@")) {
      setError("Enter a valid email address"); return;
    }
    setLoading(true);
    setError("");
    try {
      await sendEmailOtp(email.trim().toLowerCase());
      setScreen("otp-input");
    } catch (err: any) {
      setError(err?.message ?? "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  // ── Verify Email OTP & Login ─────────────────────────────────────────────
  async function handleVerifyOtp() {
    if (otp.length !== 6) {
      setError("Enter the 6-digit OTP"); return;
    }
    setLoading(true);
    setError("");
    try {
      // Step 1: verify OTP
      await verifyEmailOtp({ email: email.trim().toLowerCase(), otp });

      // Step 2: auto-login via google-login endpoint (same auto-register logic)
      const res = await googleLogin({ email: email.trim().toLowerCase() });
      await setSession(res.data.accessToken, res.data.user);
      router.replace("/(patient)");
    } catch (err: any) {
      setError(err?.message ?? "Invalid OTP");
    } finally {
      setLoading(false);
    }
  }

  // ── UI Helpers ───────────────────────────────────────────────────────────
  const isGoogleConfigured = GOOGLE_CLIENT_ID.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
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
              <Text className="text-2xl font-bold text-[#101828]">Welcome</Text>
              <Text className="text-sm text-[#9CA3AF] mt-1">Sign in to your account</Text>
            </View>

            {/* ── OPTIONS SCREEN ─────────────────────────────────────────── */}
            {screen === "options" && (
              <View className="gap-4">

                {/* Google Sign-In */}
                {isGoogleConfigured && (
                  <Pressable
                    onPress={() => {
                      setError("");
                      promptAsync();
                    }}
                    disabled={!request || googleLoading}
                    className="h-14 rounded-2xl border-2 border-[#E5E7EB] bg-white flex-row items-center justify-center gap-3 active:opacity-70"
                    style={{ opacity: (!request || googleLoading) ? 0.5 : 1 }}
                  >
                    {googleLoading
                      ? <ActivityIndicator color="#0F766E" />
                      : (
                        <>
                          {/* Google G icon */}
                          <Text style={{ fontSize: 20 }}>G</Text>
                          <Text className="text-[#374151] font-semibold text-base">
                            Continue with Google
                          </Text>
                        </>
                      )
                    }
                  </Pressable>
                )}

                {/* Divider */}
                <View className="flex-row items-center gap-3 my-1">
                  <View className="flex-1 h-px bg-[#F3F4F6]" />
                  <Text className="text-xs text-[#9CA3AF] font-semibold uppercase">or</Text>
                  <View className="flex-1 h-px bg-[#F3F4F6]" />
                </View>

                {/* Email OTP button */}
                <Pressable
                  onPress={() => { setError(""); setScreen("email-input"); }}
                  className="h-14 rounded-2xl bg-[#0F766E] flex-row items-center justify-center active:opacity-80"
                >
                  <Text className="text-white font-semibold text-base">
                    Continue with Email OTP
                  </Text>
                </Pressable>

                {/* Register link */}
                <Pressable
                  className="mt-4 items-center"
                  onPress={() => router.push("/(auth)/register")}
                >
                  <Text className="text-sm text-[#9CA3AF]">
                    New patient?{" "}
                    <Text className="text-[#0F766E] font-semibold">Register here</Text>
                  </Text>
                </Pressable>
              </View>
            )}

            {/* ── EMAIL INPUT SCREEN ─────────────────────────────────────── */}
            {screen === "email-input" && (
              <View className="gap-5">
                <View>
                  <Text className="text-sm font-semibold text-[#374151] mb-1.5">
                    Email Address
                  </Text>
                  <TextInput
                    className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl px-4 h-[52px] text-sm text-[#101828]"
                    value={email}
                    onChangeText={(t) => { setEmail(t); setError(""); }}
                    placeholder="you@example.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    returnKeyType="send"
                    onSubmitEditing={handleSendOtp}
                  />
                </View>

                <Pressable
                  onPress={handleSendOtp}
                  disabled={loading}
                  className="h-[52px] rounded-xl bg-[#0F766E] items-center justify-center active:opacity-80"
                  style={{ opacity: loading ? 0.6 : 1 }}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text className="text-white font-semibold text-base">Send OTP →</Text>
                  }
                </Pressable>

                {/* Back */}
                <Pressable onPress={() => { setScreen("options"); setError(""); }}>
                  <Text className="text-center text-sm text-[#9CA3AF]">← Back</Text>
                </Pressable>
              </View>
            )}

            {/* ── OTP INPUT SCREEN ───────────────────────────────────────── */}
            {screen === "otp-input" && (
              <View className="gap-5">
                {/* Info box */}
                <View className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-4 items-center">
                  <Text className="text-2xl mb-2">📬</Text>
                  <Text className="text-sm font-bold text-[#101828]">OTP sent to</Text>
                  <Text className="text-sm text-[#0F766E] font-semibold mt-0.5">{email}</Text>
                  <Text className="text-[11px] text-[#9CA3AF] mt-1">
                    Valid for 10 minutes · Check spam too
                  </Text>
                </View>

                {/* OTP input */}
                <View>
                  <Text className="text-sm font-semibold text-[#374151] mb-1.5">
                    Enter 6-digit OTP
                  </Text>
                  <TextInput
                    className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl h-[56px] text-center text-2xl font-black tracking-[8px] text-[#101828]"
                    value={otp}
                    onChangeText={(t) => { setOtp(t.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                    placeholder="——————"
                    placeholderTextColor="#D1D5DB"
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!loading}
                    returnKeyType="done"
                    onSubmitEditing={handleVerifyOtp}
                  />
                </View>

                <Pressable
                  onPress={handleVerifyOtp}
                  disabled={otp.length !== 6 || loading}
                  className="h-[52px] rounded-xl bg-[#0F766E] items-center justify-center active:opacity-80"
                  style={{ opacity: (otp.length !== 6 || loading) ? 0.5 : 1 }}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text className="text-white font-semibold text-base">Verify & Sign In</Text>
                  }
                </Pressable>

                {/* Resend + back */}
                <View className="flex-row justify-between items-center">
                  <Pressable onPress={() => { setScreen("email-input"); setOtp(""); setError(""); }}>
                    <Text className="text-sm text-[#9CA3AF]">← Change email</Text>
                  </Pressable>
                  <Pressable onPress={handleSendOtp} disabled={loading}>
                    <Text className="text-sm text-[#0F766E] font-semibold">Resend OTP</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Error banner */}
            {!!error && (
              <View className="bg-red-50 border border-red-200 rounded-xl p-3 flex-row items-center mt-4">
                <Text className="text-red-500 text-base mr-2">⚠️</Text>
                <Text className="flex-1 text-sm text-red-700 font-medium">{error}</Text>
                <Pressable onPress={() => setError("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text className="text-red-400 text-base font-bold">✕</Text>
                </Pressable>
              </View>
            )}

            <View className="flex-1" />
            <Text className="text-xs text-[#D1D5DB] text-center mt-10">
              LabConnect Medical v1.0.0
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
