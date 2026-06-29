"use client";
import { apiFetch } from "./client";
export async function listEmployees() {
    return apiFetch("/employees");
}
export async function updateEmployeeLocation(id, input) {
    return apiFetch(`/employees/${id}/location`, {
        method: "PUT",
        body: JSON.stringify(input)
    });
}
export function countEmployeeTasksForDate(appointments, employeeUserId, day) {
    return appointments.filter((item) => item.employeeId === employeeUserId && item.slot.startsWith(day)).length;
}
//# sourceMappingURL=employees.js.map