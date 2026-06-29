import { apiFetch } from "./client";
export async function listPackages(admin = false) {
    return apiFetch(`/packages${admin ? "?admin=true" : ""}`);
}
export async function createPackage(data) {
    return apiFetch("/packages", {
        method: "POST",
        body: JSON.stringify(data)
    });
}
//# sourceMappingURL=packages.js.map