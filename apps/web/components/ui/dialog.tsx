"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Dialog({
  children,
  open
}: {
  children: ReactNode;
  open: boolean;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      {children}
    </div>
  );
}

export function DialogContent({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("w-full max-w-2xl rounded-2xl border bg-background p-6 shadow-xl", className)}>{children}</div>;
}

export function DialogHeader({ children }: { children: ReactNode }) {
  return <div className="mb-4 space-y-1">{children}</div>;
}

export function DialogTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-lg font-semibold">{children}</h3>;
}
