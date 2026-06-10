declare const process: {
  env: Record<string, string | undefined>;
};

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://10.0.2.2:4000/api";

export const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

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
