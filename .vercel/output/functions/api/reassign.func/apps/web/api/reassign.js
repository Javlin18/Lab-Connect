"use client";
import { apiFetch } from "./client";
export function getReassignRequests(status) {
    return apiFetch(`/appointments/reassign-requests${status ? `?status=${status}` : ""}`);
}
export function resolveReassign(requestId, newEmployeeId) {
    return apiFetch(`/appointments/reassign-requests/${requestId}/resolve`, {
        method: "PUT",
        body: JSON.stringify({ newEmployeeId }),
    });
}
//# sourceMappingURL=reassign.js.map