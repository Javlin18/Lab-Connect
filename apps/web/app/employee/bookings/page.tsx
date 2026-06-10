"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Phone,
  Search,
  UserRound
} from "lucide-react";
import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";

import {
  acceptAppointment,
  getAssignedAppointments,
  updateAppointmentStatus
} from "@/api/employee";
import { EmployeeShell } from "@/components/app/employee-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Appointment } from "@lab-app/shared";

const STATUS_FILTERS = ["all", "assigned", "accepted", "en_route", "collected", "processing", "completed"];

const statusConfig: Record<string, { label: string; color: string }> = {
  assigned:   { label: "Assigned",   color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  accepted:   { label: "Accepted",   color: "bg-blue-50 text-blue-700 border-blue-200" },
  en_route:   { label: "En Route",   color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  collected:  { label: "Collected",  color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  processing: { label: "Processing", color: "bg-purple-50 text-purple-700 border-purple-200" },
  completed:  { label: "Completed",  color: "bg-slate-50 text-slate-600 border-slate-200" },
};

export default function EmployeeBookingsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const assignedQ = useQuery({
    queryKey: ["employee", "assigned"],
    queryFn: getAssignedAppointments,
    refetchInterval: 20000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["employee"] });

  const acceptMutation = useMutation({
    mutationFn: acceptAppointment,
    onSuccess: () => { toast({ title: "Accepted" }); invalidate(); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Appointment["status"] }) =>
      updateAppointmentStatus(id, { status, collectedAt: status === "collected" ? new Date().toISOString() : undefined }),
    onSuccess: () => { toast({ title: "Status updated" }); invalidate(); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const all = assignedQ.data?.data ?? [];

  const filtered = useMemo(() => {
    return all.filter((a) => {
      const matchStatus = statusFilter === "all" || a.status === statusFilter;
      const matchSearch = !search ||
        a.id.toLowerCase().includes(search.toLowerCase()) ||
        a.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
        a.patient?.phone?.includes(search);
      return matchStatus && matchSearch;
    });
  }, [all, statusFilter, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: all.length };
    for (const s of STATUS_FILTERS.slice(1)) {
      c[s] = all.filter((a) => a.status === s).length;
    }
    return c;
  }, [all]);

  return (
    <EmployeeShell userName={session?.user?.name}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-black text-slate-900">My Bookings</h1>
          <p className="text-xs text-slate-500 mt-0.5">All your assigned and completed collections</p>
        </div>

        {/* Status filter chips */}
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              className={`h-8 px-3 rounded-xl text-xs font-semibold transition border ${
                statusFilter === s
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-slate-500 border-slate-200 hover:border-emerald-300"
              }`}
              key={s}
              onClick={() => setStatusFilter(s)}
              type="button"
            >
              {s === "all" ? "All" : s.replace("_", " ")}
              <span className="ml-1.5 opacity-70">({counts[s] ?? 0})</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-9 h-9 rounded-xl border-slate-200 text-sm"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient, phone, booking ID…"
            value={search}
          />
        </div>

        {/* List */}
        {assignedQ.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton className="h-40 rounded-2xl" key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400">
              <CheckCircle2 className="h-10 w-10 mb-3 text-slate-300" />
              <p className="text-sm font-medium">No bookings found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((a) => {
              const cfg = statusConfig[a.status] ?? statusConfig.completed;
              const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(a.address)}`;
              return (
                <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition" key={a.id}>
                  <div className={`h-1 ${
                    a.status === "en_route" ? "bg-cyan-400" :
                    a.status === "collected" ? "bg-emerald-400" :
                    a.status === "completed" ? "bg-slate-300" :
                    "bg-indigo-400"
                  }`} />
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">#{a.id.slice(0, 10)}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{a.slot?.split(" ")[0]}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <p className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                          <UserRound className="h-4 w-4 text-emerald-500" />
                          {a.patient?.name ?? "Patient"}
                        </p>
                        <a className="flex items-center gap-2 text-xs text-emerald-600 font-semibold hover:underline" href={`tel:${a.patient?.phone}`}>
                          <Phone className="h-3.5 w-3.5" /> {a.patient?.phone ?? "N/A"}
                        </a>
                        <a className="flex items-start gap-2 text-xs text-slate-500 hover:text-emerald-600 transition" href={mapsUrl} rel="noreferrer" target="_blank">
                          <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{a.address}</span>
                        </a>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tests Booked</p>
                        <div className="flex flex-wrap gap-1">
                          {a.testTypes.map((t) => (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium" key={t}>{t}</span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {a.status === "assigned" && (
                          <Button className="h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold" disabled={acceptMutation.isPending} onClick={() => acceptMutation.mutate(a.id)}>
                            ✓ Accept
                          </Button>
                        )}
                        {a.status === "accepted" && (
                          <Button className="h-8 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ id: a.id, status: "en_route" })}>
                            🚗 En Route
                          </Button>
                        )}
                        {a.status === "en_route" && (
                          <Button className="h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ id: a.id, status: "collected" })}>
                            🧪 Collected
                          </Button>
                        )}
                        {a.status === "collected" && (
                          <Button className="h-8 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ id: a.id, status: "processing" })}>
                            ⚗️ Processing
                          </Button>
                        )}
                        <div className="flex gap-1.5">
                          <a className="flex-1 flex items-center justify-center gap-1 h-7 rounded-xl border border-slate-200 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 transition" href={mapsUrl} rel="noreferrer" target="_blank">
                            <MapPin className="h-3 w-3" /> Maps
                          </a>
                          <a className="flex-1 flex items-center justify-center gap-1 h-7 rounded-xl border border-emerald-200 bg-emerald-50 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 transition" href={`tel:${a.patient?.phone}`}>
                            <Phone className="h-3 w-3" /> Call
                          </a>
                        </div>
                      </div>
                    </div>

                    {a.notes && (
                      <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 flex items-start gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700">{a.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </EmployeeShell>
  );
}
