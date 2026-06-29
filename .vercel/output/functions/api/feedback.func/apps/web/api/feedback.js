"use client";
import { apiFetch } from "./client";
export function getFeedbackAlerts() {
    return apiFetch("/feedback/alerts");
}
export function getFeedbackLeaderboard() {
    return apiFetch("/feedback/leaderboard");
}
export function getEmployeeFeedbackStats(employeeId) {
    return apiFetch(`/feedback/employee/${employeeId}`);
}
export function getAllFeedback(params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "")
            qs.set(k, String(v));
    });
    const query = qs.toString();
    return apiFetch(`/feedback/all${query ? `?${query}` : ""}`);
}
//# sourceMappingURL=feedback.js.map