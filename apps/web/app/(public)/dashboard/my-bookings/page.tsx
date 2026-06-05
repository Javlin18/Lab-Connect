"use client";

import { CalendarClock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const bookings = [
  { id: "LC-2048", test: "Complete Blood Count", date: "04 Jun 2026", slot: "10:00 AM – 11:00 AM", status: "Confirmed" },
  { id: "LC-2047", test: "Thyroid Profile",      date: "03 Jun 2026", slot: "08:00 AM – 09:00 AM", status: "Assigned" },
  { id: "LC-2046", test: "Lipid Profile",        date: "01 Jun 2026", slot: "07:30 AM – 08:30 AM", status: "Sample Collected" },
];

const statusStyles: Record<string, string> = {
  Confirmed:        "border-blue-200 bg-blue-50 text-blue-700",
  Assigned:         "border-indigo-200 bg-indigo-50 text-indigo-700",
  "Sample Collected": "border-cyan-200 bg-cyan-50 text-cyan-700",
};

export default function MyBookingsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-red-600">My Bookings</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">All active and past test bookings</h1>
      </div>

      <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
        <CardHeader className="p-5 border-b border-slate-50">
          <CardTitle className="text-base">Booking History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-50">
            {bookings.map((b) => (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5" key={b.id}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-slate-900">{b.test}</p>
                    <Badge className={statusStyles[b.status]}>{b.status}</Badge>
                  </div>
                  <p className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
                    <CalendarClock className="h-3.5 w-3.5 text-red-500" />
                    {b.date} &bull; {b.slot}
                  </p>
                </div>
                <p className="text-xs font-bold text-slate-400">#{b.id}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
