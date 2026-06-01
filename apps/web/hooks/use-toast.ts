"use client";

import { create } from "zustand";

type Toast = {
  description?: string;
  id: string;
  title: string;
  variant?: "default" | "destructive";
};

type ToastStore = {
  dismiss: (id: string) => void;
  toast: (toast: Omit<Toast, "id">) => void;
  toasts: Toast[];
};

export const useToastStore = create<ToastStore>((set) => ({
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
  toast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }]
    })),
  toasts: []
}));

export function useToast() {
  return {
    toast: useToastStore((state) => state.toast)
  };
}
