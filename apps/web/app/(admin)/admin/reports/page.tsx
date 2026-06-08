"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Download,
  FileText,
  Search,
  Upload,
  X
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { listAppointments } from "@/api/appointments";
import { getReport, uploadReport } from "@/api/reports";
import { listUsers } from "@/api/users";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function ReportsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const appointmentsQ = useQuery({
    queryKey: ["appointments", "reports"],
    queryFn: () => listAppointments(),
  });

  const patientsQ = useQuery({
    queryKey: ["users", "patients"],
    queryFn: () => listUsers("patient"),
  });

  const patientMap = useMemo(
    () => new Map((patientsQ.data?.data ?? []).map((u) => [u.id, u.name])),
    [patientsQ.data?.data]
  );

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!selectedId || !file) throw new Error("Missing data");
      return uploadReport(selectedId, file);
    },
    onSuccess: () => {
      toast({ title: "Report uploaded successfully" });
      setSelectedId(null);
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err: any) => {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    },
  });

  // Filter appointments that are collected or later
  const appointments = useMemo(() => {
    const all = appointmentsQ.data?.data ?? [];
    return all.filter((a) => {
      const relevantStatuses = ["collected", "processing", "completed"];
      const matchStatus = relevantStatuses.includes(a.status);
      const matchSearch =
        !search ||
        a.id.toLowerCase().includes(search.toLowerCase()) ||
        (patientMap.get(a.patientId) ?? "").toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [appointmentsQ.data?.data, search, patientMap]);

  const selectedAppointment = (appointmentsQ.data?.data ?? []).find((a) => a.id === selectedId);

  return (
    <div className="space-y-6">
      <PageHeader
        description="Upload PDF reports and manage patient test results."
        title="Reports"
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Collected",  count: (appointmentsQ.data?.data ?? []).filter((a) => a.status === "collected").length,  color: "text-amber-600 bg-amber-50" },
          { label: "Processing", count: (appointmentsQ.data?.data ?? []).filter((a) => a.status === "processing").length, color: "text-blue-600 bg-blue-50" },
          { label: "Completed",  count: (appointmentsQ.data?.data ?? []).filter((a) => a.status === "completed").length,  color: "text-emerald-600 bg-emerald-50" },
        ].map((s) => (
          <Card className="rounded-2xl border-slate-200 shadow-sm" key={s.label}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className="text-2xl font-black text-slate-900">{s.count}</p>
              </div>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${s.color}`}>
                <FileText className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upload modal */}
      {selectedId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <Card className="w-full max-w-md rounded-3xl shadow-2xl bg-white">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Upload Report</h3>
              <Button className="h-8 w-8 p-0 rounded-full text-slate-400" onClick={() => { setSelectedId(null); setFile(null); }} variant="ghost">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              {selectedAppointment && (
                <div className="bg-slate-50 rounded-xl p-4 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Appointment ID</span>
                    <span className="font-bold text-slate-700">{selectedAppointment.id.slice(0, 10)}…</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Patient</span>
                    <span className="font-bold text-slate-700">{patientMap.get(selectedAppointment.patientId) ?? "Unknown"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tests</span>
                    <span className="font-bold text-slate-700">{selectedAppointment.testTypes.join(", ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status</span>
                    <StatusBadge status={selectedAppointment.status} />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Report PDF / Image *</Label>
                <div
                  className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition"
                  onClick={() => fileRef.current?.click()}
                >
                  {file ? (
                    <div className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-600">
                      <CheckCircle2 className="h-5 w-5" />
                      {file.name}
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-medium">Click to upload PDF or image</p>
                      <p className="text-[10px] text-slate-400 mt-1">PDF, PNG, JPG up to 10MB</p>
                    </>
                  )}
                  <input
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    ref={fileRef}
                    type="file"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  disabled={!file || uploadMutation.isPending}
                  onClick={() => uploadMutation.mutate()}
                >
                  {uploadMutation.isPending ? "Uploading…" : "Upload Report"}
                </Button>
                <Button className="rounded-xl" onClick={() => { setSelectedId(null); setFile(null); }} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Table */}
      <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9 rounded-xl h-9 text-sm"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient or booking ID…"
              value={search}
            />
          </div>
        </div>

        <CardContent className="p-0">
          {appointmentsQ.isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton className="h-10" key={i} />)}
            </div>
          ) : appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <FileText className="h-10 w-10 mb-3 text-slate-300" />
              <p className="text-sm font-medium">No collected appointments yet</p>
              <p className="text-xs mt-1">Reports can be uploaded once sample is collected</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    <th className="px-5 py-3">Booking ID</th>
                    <th className="px-5 py-3">Patient</th>
                    <th className="px-5 py-3">Tests</th>
                    <th className="px-5 py-3">Slot</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Report</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {appointments.map((a) => (
                    <tr className="hover:bg-slate-50/60 transition" key={a.id}>
                      <td className="px-5 py-3 font-mono text-xs text-slate-500">{a.id.slice(0, 10)}…</td>
                      <td className="px-5 py-3 font-semibold text-slate-800">
                        {patientMap.get(a.patientId) ?? a.patientId.slice(0, 8)}
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{a.testTypes.slice(0, 2).join(", ")}</td>
                      <td className="px-5 py-3 text-slate-400 text-xs">{a.slot?.split(" ")[0]}</td>
                      <td className="px-5 py-3"><StatusBadge status={a.status} /></td>
                      <td className="px-5 py-3">
                        {a.status === "completed" ? (
                          <button
                            className="flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline"
                            onClick={async () => {
                              try {
                                const r = await getReport(a.id);
                                window.open(r.data.downloadUrl, "_blank", "noopener");
                              } catch {
                                //
                              }
                            }}
                            type="button"
                          >
                            <Download className="h-3.5 w-3.5" /> Download
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400">Not uploaded</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <Button
                          className="h-7 px-3 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => setSelectedId(a.id)}
                        >
                          <Upload className="h-3 w-3 mr-1" /> Upload
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
