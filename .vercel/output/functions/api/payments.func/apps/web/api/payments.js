import { apiFetch } from "./client";
export async function createRazorpayOrder(data) {
    return apiFetch("/payments/create-order", {
        method: "POST",
        body: JSON.stringify(data)
    });
}
export async function verifyRazorpayPayment(data) {
    return apiFetch("/payments/verify-payment", {
        method: "POST",
        body: JSON.stringify(data)
    });
}
export async function createPaymentLink(data) {
    return apiFetch("/payments/create-payment-link", {
        method: "POST",
        body: JSON.stringify(data)
    });
}
export async function getPaymentLinkStatus(paymentLinkId) {
    return apiFetch(`/payments/payment-link-status/${paymentLinkId}`);
}
//# sourceMappingURL=payments.js.map