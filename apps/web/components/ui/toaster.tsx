"use client";

import { useEffect } from "react";

import { useToastStore } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function Toaster() {
  const dismiss = useToastStore((state) => state.dismiss);
  const toasts = useToastStore((state) => state.toasts);

  useEffect(() => {
    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        dismiss(toast.id);
      }, 3000)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [dismiss, toasts]);

  return (
    <div className="fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "rounded-xl border bg-background p-4 shadow-lg",
            toast.variant === "destructive" && "border-destructive/40 bg-destructive/10"
          )}
        >
          <p className="font-medium">{toast.title}</p>
          {toast.description ? <p className="mt-1 text-sm text-muted-foreground">{toast.description}</p> : null}
        </div>
      ))}
    </div>
  );
}
