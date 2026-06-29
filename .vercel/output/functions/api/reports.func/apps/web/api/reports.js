"use client";
import { apiFetch } from "./client";
export async function uploadReport(appointmentId, file) {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetch(`/reports/${appointmentId}/upload`, {
        method: "POST",
        body: formData
    });
}
export async function getReport(appointmentId) {
    return apiFetch(`/reports/${appointmentId}`);
}
//# sourceMappingURL=reports.js.map