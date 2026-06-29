"use client";
import { apiFetch } from "./client";
export function listOtpAssistanceRequests() {
    return apiFetch("/otp-assistance");
}
export function viewOtpAssistanceOtp(id) {
    return apiFetch(`/otp-assistance/${id}/otp`);
}
export function resendOtpAssistanceOtp(id, reason) {
    return apiFetch(`/otp-assistance/${id}/resend-otp`, {
        method: "PUT",
        body: JSON.stringify({ reason }),
    });
}
export function shareOtpAssistanceOtp(id, reason) {
    return apiFetch(`/otp-assistance/${id}/share-otp`, {
        method: "PUT",
        body: JSON.stringify({ reason }),
    });
}
export function approveOtpAssistance(id, reason) {
    return apiFetch(`/otp-assistance/${id}/approve`, {
        method: "PUT",
        body: JSON.stringify({ reason }),
    });
}
export function forceVerifyOtpAssistance(id, reason) {
    return apiFetch(`/otp-assistance/${id}/force-verify`, {
        method: "PUT",
        body: JSON.stringify({ reason }),
    });
}
export function rejectOtpAssistance(id, reason) {
    return apiFetch(`/otp-assistance/${id}/reject`, {
        method: "PUT",
        body: JSON.stringify({ reason }),
    });
}
//# sourceMappingURL=otp-assistance.js.map