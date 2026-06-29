"use client";
import { apiFetch } from "./client";
export async function listAppointments(filters = {}) {
    const params = new URLSearchParams();
    if (filters.date) {
        params.set("date", filters.date);
    }
    if (filters.status) {
        params.set("status", filters.status);
    }
    if (filters.employeeId) {
        params.set("employeeId", filters.employeeId);
    }
    const query = params.toString();
    return apiFetch(`/appointments${query ? `?${query}` : ""}`);
}
// Patient-specific: fetch only current user's bookings
export async function listMyAppointments() {
    return apiFetch("/appointments/mine");
}
export async function createAppointment(input) {
    return apiFetch("/appointments", {
        method: "POST",
        body: JSON.stringify(input)
    });
}
export async function assignAppointment(id, employeeId) {
    return apiFetch(`/appointments/${id}/assign`, {
        method: "PUT",
        body: JSON.stringify({ employeeId })
    });
}
export async function completeAppointment(id, notes) {
    return apiFetch(`/appointments/${id}/complete`, {
        method: "PUT",
        body: JSON.stringify({ notes })
    });
}
export async function getAppointmentById(id) {
    const response = await listAppointments();
    const appointment = response.data.find((item) => item.id === id);
    if (!appointment) {
        throw new Error("Appointment not found");
    }
    return {
        success: true,
        data: appointment,
        message: "Appointment fetched"
    };
}
//# sourceMappingURL=appointments.js.map