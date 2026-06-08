"use client";

import { redirect } from "next/navigation";

// Patient dashboard page — redirect to homepage per new architecture.
// All patient features are accessible from the header sidebar menu.
export default function PatientDashboardPage() {
  redirect("/");
}
