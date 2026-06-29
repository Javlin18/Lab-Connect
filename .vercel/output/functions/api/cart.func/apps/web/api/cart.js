import { apiFetch } from "./client";
export async function getCart() {
    return apiFetch("/cart");
}
export async function addToCart(data) {
    return apiFetch("/cart/add", {
        method: "POST",
        body: JSON.stringify(data)
    });
}
export async function removeFromCart(itemId) {
    return apiFetch(`/cart/${itemId}`, {
        method: "DELETE"
    });
}
//# sourceMappingURL=cart.js.map