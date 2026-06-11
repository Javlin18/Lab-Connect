/**
 * useServerCart — single source of truth cart hook for mobile.
 *
 * Reads from the server (GET /cart) so it stays in sync with the web app.
 * Writes (add/remove) go to the server immediately.
 *
 * The local Zustand cartStore is kept in sync so that isInCart / getItemCount
 * still work instantly in the UI without waiting for a refetch.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";

import { apiFetch } from "@/api/client";
import { useCartStore, type CartItem } from "@/store/cartStore";

// ── API helpers ──────────────────────────────────────────────────────────────

type ServerCart = {
  id: string;
  patientId: string;
  items: Array<{
    id: string;      // CartItem DB id — needed for DELETE
    testId: string | null;
    packageId: string | null;
    test?: { id: string; name: string; price: number; discountPrice?: number | null } | null;
    package?: { id: string; name: string; price: number; discountPrice?: number | null; tests?: { id: string }[] } | null;
  }>;
};

function fetchServerCart() {
  return apiFetch<ServerCart>("/cart");
}

function addToServer(data: { testId?: string; packageId?: string }) {
  return apiFetch<ServerCart>("/cart/add", { method: "POST", body: data });
}

function removeFromServer(cartItemId: string) {
  return apiFetch<ServerCart>(`/cart/${cartItemId}`, { method: "DELETE" });
}

// ── Adapter: ServerCart → CartItem[] ────────────────────────────────────────

function toCartItems(cart: ServerCart): CartItem[] {
  return cart.items.map((item) => {
    if (item.test) {
      const t = item.test;
      return {
        id: t.id,            // test/package id — used by isInCart
        cartItemId: item.id, // DB cart item id — used by DELETE
        type: "test" as const,
        name: t.name,
        price: t.discountPrice ?? t.price,
        originalPrice: t.price,
        testId: t.id,
      };
    }
    const p = item.package!;
    return {
      id: p.id,
      cartItemId: item.id,
      type: "package" as const,
      name: p.name,
      price: p.discountPrice ?? p.price,
      originalPrice: p.price,
      packageId: p.id,
      count: p.tests?.length ?? 0,
    };
  });
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useServerCart() {
  const qc = useQueryClient();
  const { addItem, removeItem, clearCart } = useCartStore();

  // 1. Fetch server cart
  const cartQuery = useQuery({
    queryKey: ["server-cart"],
    queryFn: fetchServerCart,
    select: (res) => ({
      ...res,
      items: toCartItems(res.data),
      raw: res.data,
    }),
    staleTime: 1000 * 30,
  });

  const serverItems = cartQuery.data?.items ?? [];

  // 2. Add item (server + local store mirror)
  const addMutation = useMutation({
    mutationFn: (data: { testId?: string; packageId?: string }) =>
      addToServer(data),
    onSuccess: (res) => {
      const items = toCartItems(res.data);
      // mirror into local store
      items.forEach((item) => addItem(item));
      qc.invalidateQueries({ queryKey: ["server-cart"] });
    },
    onError: () => Alert.alert("Error", "Could not add item. Please try again."),
  });

  // 3. Remove item (by DB cart item id)
  const removeMutation = useMutation({
    mutationFn: (cartItemId: string) => removeFromServer(cartItemId),
    onSuccess: (_res, cartItemId) => {
      // find matching store item id
      const storeItem = serverItems.find(
        (i) => (i as any).cartItemId === cartItemId
      );
      if (storeItem) removeItem(storeItem.id);
      qc.invalidateQueries({ queryKey: ["server-cart"] });
    },
    onError: () => Alert.alert("Error", "Could not remove item."),
  });

  // 4. Clear (server + local)
  const clearMutation = useMutation({
    mutationFn: async () => {
      // delete all items one by one
      for (const item of serverItems) {
        await removeFromServer((item as any).cartItemId);
      }
    },
    onSuccess: () => {
      clearCart();
      qc.invalidateQueries({ queryKey: ["server-cart"] });
    },
  });

  return {
    items: serverItems,
    isLoading: cartQuery.isLoading,
    isRefetching: cartQuery.isRefetching,
    refetch: cartQuery.refetch,
    addItem: (data: { testId?: string; packageId?: string }) =>
      addMutation.mutate(data),
    removeItem: (cartItemId: string) => removeMutation.mutate(cartItemId),
    clearCart: () => clearMutation.mutate(),
    isAddingItem: addMutation.isPending,
    isRemovingItem: removeMutation.isPending,
    isInCart: (id: string) => serverItems.some((i) => i.id === id),
    getItemCount: () => serverItems.length,
    getTotalPrice: () =>
      serverItems.reduce((sum, i) => sum + i.price, 0) + 100, // +100 collection
  };
}
