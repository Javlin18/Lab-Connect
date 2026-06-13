"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  TestTube2,
  UserRound,
  Zap
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

import {
  acceptAppointment,
  claimAppointment,
  getAssignedAppointments,
  getAvailableAppointments,
  updateAppointmentStatus
} from "@/api/employee";
import { EmployeeShell } from "@/components/app/employee-shell";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Appointment } from "@lab-app/shared";

const statusConfig: Record<Appointment["status"], { label: string; color: string }> = {
  pending:    { label: "Pending",    color: "bg-amber-50 text-amber-700 border-amber-200" },
  assigned:   { label: "Assigned",   color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  accepted:   { label: "Accepted",   color: "bg-blue-50 text-blue-700 border-blue-200" },
  en_route:   { label: "En Route",   color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  collected:  { label: "Collected",  color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  processing: { label: "Processing", color: "bg-purple-50 text-purple-700 border-purple-200" },
  completed:  { label: "Completed",  color: "bg-slate-50 text-slate-700 border-slate-200" },
};

export default function EmployeeDashboardPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const availableQ = useQuery({
    queryKey: ["employee", "available"],
    queryFn: getAvailableAppointments,
    refetchInterval: 15000,
  });

  const assignedQ = useQuery({
    queryKey: ["employee", "assigned"],
    queryFn: getAssignedAppointments,
    refetchInterval: 15000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["employee"] });
  };

  const claimMutation = useMutation({
    mutationFn: claimAppointment,
    onSuccess: () => { toast({ title: "Booking claimed!", description: "This collection is now yours." }); invalidate(); },
    onError: (e: Error) => { toast({ title: "Could not claim", description: e.message, variant: "destructive" }); invalidate(); },
  });

  const acceptMutation = useMutation({
    mutationFn: acceptAppointment,
    onSuccess: () => { toast({ title: "Booking accepted" }); invalidate(); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Appointment["status"] }) =>
      updateAppointmentStatus(id, { status, collectedAt: status === "collected" ? new Date().toISOString() : undefined }),
    onSuccess: () => { toast({ title: "Status updated" }); invalidate(); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const available  = availableQ.data?.data ?? [];
  const assigned   = assignedQ.data?.data ?? [];
  const active     = assigned.filter((a) => !["completed", "collected"].includes(a.status));
  const completed  = assigned.filter((a) => a.status === "completed");
  const isBusy     = active.length > 0;

  const stats = [
    { label: "Open Bookings",  value: available.length, icon: Activity,      color: "text-blue-600 bg-blue-50" },
    { label: "My Active",      value: active.length,    icon: Zap,           color: "text-amber-600 bg-amber-50" },
    { label: "Completed Today",value: completed.length, icon: CheckCircle2,  color: "text-emerald-600 bg-emerald-50" },
    { label: "Total Assigned", value: assigned.length,  icon: ClipboardList, color: "text-purple-600 bg-purple-50" },
  ];

  return (
    <EmployeeShell isAvailable={!isBusy} userName={session?.user?.name}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900">
              Good day, {session?.user?.name?.split(" ")[0] ?? "Collector"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <Button
            className="rounded-xl border-slate-200 h-9 text-xs gap-1.5"
            disabled={assignedQ.isFetching}
            onClick={invalidate}
            variant="outline"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${assignedQ.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card className="rounded-2xl border-slate-200 shadow-sm" key={s.label}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className="text-2xl font-black text-slate-900 mt-0.5">{s.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Open bookings */}
        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="px-5 py-4 border-b border-slate-50 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-sm font-bold text-slate-800">Open Bookings</CardTitle>
              {available.length > 0 && (
                <span className="text-[10px] font-black text-white bg-blue-600 px-2 py-0.5 rounded-full animate-pulse">
                  {available.length} NEW
                </span>
              )}
            </div>
            {isBusy && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-1 rounded-full">
                You are busy — complete current task first
              </span>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {availableQ.isLoading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton className="h-28 rounded-2xl" key={i} />)}
              </div>
            ) : available.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-slate-400">
                <CheckCircle2 className="h-10 w-10 mb-3 text-slate-300" />
                <p className="text-sm font-medium">No open bookings right now</p>
                <p className="text-xs mt-1">New patient bookings will appear here automatically</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {available.map((a) => (
                  <BookingCard
                    appointment={a}
                    key={a.id}
                    mode="available"
                    onClaim={() => claimMutation.mutate(a.id)}
                    claimDisabled={isBusy || claimMutation.isPending}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My active bookings */}
        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="px-5 py-4 border-b border-slate-50 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-800">My Active Bookings</CardTitle>
            <Link className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1" href="/employee/bookings">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {assignedQ.isLoading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 2 }).map((_, i) => <Skeleton className="h-28 rounded-2xl" key={i} />)}
              </div>
            ) : active.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-slate-400">
                <TestTube2 className="h-10 w-10 mb-3 text-slate-300" />
                <p className="text-sm font-medium">No active bookings</p>
                <p className="text-xs mt-1">Claim an open booking to start</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {active.map((a) => (
                  <BookingCard
                    appointment={a}
                    key={a.id}
                    mode="assigned"
                    onAccept={() => acceptMutation.mutate(a.id)}
                    onStatusUpdate={(status) => statusMutation.mutate({ id: a.id, status })}
                    actionDisabled={acceptMutation.isPending || statusMutation.isPending}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </EmployeeShell>
  );
}

function BookingCard({
  appointment: a,
  mode,
  onClaim,
  onAccept,
  onStatusUpdate,
  claimDisabled,
  actionDisabled,
}: {
  appointment: Appointment;
  mode: "available" | "assigned";
  onClaim?: () => void;
  onAccept?: () => void;
  onStatusUpdate?: (s: Appointment["status"]) => void;
  claimDisabled?: boolean;
  actionDisabled?: boolean;
}) {
  const cfg = statusConfig[a.status];

  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(a.address)}`;
  const callUrl = `tel:${a.patient?.phone ?? ""}`;

  return (
    <div className="p-5 hover:bg-slate-50/50 transition">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${cfg.color}`}>
            {cfg.label}
          </span>
          <span className="text-[10px] font-mono text-slate-400">#{a.id.slice(0, 10)}</span>
        </div>
        <span className="text-[10px] text-slate-400 text-right flex-shrink-0">{a.slot?.split(" ")[0]}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Patient info */}
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <UserRound className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            {a.patient?.name ?? "Patient"}
          </p>
          <a
            className="flex items-center gap-2 text-xs text-emerald-600 font-semibold hover:underline"
            href={callUrl}
          >
            <Phone className="h-3.5 w-3.5" />
            {a.patient?.phone ?? "N/A"}
          </a>
          <a
            className="flex items-start gap-2 text-xs text-slate-500 hover:text-emerald-600 transition"
            href={mapsUrl}
            rel="noreferrer"
            target="_blank"
          >
            <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2">{a.address}</span>
          </a>
        </div>

        {/* Tests + slot */}
        <div className="space-y-2">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tests</p>
          <div className="flex flex-wrap gap-1.5">
            {a.testTypes.map((t) => (
              <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full" key={t}>
                {t}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-400">
            Slot: <span className="font-semibold text-slate-600">{a.slot?.split(" ").slice(1).join(" ") || a.slot}</span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 justify-start">
          {mode === "available" && (
            <Button
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm h-9"
              disabled={claimDisabled}
              onClick={onClaim}
            >
              {claimDisabled ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accept Booking"}
            </Button>
          )}

          {mode === "assigned" && (
            <>
              {a.status === "assigned" && (
                <Button className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 text-xs" disabled={actionDisabled} onClick={onAccept}>
                  Confirm Booking
                </Button>
              )}
              {a.status === "accepted" && (
                <Button className="w-full rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold h-9 text-xs" disabled={actionDisabled} onClick={() => onStatusUpdate?.("en_route")}>
                  Mark En Route
                </Button>
              )}
              {a.status === "en_route" && (
                <Button className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 text-xs" disabled={actionDisabled} onClick={() => onStatusUpdate?.("collected")}>
                  Mark Collected
                </Button>
              )}
              {a.status === "collected" && (
                <Button className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold h-9 text-xs" disabled={actionDisabled} onClick={() => onStatusUpdate?.("processing")}>
                  Mark Processing
                </Button>
              )}
              {/* Maps + Call quick actions */}
              <div className="flex gap-2">
                <a
                  className="flex-1 flex items-center justify-center gap-1 h-8 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                  href={mapsUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <MapPin className="h-3 w-3" /> Navigate
                </a>
                <a
                  className="flex-1 flex items-center justify-center gap-1 h-8 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                  href={callUrl}
                >
                  <Phone className="h-3 w-3" /> Call
                </a>
              </div>
            </>
          )}
        </div>
      </div>

      {a.notes && (
        <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 flex items-start gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">{a.notes}</p>
        </div>
      )}
    </div>
  );
}
