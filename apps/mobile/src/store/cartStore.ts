import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type CartItem = {
  id: string;
  type: "test" | "package";
  name: string;
  price: number;
  originalPrice: number;
  testId?: string;
  packageId?: string;
  count?: number;
};

type CartStore = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getItemCount: () => number;
  isInCart: (id: string) => boolean;
};

const secureStorage = {
  getItem: (name: string) => SecureStore.getItemAsync(name),
  setItem: (name: string, value: string) => SecureStore.setItemAsync(name, value),
  removeItem: (name: string) => SecureStore.deleteItemAsync(name)
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) =>
          state.items.some((existing) => existing.id === item.id)
            ? state
            : { items: [...state.items, item] }
        ),
      removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
      clearCart: () => set({ items: [] }),
      getTotalPrice: () => get().items.reduce((sum, item) => sum + item.price, 100),
      getItemCount: () => get().items.length,
      isInCart: (id) => get().items.some((item) => item.id === id)
    }),
    {
      name: "labconnect-cart",
      storage: createJSONStorage(() => secureStorage)
    }
  )
);
