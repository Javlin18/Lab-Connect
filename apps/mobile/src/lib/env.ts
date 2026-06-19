import { NativeModules, Platform } from "react-native";

declare const process: {
  env: Record<string, string | undefined>;
};

type SourceCodeModule = {
  scriptURL?: string;
  getConstants?: () => { scriptURL?: string };
};

type ExpoConstantsModule = {
  manifest?: { debuggerHost?: string; hostUri?: string };
  manifest2?: {
    extra?: {
      expoClient?: { hostUri?: string };
      expoGo?: { debuggerHost?: string };
    };
  };
  getConstants?: () => ExpoConstantsModule;
};

function hostFromUrl(value?: string) {
  return /^(?:https?|exp):\/\/([^/:]+)/i.exec(value ?? "")?.[1];
}

function hostFromHostPort(value?: string) {
  return /^([^/:]+)(?::\d+)?$/i.exec(value ?? "")?.[1];
}

function resolvePackagerHost() {
  const sourceCode = NativeModules.SourceCode as SourceCodeModule | undefined;
  const expoConstants = NativeModules.ExponentConstants as
    | ExpoConstantsModule
    | undefined;
  const constants = expoConstants?.getConstants?.() ?? expoConstants;

  const candidates = [
    sourceCode?.scriptURL,
    sourceCode?.getConstants?.().scriptURL,
    constants?.manifest?.debuggerHost,
    constants?.manifest?.hostUri,
    constants?.manifest2?.extra?.expoClient?.hostUri,
    constants?.manifest2?.extra?.expoGo?.debuggerHost
  ];

  for (const candidate of candidates) {
    const host = hostFromUrl(candidate) ?? hostFromHostPort(candidate);
    if (host) return host;
  }
}

function resolveDevApiUrl() {
  const host = resolvePackagerHost();
  const isLoopback = host === "localhost" || host === "127.0.0.1";

  if (host && !isLoopback) {
    return `http://${host}:4000/api`;
  }

  return Platform.OS === "android"
    ? "http://10.0.2.2:4000/api"
    : "http://localhost:4000/api";
}

function normalizeApiUrl(url: string) {
  const trimmed = url.trim().replace(/\/+$/, "");
  return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
}

export const API_URL = normalizeApiUrl(
  process.env.EXPO_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  resolveDevApiUrl()
);

export const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

export function getNetworkErrorMessage() {
  return `Cannot reach LabConnect server at ${API_ORIGIN}. Make sure the API is running and your phone is on the same Wi-Fi.`;
}

export const UPI_VPA =
  process.env.EXPO_PUBLIC_UPI_VPA ?? "labconnect@upi";

export const RAZORPAY_KEY_ID =
  process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ?? "";

export function resolveAssetUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

export const PUSH_TOKEN_PATH =
  process.env.EXPO_PUBLIC_PUSH_TOKEN_PATH ?? "/notifications/device-token";
