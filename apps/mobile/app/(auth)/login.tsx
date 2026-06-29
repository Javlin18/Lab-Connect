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
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";

import { login, googleLogin } from "@/api/auth";
import { useAuthStore } from "@/store/auth-store";

WebBrowser.maybeCompleteAuthSession();

const APP_VERSION = "1.0.0";

type LoginMethod = "phone" | "email";

export default function LoginScreen() {
  const setSession = useAuthStore((s) => s.setSession);

  const [method, setMethod] = useState<LoginMethod>("email");
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

  // ── Google Auth ─────────────────────────────────────────────────────────
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "";
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId,
    webClientId: clientId,
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      if (authentication?.accessToken) {
        handleGoogleSignIn(authentication.accessToken);
      }
    } else if (response?.type === "error") {
      setError("Google sign in failed. Please try again.");
    }
  }, [response]);

  async function handleGoogleSignIn(token: string) {
    setIsLoading(true);
    setError("");
    try {
      const userInfoResponse = await fetch("https://www.googleapis.com/userinfo/v2/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userInfo = await userInfoResponse.json();

      if (!userInfo.email) {
        throw new Error("Could not retrieve email from Google.");
      }

      const { data } = await googleLogin({ email: userInfo.email, name: userInfo.name });
      await completeLogin(data.accessToken, data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google login failed");
    } finally {
      setIsLoading(false);
    }
  }

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
    if (isLoading) return;
    if (!validate()) return;

    setIsLoading(true);
    setError("");

    try {
      const credentials =
        method === "phone"
          ? { phone: phone.trim(), password }
          : { email: email.trim().toLowerCase(), password };

      const { data } = await login(credentials);
      await completeLogin(data.accessToken, data.user);
    } catch (err) {
      const fallback =
        method === "phone"
          ? "Incorrect phone number or password"
          : "Incorrect email or password";
      setError(err instanceof Error ? err.message : fallback);
    } finally {
      setIsLoading(false);
    }
  }

  async function completeLogin(accessToken: string, user: any) {
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
          <View className="items-center mb-8">
            <View className="w-20 h-20 rounded-3xl bg-[#0F6E56] items-center justify-center mb-4 shadow-lg">
              <Ionicons name="flask" size={40} color="white" />
            </View>

            <Text className="text-2xl font-bold text-[#101828] text-center">
              Welcome
            </Text>
            <Text className="text-sm text-[#9CA3AF] mt-1 text-center">
              Sign in to LabConnect
            </Text>
          </View>

          {/* ── Method toggle ── */}
          <View className="flex-row bg-[#F3F4F6] rounded-xl p-1 mb-6">
            <TouchableOpacity
              onPress={() => switchMethod("email")}
              style={{
                flex: 1,
                borderRadius: 8,
                paddingVertical: 10,
                alignItems: "center",
                backgroundColor: method === "email" ? "white" : "transparent",
                shadowColor: method === "email" ? "#000" : "transparent",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: method === "email" ? 0.05 : 0,
                shadowRadius: 2,
                elevation: method === "email" ? 1 : 0,
              }}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="mail-outline" size={16} color={method === "email" ? "#0F6E56" : "#9CA3AF"} />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: method === "email" ? "#0F6E56" : "#9CA3AF",
                  }}
                >
                  Email
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => switchMethod("phone")}
              style={{
                flex: 1,
                borderRadius: 8,
                paddingVertical: 10,
                alignItems: "center",
                backgroundColor: method === "phone" ? "white" : "transparent",
                shadowColor: method === "phone" ? "#000" : "transparent",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: method === "phone" ? 0.05 : 0,
                shadowRadius: 2,
                elevation: method === "phone" ? 1 : 0,
              }}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="call-outline" size={16} color={method === "phone" ? "#0F6E56" : "#9CA3AF"} />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: method === "phone" ? "#0F6E56" : "#9CA3AF",
                  }}
                >
                  Phone
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Form ── */}
          <View className="gap-4">

            {/* Email field */}
            {method === "email" && (
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
                  <Text className="text-xs text-[#EF4444] mt-1 ml-1" accessibilityRole="alert">
                    {emailError}
                  </Text>
                ) : null}
              </View>
            )}

            {/* Phone field */}
            {method === "phone" && (
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
                  <Text className="text-xs text-[#EF4444] mt-1 ml-1" accessibilityRole="alert">
                    {phoneError}
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
                <Text className="text-xs text-[#EF4444] mt-1 ml-1" accessibilityRole="alert">
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
            className={`w-full rounded-xl items-center justify-center mt-6 h-[52px] ${
              isLoading ? "bg-[#0F6E56]/50" : "bg-[#0F6E56]"
            }`}
            accessibilityLabel="Login button"
            accessibilityRole="button"
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          {/* ── Google Login ── */}
          <View className="mt-6 flex-row items-center">
            <View className="flex-1 h-[1px] bg-gray-200" />
            <Text className="mx-4 text-sm text-gray-500 font-medium">OR</Text>
            <View className="flex-1 h-[1px] bg-gray-200" />
          </View>

          <TouchableOpacity
            onPress={() => promptAsync()}
            disabled={!request || isLoading}
            className="w-full flex-row items-center justify-center mt-6 h-[52px] border border-gray-200 rounded-xl bg-white"
          >
            <Ionicons name="logo-google" size={20} color="#DB4437" style={{ marginRight: 10 }} />
            <Text className="text-gray-700 font-semibold text-base">
              Continue with Google
            </Text>
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

          {/* ── Bottom Links ── */}
          <View className="items-center mt-8 gap-3">
            <View className="flex-row items-center">
              <Text className="text-sm text-[#6B7280]">Don't have an account? </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text className="text-sm font-semibold text-[#0F6E56]">Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>
            <Link href="/(auth)/employee-login" asChild>
              <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text className="text-sm font-semibold text-[#0F6E56] mt-2">Employee Portal</Text>
              </TouchableOpacity>
            </Link>
            <Text className="text-xs text-[#D1D5DB] mt-2">v{APP_VERSION}</Text>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
