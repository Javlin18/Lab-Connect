"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, Shield, Star, ThumbsUp, Users } from "lucide-react";
import Link from "next/link";

import { getFeedbackAlerts, getFeedbackLeaderboard } from "@/api/feedback";
import { RatingStars } from "@/components/admin/RatingStars";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function complianceColor(pct: number) {
  if (pct >= 90) return "text-green-600 bg-green-50";
  if (pct >= 70) return "text-orange-600 bg-orange-50";
  return "text-red-600 bg-red-50";
}

export default function FeedbackOverviewPage() {
  const alertsQ = useQuery({ queryKey: ["feedback-alerts"], queryFn: getFeedbackAlerts });
  const leaderQ = useQuery({ queryKey: ["feedback-leaderboard"], queryFn: getFeedbackLeaderboard });

  const alerts = alertsQ.data?.data ?? [];
  const leaderboard = leaderQ.data?.data ?? [];

  const allRatings = leaderboard.flatMap((e) =>
    e.totalFeedbackCount > 0 ? [e.averageRating] : []
  );
  const overallAvg =
    allRatings.length > 0
      ? allRatings.reduce((s, r) => s + r, 0) / allRatings.length
      : 0;

  const totalReviews = leaderboard.reduce((s, e) => s + e.totalFeedbackCount, 0);

  const gloveAlerts = alerts.filter((a) => !a.woreGloves).length;
  const gloveCompliance =
    totalReviews > 0
      ? Math.round(((totalReviews - gloveAlerts) / totalReviews) * 100)
      : 100;

  const loading = alertsQ.isLoading || leaderQ.isLoading;

  const stats = [
    {
      label: "Average Rating",
      value: overallAvg > 0 ? overallAvg.toFixed(1) : "—",
      suffix: "★",
      icon: Star,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Total Feedback",
      value: totalReviews,
      suffix: " reviews",
      icon: ThumbsUp,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Glove Compliance",
      value: `${gloveCompliance}%`,
      suffix: "",
      icon: Shield,
      color:
        gloveCompliance >= 90
          ? "text-green-600 bg-green-50"
          : gloveCompliance >= 70
          ? "text-orange-600 bg-orange-50"
          : "text-red-600 bg-red-50",
    },
    {
      label: "Needs Attention",
      value: alerts.length,
      suffix: " alerts",
      icon: AlertTriangle,
      color: alerts.length > 0 ? "text-red-600 bg-red-50" : "text-slate-400 bg-slate-50",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Feedback"
        description="Patient ratings and hygiene compliance"
      />

      {/* ── Stats ── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton className="h-28 rounded-2xl" key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card className="rounded-2xl border-slate-200 shadow-sm" key={s.label}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">
                      {s.value}
                      {s.suffix && (
                        <span className="text-sm font-semibold text-slate-400 ml-0.5">
                          {s.suffix}
                        </span>
                      )}
                    </p>
                    {s.label === "Needs Attention" && alerts.length > 0 && (
                      <span className="text-[10px] font-bold text-red-500 mt-0.5 block">
                        Requires review
                      </span>
                    )}
                  </div>
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}
                  >
                    <s.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Needs Attention ── */}
      {alerts.length > 0 && (
        <Card className="rounded-2xl border-red-200 shadow-sm">
          <CardHeader className="px-5 py-4 border-b border-red-50">
            <CardTitle className="text-sm font-bold text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Needs Attention ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {alerts.slice(0, 10).map((alert) => (
              <div
                key={alert.id}
                className="border-l-4 border-red-500 bg-red-50 rounded-xl px-4 py-3 flex items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-slate-800">
                      {alert.employeeName ?? "Unknown employee"}
                    </span>
                    <RatingStars rating={alert.overallRating} size="sm" showNumber />
                    {!alert.woreGloves && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                        No gloves
                      </span>
                    )}
                    {!alert.woreMask && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                        No mask
                      </span>
                    )}
                  </div>
                  {alert.comment && (
                    <p className="text-xs text-slate-500 mt-1 truncate">
                      "{alert.comment}"
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">
                    {alert.patientFirstName} •{" "}
                    {new Date(alert.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    • #{alert.appointmentId.slice(0, 8)}
                  </p>
                </div>
                {alert.employeeId && (
                  <Link
                    href={`/admin/employees/${alert.employeeId}/feedback`}
                    className="text-xs font-bold text-blue-600 hover:underline whitespace-nowrap flex items-center gap-1"
                  >
                    Profile <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Leaderboard ── */}
      <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="px-5 py-4 border-b border-slate-50">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            Employee Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {leaderQ.isLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton className="h-10" key={i} />
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              No feedback yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                    <th className="px-5 py-3 text-left w-10">#</th>
                    <th className="px-5 py-3 text-left">Employee</th>
                    <th className="px-5 py-3 text-left">Avg Rating</th>
                    <th className="px-5 py-3 text-left">Reviews</th>
                    <th className="px-5 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {leaderboard.map((emp, idx) => (
                    <tr
                      key={emp.employeeId}
                      className="hover:bg-slate-50 transition"
                    >
                      <td className="px-5 py-3">
                        <span
                          className={`text-xs font-black ${
                            idx === 0
                              ? "text-amber-500"
                              : idx === 1
                              ? "text-slate-400"
                              : idx === 2
                              ? "text-orange-400"
                              : "text-slate-300"
                          }`}
                        >
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-[10px] flex-shrink-0">
                            {emp.name
                              .split(" ")
                              .map((w) => w[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-800 text-xs">
                            {emp.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {emp.totalFeedbackCount > 0 ? (
                          <RatingStars
                            rating={emp.averageRating}
                            size="sm"
                            showNumber
                          />
                        ) : (
                          <span className="text-xs text-slate-300">No reviews</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-bold text-slate-600">
                          {emp.totalFeedbackCount}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/employees/${emp.employeeId}/feedback`}
                          className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          View <ArrowRight className="h-3 w-3" />
                        </Link>
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
