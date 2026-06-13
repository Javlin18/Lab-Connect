"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  Plus,
  RefreshCw,
  Search,
  UserCheck,
  X
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  assignAppointment,
  completeAppointment,
  listAppointments
} from "@/api/appointments";
import { listUsers } from "@/api/users";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const STATUS_FILTERS = ["all", "pending", "assigned", "accepted", "en_route", "collected", "processing", "completed"];

export default function AppointmentsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assignEmployeeId, setAssignEmployeeId] = useState("");
  const [urgentIds, setUrgentIds] = useState<Set<string>>(new Set());

  const appointmentsQ = useQuery({
    queryKey: ["appointments", dateFilter, statusFilter],
    queryFn: () => listAppointments({
      date: dateFilter || undefined,
      status: (statusFilter !== "all" ? statusFilter : undefined) as any,
    }),
  });

  const patientsQ  = useQuery({ queryKey: ["users", "patients"],  queryFn: () => listUsers("patient") });
  const employeesQ = useQuery({ queryKey: ["users", "employees"], queryFn: () => listUsers("employee") });

  const patientMap  = useMemo(() => new Map((patientsQ.data?.data ?? []).map((u) => [u.id, u])),  [patientsQ.data]);
  const employeeMap = useMemo(() => new Map((employeesQ.data?.data ?? []).map((u) => [u.id, u])), [employeesQ.data]);

  const assignments = appointmentsQ.data?.data ?? [];

  const filtered = useMemo(() => {
    if (!search) return assignments;
    const q = search.toLowerCase();
    return assignments.filter((a) => {
      const patient = patientMap.get(a.patientId);
      return (
        a.id.toLowerCase().includes(q) ||
        patient?.name?.toLowerCase().includes(q) ||
        patient?.phone?.toLowerCase().includes(q) ||
        a.testTypes.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [assignments, search, patientMap]);

  // Status counts
  const counts = useMemo(() => ({
    all:        assignments.length,
    pending:    assignments.filter((a) => a.status === "pending").length,
    assigned:   assignments.filter((a) => a.status === "assigned").length,
    completed:  assignments.filter((a) => a.status === "completed").length,
    processing: assignments.filter((a) => a.status === "processing").length,
  }), [assignments]);

  const assignMutation = useMutation({
    mutationFn: ({ id, empId }: { id: string; empId: string }) => assignAppointment(id, empId),
    onSuccess: () => {
      toast({ title: "Employee assigned successfully" });
      setAssigningId(null);
      setAssignEmployeeId("");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (e: Error) => toast({ title: "Assign failed", description: e.message, variant: "destructive" }),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => completeAppointment(id, "Marked complete by admin"),
    onSuccess: () => {
      toast({ title: "Appointment completed" });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const toggleUrgent = (id: string) => {
    setUrgentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); toast({ title: "Urgent flag removed" }); }
      else { next.add(id); toast({ title: "Marked as urgent", description: "Appointment flagged for priority attention." }); }
      return next;
    });
  };

  const selectedAppointment = assignments.find((a) => a.id === assigningId);

  return (
    <div className="space-y-6">
      <PageHeader
        action={
          <Link
            className={buttonVariants({ className: "h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 gap-1.5" })}
            href="/admin/appointments/new"
          >
            <Plus className="h-3.5 w-3.5" /> New Appointment
          </Link>
        }
        description="View, assign, and manage all patient bookings."
        title="Appointments"
      />

      {/* Summary counts */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { key: "all",        label: "Total",      color: "text-slate-700 bg-slate-50 border-slate-200" },
          { key: "pending",    label: "Pending",    color: "text-amber-700 bg-amber-50 border-amber-100" },
          { key: "assigned",   label: "Assigned",   color: "text-indigo-700 bg-indigo-50 border-indigo-100" },
          { key: "processing", label: "Processing", color: "text-cyan-700 bg-cyan-50 border-cyan-100" },
          { key: "completed",  label: "Completed",  color: "text-emerald-700 bg-emerald-50 border-emerald-100" },
        ].map((s) => (
          <button
            className={`rounded-2xl border p-3 text-left transition hover:shadow-sm ${s.color} ${statusFilter === s.key ? "ring-2 ring-blue-500" : ""}`}
            key={s.key}
            onClick={() => setStatusFilter(s.key)}
            type="button"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{s.label}</p>
            <p className="text-2xl font-black mt-0.5">{counts[s.key as keyof typeof counts] ?? 0}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9 h-9 rounded-xl text-sm border-slate-200"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient, phone, booking ID…"
              value={search}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <Input
              className="h-9 rounded-xl text-sm border-slate-200 w-36"
              onChange={(e) => setDateFilter(e.target.value)}
              type="date"
              value={dateFilter}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.slice(1).map((s) => (
              <button
                className={`h-7 px-3 rounded-xl text-xs font-semibold transition border ${
                  statusFilter === s
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600"
                }`}
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
                type="button"
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
          {(search || dateFilter || statusFilter !== "all") && (
            <Button
              className="h-7 px-3 rounded-xl text-xs text-slate-500 border-slate-200"
              onClick={() => { setSearch(""); setDateFilter(""); setStatusFilter("all"); }}
              variant="outline"
            >
              <X className="h-3 w-3 mr-1" /> Clear
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Assign modal */}
      {assigningId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <Card className="w-full max-w-md rounded-3xl shadow-2xl bg-white">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-blue-500" /> Assign Employee
              </h3>
              <Button className="h-8 w-8 p-0 rounded-full" onClick={() => { setAssigningId(null); setAssignEmployeeId(""); }} variant="ghost">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              {selectedAppointment && (
                <div className="bg-slate-50 rounded-xl p-4 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Booking ID</span>
                    <span className="font-mono font-bold text-slate-700">{selectedAppointment.id.slice(0, 10)}…</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Patient</span>
                    <span className="font-bold text-slate-700">{patientMap.get(selectedAppointment.patientId)?.name ?? "Unknown"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tests</span>
                    <span className="font-bold text-slate-700">{selectedAppointment.testTypes.slice(0, 2).join(", ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Slot</span>
                    <span className="font-bold text-slate-700">{selectedAppointment.slot}</span>
                  </div>
                  {selectedAppointment.employeeId && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Current Employee</span>
                      <span className="font-bold text-blue-600">{employeeMap.get(selectedAppointment.employeeId)?.name ?? "Unknown"}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Select Employee *</Label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  onChange={(e) => setAssignEmployeeId(e.target.value)}
                  value={assignEmployeeId}
                >
                  <option value="">— Choose employee —</option>
                  {(employeesQ.data?.data ?? []).map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} {emp.employee?.isAvailable ? "— Free" : "— Busy"} — {emp.employee?.zone ?? "No zone"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  disabled={!assignEmployeeId || assignMutation.isPending}
                  onClick={() => assignMutation.mutate({ id: assigningId!, empId: assignEmployeeId })}
                >
                  {assignMutation.isPending ? "Assigning…" : "Assign Employee"}
                </Button>
                <Button className="rounded-xl" onClick={() => { setAssigningId(null); setAssignEmployeeId(""); }} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Table */}
      <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {appointmentsQ.isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 7 }).map((_, i) => <Skeleton className="h-12" key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <CheckCircle2 className="h-10 w-10 mb-3 text-slate-300" />
              <p className="text-sm font-medium">No appointments found</p>
              <p className="text-xs mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    <th className="px-5 py-3">Booking ID</th>
                    <th className="px-5 py-3">Patient</th>
                    <th className="px-5 py-3">Tests</th>
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-5 py-3">Slot</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {filtered.map((a) => {
                    const patient  = patientMap.get(a.patientId);
                    const employee = a.employeeId ? employeeMap.get(a.employeeId) : null;
                    const isUrgent = urgentIds.has(a.id);

                    return (
                      <tr
                        className={`hover:bg-slate-50/60 transition ${isUrgent ? "bg-red-50/30 border-l-2 border-red-400" : ""}`}
                        key={a.id}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-slate-500">{a.id.slice(0, 10)}…</span>
                            {isUrgent && (
                              <span className="text-[9px] font-black text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                <AlertTriangle className="h-2.5 w-2.5" /> URGENT
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-semibold text-slate-800 text-xs">{patient?.name ?? a.patientId.slice(0, 8)}</p>
                          <p className="text-[10px] text-slate-400">{patient?.phone ?? ""}</p>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-500">{a.testTypes.slice(0, 2).join(", ")}{a.testTypes.length > 2 ? "…" : ""}</td>
                        <td className="px-5 py-3 text-xs">
                          {employee ? (
                            <span className="font-semibold text-slate-700">{employee.name}</span>
                          ) : (
                            <span className="text-slate-300 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-400">{a.slot?.split(" ")[0]}<br /><span className="text-[10px]">{a.slot?.split(" ").slice(1).join(" ")}</span></td>
                        <td className="px-5 py-3"><StatusBadge status={a.status} /></td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            <Button
                              className="h-7 px-2.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => setAssigningId(a.id)}
                            >
                              <UserCheck className="h-3 w-3 mr-1" />
                              {a.employeeId ? "Reassign" : "Assign"}
                            </Button>
                            <Button
                              className={`h-7 px-2.5 rounded-lg text-xs font-semibold ${isUrgent ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-amber-50 text-amber-600 hover:bg-amber-100"}`}
                              onClick={() => toggleUrgent(a.id)}
                              variant="ghost"
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {isUrgent ? "Unurgent" : "Urgent"}
                            </Button>
                            {a.status !== "completed" && (
                              <Button
                                className="h-7 px-2.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                disabled={completeMutation.isPending}
                                onClick={() => completeMutation.mutate(a.id)}
                                variant="ghost"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Done
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
