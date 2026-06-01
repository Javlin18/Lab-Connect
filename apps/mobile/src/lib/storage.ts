import * as SecureStore from "expo-secure-store";

import type { User } from "@lab-app/shared";

const TOKEN_KEY = "labconnect-token";
const USER_KEY = "labconnect-user";

export async function readSession() {
  const [token, userJson] = await Promise.all([
    SecureStore.getItemAsync(TOKEN_KEY),
    SecureStore.getItemAsync(USER_KEY)
  ]);

  return {
    token,
    user: userJson ? (JSON.parse(userJson) as User) : null
  };
}

export async function writeSession(token: string, user: User) {
  await Promise.all([
    SecureStore.setItemAsync(TOKEN_KEY, token),
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(user))
  ]);
}

export async function clearSession() {
  await Promise.all([SecureStore.deleteItemAsync(TOKEN_KEY), SecureStore.deleteItemAsync(USER_KEY)]);
}
