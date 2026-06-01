declare const process: {
  env: Record<string, string | undefined>;
};

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://10.0.2.2:4000/api";

export const PUSH_TOKEN_PATH =
  process.env.EXPO_PUBLIC_PUSH_TOKEN_PATH ?? "/notifications/device-token";
