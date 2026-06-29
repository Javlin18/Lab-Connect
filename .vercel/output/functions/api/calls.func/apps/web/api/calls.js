"use client";
import { apiFetch } from "./client";
export function getCallLogs() {
    return apiFetch("/calls/logs");
}
//# sourceMappingURL=calls.js.map