"use client";

import { redirect } from "next/navigation";

// Book test — redirect directly to tests page
export default function BookTestPage() {
  redirect("/tests");
}
