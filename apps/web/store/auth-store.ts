"use client";

import { create } from "zustand";

type AuthUser = {
  email: string;
  id: string;
  name: string;
  phone?: string;
  role: "admin" | "employee" | "patient";
};

type AuthStore = {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string | null, user: AuthUser | null) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  user: null,
  setAuth: (token, user) => set({ token, user }),
  clearAuth: () => set({ token: null, user: null })
}));
