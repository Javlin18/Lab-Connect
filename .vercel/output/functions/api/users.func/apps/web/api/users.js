"use client";
import { apiFetch } from "./client";
export async function listUsers(role) {
    const search = role ? `?role=${role}` : "";
    return apiFetch(`/users${search}`);
}
export async function createEmployee(input) {
    return apiFetch("/users/employee", {
        method: "POST",
        body: JSON.stringify(input)
    });
}
export async function updateUser(id, input) {
    return apiFetch(`/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(input)
    });
}
export async function deleteUser(id) {
    return apiFetch(`/users/${id}`, {
        method: "DELETE"
    });
}
//# sourceMappingURL=users.js.map