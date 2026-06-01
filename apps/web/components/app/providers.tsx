"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider, useSession } from "next-auth/react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { Toaster } from "@/components/ui/toaster";
import { createQueryClient } from "@/lib/query-client";
import { useAuthStore } from "@/store/auth-store";

function AuthSync() {
  const { data: session } = useSession();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    if (!session?.user) {
      clearAuth();
      return;
    }

    setAuth(session.accessToken ?? null, {
      email: session.user.email ?? "",
      id: session.user.id,
      name: session.user.name ?? "",
      phone: session.user.phone,
      role: session.user.role
    });
  }, [clearAuth, session, setAuth]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <AuthSync />
        {children}
        <Toaster />
      </QueryClientProvider>
    </SessionProvider>
  );
}
