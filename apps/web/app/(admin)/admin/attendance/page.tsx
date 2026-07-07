"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarCheck,
  CalendarX2,
  CheckCircle2,
  Clock,
  RefreshCw,
  UserX,
  Users,
  X,
  ZoomIn,
} from "lucide-react";
import { useState } from "react";

import {
  getAllAttendance,
  getAttendanceSummary,
  markAbsent,
  type AttendanceRecord,
  type AttendanceSummaryItem,
} from "@/api/attendance";
import { listEmployees } from "@/api/employees";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

function today() {
  const d = new Date();
  const ist = new Date(d.getTime() + 330 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default function AdminAttendancePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"daily" | "summary">("daily");
  const [selectedDate, setSelectedDate] = useState(today());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [markingAbsent, setMarkingAbsent] = useState<string | null>(null);

  // Daily attendance records
  const { data: dailyRes, isLoading: dailyLoading } = useQuery({
    queryKey: ["admin-attendance-daily", selectedDate],
    queryFn: () => getAllAttendance(selectedDate),
  });
  const dailyRecords: AttendanceRecord[] = dailyRes?.data ?? [];

  // Monthly summary
  const { data: summaryRes, isLoading: summaryLoading } = useQuery({
    queryKey: ["admin-attendance-summary", selectedMonth],
    queryFn: () => getAttendanceSummary(selectedMonth),
  });
  const summaryData: AttendanceSummaryItem[] = summaryRes?.data ?? [];

  // All employees (to find who hasn't checked in)
  const { data: employeesRes } = useQuery({
    queryKey: ["employees"],
    queryFn: listEmployees,
  });
  const employees = employeesRes?.data ?? [];

  // Employees who haven't been recorded today
  const checkedInEmployeeIds = new Set(dailyRecords.map((r) => r.employeeId));
  const missingEmployees = employees.filter(
    (emp) => !checkedInEmployeeIds.has(emp.employee.id)
  );

  const presentToday = dailyRecords.filter((r) => r.status === "present").length;
  const absentToday = dailyRecords.filter((r) => r.status === "absent").length;
  const notMarked = missingEmployees.length;
  const totalEmployees = employees.length;

  // Mark absent mutation
  const markAbsentMutation = useMutation({
    mutationFn: ({ employeeId, date }: { employeeId: string; date: string }) =>
      markAbsent(employeeId, date),
    onSuccess: (res) => {
      const count = res.data.reassignedCount;
      toast({
        title: "Marked Absent",
        description: `Employee marked absent. ${count} appointment(s) reassigned.`,
      });
      setMarkingAbsent(null);
      queryClient.invalidateQueries({ queryKey: ["admin-attendance-daily"] });
      queryClient.invalidateQueries({ queryKey: ["admin-attendance-summary"] });
    },
    onError: (e: Error) => {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
      setMarkingAbsent(null);
    },
  });

  const handleMarkAbsent = (employeeId: string, date: string) => {
    setMarkingAbsent(employeeId);
    markAbsentMutation.mutate({ employeeId, date });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Management"
        description="Track daily check-ins, view selfies, and mark absent employees. Absent employees' appointments are auto-reassigned."
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Staff", value: totalEmployees, icon: Users, color: "text-slate-700", bg: "bg-slate-100" },
          { label: "Present Today", value: presentToday, icon: CheckCircle2, color: "text-emerald-700", bg: "bg-emerald-100" },
          { label: "Absent Today", value: absentToday, icon: CalendarX2, color: "text-rose-700", bg: "bg-rose-100" },
          { label: "Not Marked", value: notMarked, icon: Clock, color: "text-amber-700", bg: "bg-amber-100" },
        ].map((s) => (
          <Card key={s.label} className="rounded-2xl border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 font-medium">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
        <div className="flex gap-1 rounded-xl bg-slate-100/50 p-1">
          <button
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${activeTab === "daily" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            onClick={() => setActiveTab("daily")}
          >
            <CalendarCheck className="h-4 w-4" /> Daily View
          </button>
          <button
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${activeTab === "summary" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            onClick={() => setActiveTab("summary")}
          >
            <Users className="h-4 w-4" /> Monthly Summary
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {activeTab === "daily" ? (
            <>
              <span className="text-xs font-bold text-slate-400">Date</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-9 w-42 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </>
          ) : (
            <>
              <span className="text-xs font-bold text-slate-400">Month</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-9 w-42 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </>
          )}
        </div>
      </div>

      {/* Daily View */}
      {activeTab === "daily" && (
        <div className="space-y-4">
          {/* Checked-in records */}
          <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-bold text-slate-700">Employee</TableHead>
                    <TableHead className="font-bold text-slate-700">Status</TableHead>
                    <TableHead className="font-bold text-slate-700">Check-in Time</TableHead>
                    <TableHead className="font-bold text-slate-700">Selfie</TableHead>
                    <TableHead className="font-bold text-slate-700">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={5}>
                          <Skeleton className="h-8 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : dailyRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-sm text-slate-500">
                        No attendance records for {selectedDate}
                      </TableCell>
                    </TableRow>
                  ) : (
                    dailyRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="font-bold text-slate-900">
                            {(record as any).employee?.user?.name ?? "—"}
                          </div>
                          <div className="text-xs text-slate-400">
                            {(record as any).employee?.zone ?? ""}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              record.status === "present"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : "bg-rose-50 text-rose-700 border border-rose-100"
                            }`}
                          >
                            {record.status === "present" ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <CalendarX2 className="h-3 w-3" />
                            )}
                            {record.status.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {record.checkInAt
                            ? new Date(record.checkInAt).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {record.selfieUrl ? (
                            <button
                              onClick={() => setLightboxSrc(record.selfieUrl!)}
                              className="group relative h-10 w-10 rounded-xl overflow-hidden border-2 border-slate-200 hover:border-blue-400 transition-all"
                              type="button"
                              title="View selfie"
                            >
                              <img
                                src={record.selfieUrl}
                                alt="selfie"
                                className="h-full w-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/0 group-hover:bg-slate-900/40 transition">
                                <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition" />
                              </div>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">No photo</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.status === "present" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 rounded-lg text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                              onClick={() =>
                                handleMarkAbsent(record.employeeId, record.date)
                              }
                              disabled={
                                markingAbsent === record.employeeId &&
                                markAbsentMutation.isPending
                              }
                            >
                              {markingAbsent === record.employeeId &&
                              markAbsentMutation.isPending ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                "Mark Absent"
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Employees who haven't checked in */}
          {missingEmployees.length > 0 && (
            <Card className="rounded-2xl border-amber-200 shadow-sm overflow-hidden">
              <div className="bg-amber-50 px-5 py-3 border-b border-amber-100 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-bold text-amber-800">
                  Not Yet Checked In ({missingEmployees.length})
                </p>
              </div>
              <CardContent className="p-0">
                <Table>
                  <TableBody>
                    {missingEmployees.map((emp) => (
                      <TableRow key={emp.employee.id}>
                        <TableCell>
                          <div className="font-bold text-slate-900">{emp.user.name}</div>
                          <div className="text-xs text-slate-400">{emp.employee.zone}</div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                            <Clock className="h-3 w-3" /> NOT MARKED
                          </span>
                        </TableCell>
                        <TableCell colSpan={2} />
                        <TableCell>
                          <Button
                            id={`mark-absent-${emp.employee.id}`}
                            variant="outline"
                            size="sm"
                            className="h-7 rounded-lg text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                            onClick={() =>
                              handleMarkAbsent(emp.employee.id, selectedDate)
                            }
                            disabled={
                              markingAbsent === emp.employee.id &&
                              markAbsentMutation.isPending
                            }
                          >
                            {markingAbsent === emp.employee.id &&
                            markAbsentMutation.isPending ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <UserX className="mr-1 h-3 w-3" /> Mark Absent
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Monthly Summary */}
      {activeTab === "summary" && (
        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold text-slate-700">Employee</TableHead>
                  <TableHead className="font-bold text-slate-700 text-center">Days Marked</TableHead>
                  <TableHead className="font-bold text-emerald-700 text-center">Present</TableHead>
                  <TableHead className="font-bold text-rose-600 text-center">Absent</TableHead>
                  <TableHead className="font-bold text-slate-700 text-center">Attendance %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaryLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : summaryData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-sm text-slate-500">
                      No data for {selectedMonth}
                    </TableCell>
                  </TableRow>
                ) : (
                  summaryData.map((row) => {
                    const pct =
                      row.totalMarked > 0
                        ? Math.round((row.presentDays / row.totalMarked) * 100)
                        : 0;
                    return (
                      <TableRow key={row.employeeId}>
                        <TableCell>
                          <div className="font-bold text-slate-900">{row.employeeName}</div>
                          <div className="text-xs text-slate-400">{row.employeeZone}</div>
                        </TableCell>
                        <TableCell className="text-center text-sm font-medium text-slate-600">
                          {row.totalMarked}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" /> {row.presentDays}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold bg-rose-50 text-rose-700">
                            <CalendarX2 className="h-3 w-3" /> {row.absentDays}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`text-sm font-black ${pct >= 80 ? "text-emerald-600" : pct >= 60 ? "text-amber-600" : "text-rose-600"}`}>
                              {row.totalMarked > 0 ? `${pct}%` : "—"}
                            </span>
                            {row.totalMarked > 0 && (
                              <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-rose-500"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Selfie Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <div className="relative max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxSrc(null)}
              className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg hover:bg-slate-100 transition"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={lightboxSrc}
              alt="Employee check-in selfie"
              className="w-full rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
