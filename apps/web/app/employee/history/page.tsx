"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, History, MapPin, TestTube2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";

import { getAssignedAppointments } from "@/api/employee";
import { EmployeeShell } from "@/components/app/employee-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function HistoryPage() {
  const { data: session } = useSession();
  const [period, setPeriod] = useState<"today" | "week" | "all">("today");

  const assignedQ = useQuery({ queryKey: ["employee", "assigned"], queryFn: getAssignedAppointments });

  const all = assignedQ.data?.data ?? [];

  const history = useMemo(() => {
    const done = all.filter((a) => ["completed", "collected", "processing"].includes(a.status));
    const now = new Date();
    if (period === "today") {
      const todayStr = now.toISOString().split("T")[0];
      return done.filter((a) => a.slot?.startsWith(todayStr));
    }
    if (period === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return done.filter((a) => new Date(a.updatedAt ?? a.createdAt) >= weekAgo);
    }
    return done;
  }, [all, period]);

  const completedCount = all.filter((a) => a.status === "completed").length;
  const collectedCount = all.filter((a) => a.status === "collected").length;

  return (
    <EmployeeShell userName={session?.user?.name}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-black text-slate-900">Collection History</h1>
          <p className="text-xs text-slate-500 mt-0.5">Your past sample collections</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Total Completed", value: completedCount, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
            { label: "Total Collected", value: collectedCount + completedCount, icon: TestTube2, color: "text-blue-600 bg-blue-50" },
          ].map((s) => (
            <Card className="rounded-2xl border-slate-200 shadow-sm" key={s.label}>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className="text-2xl font-black text-slate-900">{s.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Period filter */}
        <div className="flex gap-2">
          {(["today", "week", "all"] as const).map((p) => (
            <button
              className={`h-8 px-4 rounded-xl text-xs font-semibold transition border ${
                period === p ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-500 border-slate-200 hover:border-emerald-300"
              }`}
              key={p}
              onClick={() => setPeriod(p)}
              type="button"
            >
              {p === "today" ? "Today" : p === "week" ? "This Week" : "All Time"}
            </button>
          ))}
        </div>

        {/* List */}
        {assignedQ.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton className="h-24 rounded-2xl" key={i} />)}
          </div>
        ) : history.length === 0 ? (
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400">
              <History className="h-10 w-10 mb-3 text-slate-300" />
              <p className="text-sm font-medium">No collections in this period</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {history.map((a) => (
              <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden" key={a.id}>
                <div className="h-1 bg-emerald-400" />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800 text-sm">{a.patient?.name ?? "Patient"}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          a.status === "completed" ? "bg-emerald-50 text-emerald-700" :
                          a.status === "processing" ? "bg-purple-50 text-purple-700" :
                          "bg-cyan-50 text-cyan-700"
                        }`}>{a.status}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {a.testTypes.map((t) => (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full" key={t}>{t}</span>
                        ))}
                      </div>
                      <p className="flex items-center gap-1.5 text-xs text-slate-400">
                        <MapPin className="h-3 w-3" />
                        {a.address}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-mono text-slate-400">{a.id.slice(0, 8)}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{a.slot?.split(" ")[0]}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </EmployeeShell>
  );
}
