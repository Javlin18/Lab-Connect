"use client";

import { MapPin, Navigation, Phone } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TrackCollectionPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Track Collection</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Live sample collection status</h1>
      </div>

      <Card className="rounded-2xl border-slate-100 shadow-sm">
        <CardHeader className="p-5 border-b border-slate-50">
          <CardTitle className="text-base">Assigned Collection Executive</CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-red-100 flex items-center justify-center text-xl font-black text-red-600">
              RM
            </div>
            <div>
              <p className="font-bold text-slate-900">Rahul Mehra</p>
              <p className="text-sm text-slate-500">Collection Executive</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-red-600">
                <Phone className="h-3.5 w-3.5" /> +91 98765 43210
              </p>
            </div>
          </div>

          {/* Progress steps */}
          <div className="space-y-3">
            {[
              { label: "Booking Confirmed",   done: true  },
              { label: "Executive Assigned",   done: true  },
              { label: "On the Way",           done: true  },
              { label: "Sample Collected",     done: false },
              { label: "Processing at Lab",    done: false },
              { label: "Report Ready",         done: false },
            ].map((step, i) => (
              <div className="flex items-center gap-3" key={i}>
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  step.done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                }`}>
                  {step.done ? "✓" : i + 1}
                </div>
                <p className={`text-sm font-medium ${step.done ? "text-slate-900" : "text-slate-400"}`}>
                  {step.label}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-red-50 border border-red-100 p-4 flex items-center gap-3">
            <MapPin className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-slate-700 font-medium">Collector is 1.8 km away. ETA: 10 minutes.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-[10px] font-semibold uppercase text-slate-400">Estimated Arrival</p>
              <p className="mt-1 font-bold text-slate-900">10:30 AM</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-[10px] font-semibold uppercase text-slate-400">Status</p>
              <p className="mt-1 font-bold text-emerald-600">On the Way</p>
            </div>
          </div>

          <Link
            className={buttonVariants({ className: "w-full h-11 rounded-xl bg-red-600 text-white hover:bg-red-700" })}
            href="/dashboard/my-bookings"
          >
            <Navigation className="mr-2 h-4 w-4" /> View My Bookings
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
