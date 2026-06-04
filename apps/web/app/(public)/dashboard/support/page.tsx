"use client";

import { Headphones, Mail, Phone } from "lucide-react";

import { PatientDashboardShell } from "@/components/app/patient-dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SupportPage() {
  return (
    <PatientDashboardShell>
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Support</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">Get help with bookings and sample collection.</h2>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-xl border-slate-200 bg-white shadow-sm">
          <CardHeader className="p-5">
            <Phone className="mb-3 h-6 w-6 text-blue-600" />
            <CardTitle className="text-base">Call Support</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 text-sm text-slate-500">+91 1800 200 4567</CardContent>
        </Card>
        <Card className="rounded-xl border-slate-200 bg-white shadow-sm">
          <CardHeader className="p-5">
            <Mail className="mb-3 h-6 w-6 text-blue-600" />
            <CardTitle className="text-base">Email Support</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 text-sm text-slate-500">care@labconnect.com</CardContent>
        </Card>
        <Card className="rounded-xl border-slate-200 bg-white shadow-sm">
          <CardHeader className="p-5">
            <Headphones className="mb-3 h-6 w-6 text-blue-600" />
            <CardTitle className="text-base">Help Desk</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <Button className="rounded-xl bg-blue-600 text-white hover:bg-blue-700">Create Ticket</Button>
          </CardContent>
        </Card>
      </section>
    </PatientDashboardShell>
  );
}
