import { apiFetch } from "./client";
import type { Package } from "@lab-app/shared";

export async function listPackages(admin = false) {
  return apiFetch<Package[]>(`/packages${admin ? "?admin=true" : ""}`);
}

export async function createPackage(data: {
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number;
  testIds: string[];
}) {
  return apiFetch<Package>("/packages", {
    method: "POST",
    body: JSON.stringify(data)
  });
}
