"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { getAllFeedback, getEmployeeFeedbackStats } from "@/api/feedback";
import { ComplianceDonut } from "@/components/admin/ComplianceDonut";
import { RatingStars } from "@/components/admin/RatingStars";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const RATING_COLORS: Record<number, string> = {
  5: "#22C55E",
  4: "#86EFAC",
  3: "#FCD34D",
  2: "#F97316",
  1: "#EF4444",
};

function BoolIcon({ value }: { value: boolean }) {
  return value ? (
    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
  ) : (
    <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
  );
}

function compPct(pct: number) {
  const cls =
    pct >= 90
      ? "text-green-600 bg-green-50"
      : pct >= 70
      ? "text-orange-600 bg-orange-50"
      : "text-red-600 bg-red-50";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${cls}`}>
      {pct}%
    </span>
  );
}

export default function EmployeeFeedbackDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id: employeeId } = params;

  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const statsQ = useQuery({
    queryKey: ["employee-feedback-stats", employeeId],
    queryFn: () => getEmployeeFeedbackStats(employeeId),
  });

  const allQ = useQuery({
    queryKey: ["employee-feedback-all", employeeId, ratingFilter, dateFrom, dateTo, page],
    queryFn: () =>
      getAllFeedback({
        employeeId,
        minRating:
          ratingFilter === "low" ? 1 : ratingFilter !== "all" ? Number(ratingFilter) : undefined,
        maxRating:
          ratingFilter === "low" ? 2 : ratingFilter !== "all" ? Number(ratingFilter) : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        limit: 15,
      }),
  });

  const stats = statsQ.data?.data;
  const feedbackList = (allQ.data?.data ?? []) as any[];
  const meta = (allQ.data as any)?.meta ?? { total: 0, totalPages: 1 };

  const barData = stats
    ? [
        { star: "5★", count: stats.ratingBreakdown["5star"], fill: RATING_COLORS[5] },
        { star: "4★", count: stats.ratingBreakdown["4star"], fill: RATING_COLORS[4] },
        { star: "3★", count: stats.ratingBreakdown["3star"], fill: RATING_COLORS[3] },
        { star: "2★", count: stats.ratingBreakdown["2star"], fill: RATING_COLORS[2] },
        { star: "1★", count: stats.ratingBreakdown["1star"], fill: RATING_COLORS[1] },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* ── Back ── */}
      <Link
        href="/admin/employees"
        className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Employees
      </Link>

      {/* ── Employee Header ── */}
      {statsQ.isLoading ? (
        <Skeleton className="h-24 rounded-2xl" />
      ) : stats ? (
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg flex-shrink-0">
              {stats.employee.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-black text-slate-900">{stats.employee.name}</h1>
              <p className="text-xs text-slate-400 mt-0.5">{stats.employee.email}</p>
              <p className="text-[10px] text-slate-300 font-mono mt-0.5">ID: {employeeId}</p>
            </div>
            {stats.averageRating > 0 && (
              <RatingStars rating={stats.averageRating} size="lg" showNumber />
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* ── Stats Grid ── */}
      {statsQ.isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton className="h-24 rounded-2xl" key={i} />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Average Rating", value: stats.averageRating.toFixed(2), suffix: " ★" },
            { label: "Total Reviews", value: stats.totalFeedbackCount, suffix: "" },
            { label: "Glove Compliance", value: `${stats.hygieneComplianceRate}%`, suffix: "" },
            { label: "Punctuality Rate", value: `${stats.punctualityRate}%`, suffix: "" },
          ].map((s) => (
            <Card key={s.label} className="rounded-2xl border-slate-200 shadow-sm">
              <CardContent className="p-5">
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {s.value}
                  <span className="text-sm font-semibold text-slate-400">{s.suffix}</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {/* ── Charts Row ── */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rating breakdown bar chart */}
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="px-5 py-4 border-b border-slate-50">
              <CardTitle className="text-sm font-bold text-slate-800">
                Rating Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={barData} layout="vertical" margin={{ left: 4, right: 16 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="star"
                    width={28}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(v: any) => [v, "Ratings"]}
                    cursor={{ fill: "#F1F5F9" }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {barData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Compliance donuts */}
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="px-5 py-4 border-b border-slate-50">
              <CardTitle className="text-sm font-bold text-slate-800">
                Compliance Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex items-center justify-around gap-4 flex-wrap">
              <ComplianceDonut
                percentage={stats.hygieneComplianceRate}
                label="Gloves & Mask"
              />
              <ComplianceDonut
                percentage={stats.punctualityRate}
                label="Punctuality"
                colorYes="#3B82F6"
                colorNo="#DBEAFE"
              />
              <ComplianceDonut
                percentage={stats.professionalismRate}
                label="Professionalism"
                colorYes="#8B5CF6"
                colorNo="#EDE9FE"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Filter Bar ── */}
      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Rating
            </label>
            <select
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={ratingFilter}
              onChange={(e) => { setRatingFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All Ratings</option>
              <option value="5">5★ only</option>
              <option value="4">4★ only</option>
              <option value="3">3★ only</option>
              <option value="2">2★ only</option>
              <option value="1">1★ only</option>
              <option value="low">Low ratings (1–2★)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              From
            </label>
            <input
              type="date"
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              To
            </label>
            <input
              type="date"
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            />
          </div>
          {(ratingFilter !== "all" || dateFrom || dateTo) && (
            <button
              className="text-xs text-slate-400 hover:text-red-500 underline self-end pb-2"
              onClick={() => { setRatingFilter("all"); setDateFrom(""); setDateTo(""); setPage(1); }}
            >
              Clear filters
            </button>
          )}
        </CardContent>
      </Card>

      {/* ── Feedback Table ── */}
      <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="px-5 py-4 border-b border-slate-50 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-800">
            Feedback Entries
          </CardTitle>
          <span className="text-xs text-slate-400">{meta.total} total</span>
        </CardHeader>
        <CardContent className="p-0">
          {allQ.isLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton className="h-10" key={i} />
              ))}
            </div>
          ) : feedbackList.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">No feedback found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Patient</th>
                    <th className="px-4 py-3 text-left">Rating</th>
                    <th className="px-4 py-3 text-center">Gloves</th>
                    <th className="px-4 py-3 text-center">Mask</th>
                    <th className="px-4 py-3 text-center">Punctual</th>
                    <th className="px-4 py-3 text-center">Pro</th>
                    <th className="px-4 py-3 text-left">Comment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {feedbackList.map((f) => (
                    <tr
                      key={f.id}
                      className={f.overallRating <= 2 ? "bg-red-50/60" : "hover:bg-slate-50"}
                    >
                      <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                        {new Date(f.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-slate-700">
                        {f.patientFirstName}
                      </td>
                      <td className="px-4 py-2.5">
                        <RatingStars rating={f.overallRating} size="sm" showNumber />
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <BoolIcon value={f.woreGloves} />
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <BoolIcon value={f.woreMask} />
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <BoolIcon value={f.wasPunctual} />
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <BoolIcon value={f.wasProfessional} />
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 max-w-[200px]">
                        {f.comment ? (
                          <span title={f.comment}>
                            {f.comment.length > 50
                              ? `${f.comment.slice(0, 50)}…`
                              : f.comment}
                          </span>
                        ) : (
                          <span className="text-slate-300 italic">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-50">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="text-xs font-bold text-blue-600 disabled:text-slate-300 hover:underline"
              >
                ← Prev
              </button>
              <span className="text-xs text-slate-400">
                Page {page} of {meta.totalPages}
              </span>
              <button
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="text-xs font-bold text-blue-600 disabled:text-slate-300 hover:underline"
              >
                Next →
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
