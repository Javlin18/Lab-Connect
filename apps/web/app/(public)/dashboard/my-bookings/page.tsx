"use client";

import { CalendarClock } from "lucide-react";

import { PatientDashboardShell } from "@/components/app/patient-dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const bookings = [
  { id: "LC-2048", test: "Complete Blood Count", date: "04 Jun 2026", slot: "10:00 AM - 11:00 AM", status: "Confirmed" },
  { id: "LC-2047", test: "Thyroid Profile", date: "03 Jun 2026", slot: "08:00 AM - 09:00 AM", status: "Assigned" },
  { id: "LC-2046", test: "Lipid Profile", date: "01 Jun 2026", slot: "07:30 AM - 08:30 AM", status: "Sample Collected" }
];

const statusStyles: Record<string, string> = {
  Confirmed: "border-blue-200 bg-blue-50 text-blue-700",
  Assigned: "border-indigo-200 bg-indigo-50 text-indigo-700",
  "Sample Collected": "border-cyan-200 bg-cyan-50 text-cyan-700"
};

export default function MyBookingsPage() {
  return (
    <PatientDashboardShell>
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">My Bookings</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">All active and past test bookings.</h2>
      </section>

      <Card className="overflow-hidden rounded-xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="p-5">
          <CardTitle className="text-lg">Booking History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {bookings.map((booking) => (
              <div className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center" key={booking.id}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-slate-950">{booking.test}</p>
                    <Badge className={statusStyles[booking.status]}>{booking.status}</Badge>
                  </div>
                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                    <CalendarClock className="h-4 w-4 text-blue-600" />
                    {booking.date} &bull; {booking.slot}
                  </p>
                </div>
                <p className="text-sm font-bold text-slate-500">#{booking.id}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PatientDashboardShell>
  );
}
