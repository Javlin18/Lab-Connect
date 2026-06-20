"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Circle,
  ClipboardList,
  FileText,
  MapPin,
  Navigation,
  Phone
} from "lucide-react";
import { useState } from "react";

import { listMyAppointments } from "@/api/appointments";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Appointment } from "@lab-app/shared";

const TIMELINE_STEPS: { status: Appointment["status"]; label: string; desc: string }[] = [
  { status: "pending",    label: "Booking Confirmed",       desc: "Your booking has been received" },
  { status: "assigned",   label: "Collector Assigned",      desc: "A phlebotomist has been assigned" },
  { status: "accepted",   label: "Collector Confirmed",     desc: "Collector confirmed the booking" },
  { status: "en_route",   label: "On the Way",              desc: "Collector is heading to your location" },
  { status: "collected",  label: "Sample Collected",        desc: "Blood sample collected successfully" },
  { status: "processing", label: "Processing at Lab",       desc: "Sample being analyzed in laboratory" },
  { status: "completed",  label: "Report Ready",            desc: "Your report is ready for download" },
];

const statusOrder = TIMELINE_STEPS.map((s) => s.status);

function getStepIndex(status: Appointment["status"]) {
  return statusOrder.indexOf(status);
}

function TimelineCard({ appointment }: { appointment: Appointment }) {
  const currentIdx = getStepIndex(appointment.status);

  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="bg-gradient-to-r from-red-600 to-red-500 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-red-200 uppercase tracking-wider">Booking ID</p>
            <p className="font-mono text-white text-sm font-bold mt-0.5">{appointment.id.slice(0, 12)}…</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-red-200 uppercase tracking-wider">Slot</p>
            <p className="text-white text-xs font-semibold mt-0.5">{appointment.slot?.split(" ")[0]}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {appointment.testTypes.map((t) => (
            <span className="text-[10px] font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full" key={t}>{t}</span>
          ))}
        </div>
      </div>

      <CardContent className="p-5">
        {/* Collector info (when assigned) */}
        {appointment.employee && currentIdx >= 1 && (
          <div className="flex items-center gap-3 mb-5 bg-slate-50 rounded-xl px-4 py-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
              {appointment.employee.name?.charAt(0).toUpperCase() ?? "C"}
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-800 text-sm">{appointment.employee.name ?? "Collector"}</p>
              <p className="text-xs text-slate-500">Assigned Phlebotomist</p>
            </div>
            {appointment.employee.phone && (
              <a
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition"
                href={`tel:${appointment.employee.phone}`}
              >
                <Phone className="h-3.5 w-3.5" /> Call
              </a>
            )}
          </div>
        )}

        {/* Address */}
        <div className="flex items-start gap-2 mb-5 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5 text-red-400 flex-shrink-0 mt-0.5" />
          <span>{appointment.address}</span>
        </div>

        {/* Timeline */}
        <div className="space-y-0">
          {TIMELINE_STEPS.map((step, idx) => {
            const done    = idx < currentIdx;
            const current = idx === currentIdx;
            const future  = idx > currentIdx;

            return (
              <div className="flex gap-4" key={step.status}>
                {/* Line + dot */}
                <div className="flex flex-col items-center">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 transition-all ${
                    done    ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200" :
                    current ? "bg-red-600 text-white shadow-md shadow-red-200 ring-4 ring-red-100" :
                    "bg-slate-100 text-slate-300"
                  }`}>
                    {done ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Circle className={`h-4 w-4 ${current ? "fill-white" : ""}`} />
                    )}
                  </div>
                  {idx < TIMELINE_STEPS.length - 1 && (
                    <div className={`w-0.5 flex-1 min-h-[24px] my-1 ${done ? "bg-emerald-300" : "bg-slate-100"}`} />
                  )}
                </div>

                {/* Text */}
                <div className={`pb-5 flex-1 ${future ? "opacity-40" : ""}`}>
                  <p className={`text-sm font-bold leading-none ${
                    current ? "text-red-600" : done ? "text-emerald-700" : "text-slate-400"
                  }`}>
                    {step.label}
                    {current && (
                      <span className="ml-2 text-[9px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        Current
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Maps link */}
        <a
          className="mt-4 flex items-center justify-center gap-2 w-full h-10 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
          href={`https://maps.google.com/?q=${encodeURIComponent(appointment.address)}`}
          rel="noreferrer"
          target="_blank"
        >
          <Navigation className="h-4 w-4 text-red-500" />
          Open in Maps
        </a>
      </CardContent>
    </Card>
  );
}

export default function TrackCollectionPage() {
  const appointmentsQ = useQuery({
    queryKey: ["appointments", "mine"],
    queryFn:  listMyAppointments,
  });

  const appointments = appointmentsQ.data?.data ?? [];
  const active = appointments.filter((a) => a.status !== "completed").slice(0, 3);
  const completed = appointments.filter((a) => a.status === "completed");

  const [showCompleted, setShowCompleted] = useState(false);

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Track Collection</h1>
        <p className="text-sm text-slate-500 mt-1">Live status of your home sample collection bookings</p>
      </div>

      {appointmentsQ.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton className="h-80 rounded-2xl" key={i} />)}
        </div>
      ) : active.length === 0 && !showCompleted ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border border-slate-100">
          <ClipboardList className="h-12 w-12 text-slate-300 mb-4" />
          <p className="font-bold text-slate-700">No active bookings</p>
          <p className="text-sm text-slate-400 mt-1.5 max-w-xs text-center">
            Your booked test collections will appear here with live tracking
          </p>
          <a className="mt-4 text-xs text-red-600 font-semibold hover:underline" href="/tests">
            Book a test →
          </a>
        </div>
      ) : (
        <>
          {/* Active bookings */}
          {active.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Active ({active.length})</h2>
              {active.map((a) => <TimelineCard appointment={a} key={a.id} />)}
            </div>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <div className="space-y-4">
              <button
                className="text-sm font-bold text-slate-500 hover:text-slate-700 flex items-center gap-2 transition"
                onClick={() => setShowCompleted(!showCompleted)}
                type="button"
              >
                <FileText className="h-4 w-4" />
                {showCompleted ? "Hide" : "Show"} Completed ({completed.length})
              </button>
              {showCompleted && completed.slice(0, 5).map((a) => (
                <TimelineCard appointment={a} key={a.id} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
