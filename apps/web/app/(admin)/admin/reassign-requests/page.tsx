"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Calendar, MapPin } from "lucide-react";
import { getReassignRequests, resolveReassign } from "@/api/reassign";
import { listEmployees } from "@/api/employees";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const REASON_LABELS: Record<string, string> = {
  patient_not_home: "Patient not home",
  wrong_address: "Wrong address / Cannot find location",
  patient_cancelled: "Patient cancelled",
  emergency: "Personal emergency",
  vehicle_breakdown: "Vehicle breakdown",
  other: "Other",
};

export default function ReassignRequestsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState<Record<string, string>>({});

  const requestsQuery = useQuery({
    queryKey: ["reassign-requests"],
    queryFn: () => getReassignRequests(),
    refetchInterval: 30000,
  });

  const employeesQuery = useQuery({
    queryKey: ["employees", "records"],
    queryFn: listEmployees,
  });

  const resolveMutation = useMutation({
    mutationFn: ({ requestId, employeeId }: { requestId: string; employeeId: string }) =>
      resolveReassign(requestId, employeeId),
    onSuccess: (_, vars) => {
      toast({ title: "Reassigned", description: "New employee assigned successfully." });
      queryClient.invalidateQueries({ queryKey: ["reassign-requests"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setSelectedEmployee((prev) => {
        const next = { ...prev };
        delete next[vars.requestId];
        return next;
      });
    },
    onError: (err: Error) =>
      toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  const requests = requestsQuery.data?.data ?? [];
  const pending = requests.filter((r) => r.status === "pending");
  const resolved = requests.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reassign Requests"
        description="Employee requests to reassign appointments they cannot complete."
      />

      {/* Pending — urgent */}
      {pending.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            {pending.length} Pending Request{pending.length > 1 ? "s" : ""}
          </h2>

          {pending.map((req) => (
            <Card key={req.id} className="border-l-4 border-l-red-500">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-red-700 text-sm flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Reassign Needed</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium text-foreground">
                        {req.appointment.patient?.name ?? "Patient"}
                      </span>{" "}
                      — {req.appointment.testTypes.join(", ")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <Calendar className="inline-block h-3 w-3 mr-1" /> {req.appointment.slot} &nbsp;|&nbsp; <MapPin className="inline-block h-3 w-3 mr-1" /> {req.appointment.address}
                    </p>
                  </div>
                  <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
                    pending
                  </span>
                </div>

                <div className="text-sm">
                  <span className="text-muted-foreground">Employee: </span>
                  <span className="font-medium">{req.appointment.employee?.name ?? "—"}</span>
                  <span className="text-muted-foreground ml-3">Reason: </span>
                  <span className="font-medium">{REASON_LABELS[req.reason] ?? req.reason}</span>
                </div>

                {req.note && (
                  <p className="text-xs bg-slate-50 border border-slate-100 rounded-lg p-2 text-slate-600">
                    {req.note}
                  </p>
                )}

                {/* Assign new employee */}
                <div className="flex items-center gap-3 pt-1">
                  <Select
                    className="flex-1"
                    value={selectedEmployee[req.id] ?? ""}
                    onChange={(e) =>
                      setSelectedEmployee((prev) => ({ ...prev, [req.id]: e.target.value }))
                    }
                  >
                    <option value="">Select new employee</option>
                    {(employeesQuery.data?.data ?? [])
                      .filter((e) => e.employee.isAvailable)
                      .map((e) => (
                        <option key={e.user.id} value={e.user.id}>
                          {e.user.name} · {e.employee.zone}
                        </option>
                      ))}
                  </Select>
                  <Button
                    disabled={!selectedEmployee[req.id] || resolveMutation.isPending}
                    onClick={() =>
                      resolveMutation.mutate({
                        requestId: req.id,
                        employeeId: selectedEmployee[req.id],
                      })
                    }
                  >
                    Reassign
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Resolved history */}
      <Card>
        <CardHeader>
          <CardTitle>All Requests ({requests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {requestsQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No requests yet.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between border rounded-xl px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {req.appointment.patient?.name ?? "—"} &nbsp;·&nbsp;{" "}
                      {req.appointment.slot}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {REASON_LABELS[req.reason] ?? req.reason}
                      {req.note ? ` · ${req.note}` : ""}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      req.status === "pending"
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
