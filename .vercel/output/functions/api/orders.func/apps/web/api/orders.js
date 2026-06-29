import { apiFetch } from "./client";
export async function createOrder(data) {
    return apiFetch("/orders", {
        method: "POST",
        body: JSON.stringify(data)
    });
}
export async function verifyPayment(data) {
    return apiFetch("/orders/verify-payment", {
        method: "POST",
        body: JSON.stringify(data)
    });
}
export async function listMyOrders() {
    return apiFetch("/orders/mine");
}
export async function listAllOrders() {
    return apiFetch("/orders");
}
//# sourceMappingURL=orders.js.map