"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Download,
  MapPin,
  Navigation,
  TestTube2
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { listMyAppointments } from "@/api/appointments";
import { getReport } from "@/api/reports";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Appointment } from "@lab-app/shared";

const statusBadge: Record<Appointment["status"], string> = {
  pending:    "bg-amber-50 text-amber-700 border-amber-200",
  assigned:   "bg-indigo-50 text-indigo-700 border-indigo-200",
  accepted:   "bg-blue-50 text-blue-700 border-blue-200",
  en_route:   "bg-cyan-50 text-cyan-700 border-cyan-200",
  collected:  "bg-teal-50 text-teal-700 border-teal-200",
  processing: "bg-purple-50 text-purple-700 border-purple-200",
  completed:  "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const statusLabel: Record<Appointment["status"], string> = {
  pending:    "Pending",
  assigned:   "Assigned",
  accepted:   "Confirmed",
  en_route:   "On the Way",
  collected:  "Sample Collected",
  processing: "Processing",
  completed:  "Completed",
};

type FilterType = "all" | "active" | "completed";

export default function MyBookingsPage() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const appointmentsQ = useQuery({
    queryKey: ["appointments", "mine"],
    queryFn:  listMyAppointments,
  });

  const all = appointmentsQ.data?.data ?? [];
  const active    = all.filter((a) => a.status !== "completed");
  const completed = all.filter((a) => a.status === "completed");

  const displayed =
    filter === "active"    ? active :
    filter === "completed" ? completed :
    all;

  const handleDownload = async (appointmentId: string) => {
    setDownloadingId(appointmentId);
    try {
      const res = await getReport(appointmentId);
      window.open(res.data.downloadUrl, "_blank", "noopener,noreferrer");
    } catch {
      // report not ready
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">My Bookings</h1>
        <p className="text-sm text-slate-500 mt-1">All your lab test collection bookings</p>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3">
        {([
          { key: "all",       label: `All (${all.length})` },
          { key: "active",    label: `Active (${active.length})` },
          { key: "completed", label: `Completed (${completed.length})` },
        ] as { key: FilterType; label: string }[]).map((f) => (
          <button
            className={`h-8 px-4 rounded-xl text-xs font-semibold transition border ${
              filter === f.key
                ? "bg-red-600 text-white border-red-600 shadow-sm"
                : "bg-white text-slate-500 border-slate-200 hover:border-red-300 hover:text-red-600"
            }`}
            key={f.key}
            onClick={() => setFilter(f.key)}
            type="button"
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {appointmentsQ.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton className="h-36 rounded-2xl" key={i} />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border border-slate-100">
          <ClipboardList className="h-12 w-12 text-slate-300 mb-4" />
          <p className="font-bold text-slate-700">No bookings yet</p>
          <Link className="mt-3 text-xs text-red-600 font-semibold hover:underline" href="/tests">
            Book your first test →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((a) => (
            <Card className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden" key={a.id}>
              <div className={`h-1 ${a.status === "completed" ? "bg-emerald-400" : "bg-red-400"}`} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusBadge[a.status]}`}>
                      {statusLabel[a.status]}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">#{a.id.slice(0, 10)}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 flex-shrink-0">{a.slot?.split(" ")[0]}</span>
                </div>

                {/* Tests */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {a.testTypes.map((t) => (
                    <span className="flex items-center gap-1 text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full" key={t}>
                      <TestTube2 className="h-2.5 w-2.5" /> {t}
                    </span>
                  ))}
                </div>

                {/* Address + time */}
                <div className="space-y-1.5">
                  <p className="flex items-start gap-2 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5 text-slate-300 flex-shrink-0 mt-0.5" />
                    {a.address}
                  </p>
                  <p className="flex items-center gap-2 text-xs text-slate-400">
                    <CalendarClock className="h-3.5 w-3.5 text-slate-300" />
                    {a.slot?.split(" ").slice(1).join(" ") || a.slot}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <Link
                    className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                    href="/dashboard/track-collection"
                  >
                    <Navigation className="h-3.5 w-3.5 text-red-500" /> Track
                  </Link>
                  {a.status === "completed" && (
                    <button
                      className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition disabled:opacity-60"
                      disabled={downloadingId === a.id}
                      onClick={() => handleDownload(a.id)}
                      type="button"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {downloadingId === a.id ? "Opening…" : "Download Report"}
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
