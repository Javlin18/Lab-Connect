"use client";

import { MapPin, Navigation, Phone } from "lucide-react";

import { PatientDashboardShell } from "@/components/app/patient-dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TrackCollectionPage() {
  return (
    <PatientDashboardShell>
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Track Collection</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">Live sample collection status.</h2>
      </section>

      <Card className="rounded-xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="p-5">
          <CardTitle className="text-lg">Assigned Collection Executive</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 p-5 pt-0">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-100 text-xl font-bold text-blue-700">RM</div>
            <div>
              <p className="font-bold text-slate-950">Rahul Mehra</p>
              <p className="text-sm text-slate-500">Expected arrival: 10:30 AM</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-blue-700">
                <Phone className="h-4 w-4" /> +91 98765 43210
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <MapPin className="h-5 w-5 text-blue-600" />
              Collector is currently 1.8 km away.
            </p>
          </div>
          <Button className="h-11 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
            <Navigation className="mr-2 h-4 w-4" />
            Open Live Tracking
          </Button>
        </CardContent>
      </Card>
    </PatientDashboardShell>
  );
}
