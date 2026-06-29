import { useEffect } from "react";
import type { ReactElement } from "react";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "@/lib/query-client";
import { useAuthStore } from "@/store/auth-store";

export function Providers({ children }: { children: ReactElement }) {
  const bootstrap = useAuthStore((state) => state.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return (
    <QueryClientProvider client={queryClient}>{children as never}</QueryClientProvider>
  );
}
