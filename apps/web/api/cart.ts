import { apiFetch } from "./client";
import type { Cart } from "@lab-app/shared";

export async function getCart() {
  return apiFetch<Cart>("/cart");
}

export async function addToCart(data: { testId?: string; packageId?: string }) {
  return apiFetch<Cart>("/cart/add", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function removeFromCart(itemId: string) {
  return apiFetch<Cart>(`/cart/${itemId}`, {
    method: "DELETE"
  });
}
