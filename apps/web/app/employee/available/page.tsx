"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, AlertTriangle, Loader2, MapPin, Phone, RefreshCw, UserRound } from "lucide-react";
import { useSession } from "next-auth/react";

import { claimAppointment, getAssignedAppointments, getAvailableAppointments } from "@/api/employee";
import { EmployeeShell } from "@/components/app/employee-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function AvailableBookingsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const availableQ = useQuery({ queryKey: ["employee", "available"], queryFn: getAvailableAppointments, refetchInterval: 10000 });
  const assignedQ  = useQuery({ queryKey: ["employee", "assigned"],  queryFn: getAssignedAppointments });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["employee"] });

  const claimMutation = useMutation({
    mutationFn: claimAppointment,
    onSuccess: () => { toast({ title: "Booking claimed!", description: "Check My Bookings to proceed." }); invalidate(); },
    onError: (e: Error) => { toast({ title: "Could not claim", description: e.message, variant: "destructive" }); invalidate(); },
  });

  const available = availableQ.data?.data ?? [];
  const assigned  = assignedQ.data?.data ?? [];
  const isBusy    = assigned.some((a) => !["completed", "collected"].includes(a.status));

  return (
    <EmployeeShell userName={session?.user?.name} isAvailable={!isBusy}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900">Open Bookings</h1>
            <p className="text-xs text-slate-500 mt-0.5">Unassigned patient bookings — first to accept gets the job</p>
          </div>
          <Button
            className="rounded-xl border-slate-200 h-9 text-xs gap-1.5"
            disabled={availableQ.isFetching}
            onClick={invalidate}
            variant="outline"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${availableQ.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {isBusy && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-800">You are currently busy</p>
              <p className="text-xs text-amber-600">Complete your current task before accepting a new booking</p>
            </div>
          </div>
        )}

        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="px-5 py-4 border-b border-slate-50 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              {available.length} Open {available.length === 1 ? "Booking" : "Bookings"}
            </CardTitle>
            {available.length > 0 && (
              <span className="text-[10px] font-black text-white bg-blue-600 px-2.5 py-1 rounded-full animate-pulse">
                LIVE
              </span>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {availableQ.isLoading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton className="h-36 rounded-2xl" key={i} />)}
              </div>
            ) : available.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Activity className="h-10 w-10 mb-3 text-slate-300" />
                <p className="text-sm font-medium">No open bookings at the moment</p>
                <p className="text-xs mt-1">New bookings appear here automatically — page refreshes every 10s</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {available.map((a) => (
                  <div className="p-5 hover:bg-slate-50/50 transition" key={a.id}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-mono text-slate-400">#{a.id.slice(0, 12)}</span>
                      <span className="text-[10px] font-semibold text-slate-500">{a.slot?.split(" ")[0]}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <p className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                          <UserRound className="h-4 w-4 text-blue-500" />
                          {a.patient?.name ?? "Patient"}
                        </p>
                        <p className="flex items-center gap-2 text-xs text-slate-500">
                          <Phone className="h-3.5 w-3.5 text-slate-300" />
                          {a.patient?.phone ?? "N/A"}
                        </p>
                        <p className="flex items-start gap-2 text-xs text-slate-500">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-slate-300" />
                          <span className="line-clamp-2">{a.address}</span>
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tests</p>
                        <div className="flex flex-wrap gap-1.5">
                          {a.testTypes.map((t) => (
                            <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-semibold" key={t}>{t}</span>
                          ))}
                        </div>
                        <p className="text-xs text-slate-400">
                          Time: <span className="font-semibold text-slate-600">{a.slot?.split(" ").slice(1).join(" ") || "—"}</span>
                        </p>
                      </div>

                      <div>
                        <Button
                          className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10"
                          disabled={isBusy || claimMutation.isPending}
                          onClick={() => claimMutation.mutate(a.id)}
                        >
                          {claimMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "✋ Accept Booking"
                          )}
                        </Button>
                        <p className="text-[10px] text-slate-400 text-center mt-2">
                          First to accept gets this booking
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </EmployeeShell>
  );
}
