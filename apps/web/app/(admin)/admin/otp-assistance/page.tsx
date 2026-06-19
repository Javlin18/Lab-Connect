"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Eye, KeyRound, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { useState } from "react";

import {
  approveOtpAssistance,
  forceVerifyOtpAssistance,
  listOtpAssistanceRequests,
  rejectOtpAssistance,
  resendOtpAssistanceOtp,
  shareOtpAssistanceOtp,
  type OtpAssistanceRequest,
  viewOtpAssistanceOtp,
} from "@/api/otp-assistance";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-blue-50 text-blue-700 border-blue-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  verified_by_admin: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${statusStyles[status] ?? statusStyles.pending}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function fmt(date: string) {
  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OtpAssistancePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selected, setSelected] = useState<OtpAssistanceRequest | null>(null);
  const [visibleOtp, setVisibleOtp] = useState<Record<string, string | null>>({});

  const requestsQ = useQuery({
    queryKey: ["otp-assistance"],
    queryFn: listOtpAssistanceRequests,
    refetchInterval: 5000,
  });

  const requests = requestsQ.data?.data ?? [];
  const pendingCount = requests.filter((request) => request.status === "pending").length;

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["otp-assistance"] });
  };

  const actionMutation = useMutation({
    mutationFn: async ({ action, id }: { action: string; id: string }) => {
      const reason = `Admin action: ${action}`;
      if (action === "resend") return resendOtpAssistanceOtp(id, reason);
      if (action === "share") return shareOtpAssistanceOtp(id, reason);
      if (action === "approve") return approveOtpAssistance(id, reason);
      if (action === "force") return forceVerifyOtpAssistance(id, reason);
      return rejectOtpAssistance(id, reason);
    },
    onSuccess: async (_data, variables) => {
      toast({ title: "OTP assistance updated", description: `Action completed: ${variables.action}` });
      await invalidate();
    },
    onError: (error: Error) => toast({ title: "Action failed", description: error.message, variant: "destructive" }),
  });

  const viewMutation = useMutation({
    mutationFn: viewOtpAssistanceOtp,
    onSuccess: (response, id) => {
      setVisibleOtp((prev) => ({ ...prev, [id]: response.data.otp }));
      toast({
        title: response.data.otp ? "OTP visible" : "No active OTP",
        description: response.data.otp ? `Expires at ${fmt(response.data.expiresAt!)}` : "Use Resend OTP first.",
      });
    },
    onError: (error: Error) => toast({ title: "Could not view OTP", description: error.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="OTP Assistance Requests"
        description="Help employees verify collections when booking owners are unavailable."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Requests</p>
            <p className="mt-1 text-3xl font-black text-slate-900">{requests.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-amber-200 bg-amber-50 shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Pending</p>
            <p className="mt-1 text-3xl font-black text-amber-800">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-emerald-200 bg-emerald-50 shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Admin Verified</p>
            <p className="mt-1 text-3xl font-black text-emerald-800">
              {requests.filter((request) => request.status === "verified_by_admin").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4">
          <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <KeyRound className="h-4 w-4 text-blue-600" />
            Request Queue
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {requestsQ.isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton className="h-24 rounded-xl" key={index} />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="py-14 text-center text-sm text-slate-400">No OTP assistance requests yet</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {requests.map((request) => (
                <div className="p-5" key={request.id}>
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <button className="min-w-0 flex-1 text-left" onClick={() => setSelected(request)} type="button">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={request.status} />
                        <span className="font-mono text-[11px] font-bold text-slate-400">Order: {request.orderId ?? "N/A"}</span>
                        <span className="font-mono text-[11px] font-bold text-slate-400">Booking: {request.bookingId.slice(0, 8)}</span>
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Patient</p>
                          <p className="text-sm font-black text-slate-900">{request.patientName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Employee</p>
                          <p className="text-sm font-black text-slate-900">{request.employeeName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Request Time</p>
                          <p className="text-sm font-semibold text-slate-700">{fmt(request.requestedAt)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Visible OTP</p>
                          <p className="text-sm font-black text-blue-700">{visibleOtp[request.id] ?? request.otpShared ?? "Hidden"}</p>
                        </div>
                      </div>
                    </button>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      {/* View OTP — always visible */}
                      <Button className="h-9 rounded-xl text-xs" onClick={() => viewMutation.mutate(request.id)} variant="outline">
                        <Eye className="mr-1.5 h-3.5 w-3.5" /> View OTP
                      </Button>

                      {/* Action buttons — only for pending/approved */}
                      {(request.status === "pending" || request.status === "approved") && (
                        <>
                          <Button className="h-9 rounded-xl text-xs" onClick={() => actionMutation.mutate({ id: request.id, action: "resend" })} variant="outline">
                            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Resend OTP
                          </Button>
                          <Button className="h-9 rounded-xl text-xs" onClick={() => actionMutation.mutate({ id: request.id, action: "share" })}>
                            Share OTP
                          </Button>
                          <Button className="h-9 rounded-xl bg-blue-600 text-xs text-white hover:bg-blue-700" onClick={() => actionMutation.mutate({ id: request.id, action: "approve" })}>
                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Approve
                          </Button>
                          <Button className="h-9 rounded-xl bg-emerald-600 text-xs text-white hover:bg-emerald-700" onClick={() => actionMutation.mutate({ id: request.id, action: "force" })}>
                            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Force Verify
                          </Button>
                          <Button className="h-9 rounded-xl text-xs" onClick={() => actionMutation.mutate({ id: request.id, action: "reject" })} variant="destructive">
                            <XCircle className="mr-1.5 h-3.5 w-3.5" /> Reject
                          </Button>
                        </>
                      )}

                      {/* Completed state indicators */}
                      {request.status === "rejected" && (
                        <span className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600">
                          <XCircle className="h-3.5 w-3.5" /> Rejected — no further action
                        </span>
                      )}
                      {request.status === "verified_by_admin" && (
                        <span className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                          <ShieldCheck className="h-3.5 w-3.5" /> Verified — completed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selected ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
          <button aria-label="Close details" className="hidden flex-1 lg:block" onClick={() => setSelected(null)} type="button" />
          <aside className="h-full w-full max-w-2xl overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">OTP Assistance</p>
                <h2 className="mt-1 text-2xl font-black text-slate-900">{selected.patientName}</h2>
              </div>
              <Button className="rounded-xl" onClick={() => setSelected(null)} variant="outline">Close</Button>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                ["Order ID", selected.orderId ?? "N/A"],
                ["Booking ID", selected.bookingId],
                ["Booking Owner", selected.bookingOwnerName],
                ["Employee", selected.employeeName],
                ["Location", selected.collectionLocation],
                ["Reason", selected.reason],
              ].map(([label, value]) => (
                <div className="rounded-xl bg-slate-50 p-3" key={label}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <p className="text-sm font-black text-slate-900">Audit Log</p>
              <div className="mt-3 space-y-2">
                {selected.auditLogs?.length ? selected.auditLogs.map((log) => (
                  <div className="rounded-xl border border-slate-100 p-3" key={log.id}>
                    <p className="text-xs font-black text-slate-800">{log.action.replace(/_/g, " ")}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {log.actorName} ({log.actorRole}) | {fmt(log.createdAt)}
                    </p>
                    {log.reason ? <p className="mt-1 text-xs text-slate-600">{log.reason}</p> : null}
                  </div>
                )) : <p className="text-sm text-slate-400">No audit logs yet</p>}
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
