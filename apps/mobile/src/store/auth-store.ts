import { create } from "zustand";

import type { User } from "@lab-app/shared";

import { getUserFromToken } from "@/lib/jwt";
import { clearSession, readSession, writeSession } from "@/lib/storage";

type AuthStore = {
  hydrated: boolean;
  token: string | null;
  user: User | null;
  bootstrap: () => Promise<void>;
  logout: () => Promise<void>;
  setSession: (token: string, user: User) => Promise<void>;
};

export const useAuthStore = create<AuthStore>((set) => ({
  hydrated: false,
  token: null,
  user: null,
  bootstrap: async () => {
    const session = await readSession();

    set({
      hydrated: true,
      token: session.token,
      user: session.user ?? (session.token ? getUserFromToken(session.token) : null)
    });
  },
  logout: async () => {
    await clearSession();
    set({
      token: null,
      user: null
    });
  },
  setSession: async (token, user) => {
    await writeSession(token, user);
    set({
      hydrated: true,
      token,
      user
    });
  }
}));
