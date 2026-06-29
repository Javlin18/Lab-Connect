import { apiFetch } from "./client";
export async function listTests(admin = false) {
    return apiFetch(`/tests${admin ? "?admin=true" : ""}`);
}
export async function getTestBySlug(slug) {
    return apiFetch(`/tests/${slug}`);
}
export async function createTest(data) {
    return apiFetch("/tests", {
        method: "POST",
        body: JSON.stringify(data)
    });
}
export async function updateTest(id, data) {
    return apiFetch(`/tests/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
    });
}
export async function deleteTest(id) {
    return apiFetch(`/tests/${id}`, {
        method: "DELETE"
    });
}
//# sourceMappingURL=tests.js.map