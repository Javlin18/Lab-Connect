"use client";
import { apiFetch } from "./client";
export async function registerPatient(data) {
    return apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
    });
}
export async function sendEmailOtp(email) {
    return apiFetch("/auth/send-email-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
    });
}
export async function verifyEmailOtp(email, otp) {
    return apiFetch("/auth/verify-email-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
    });
}
//# sourceMappingURL=auth.js.map