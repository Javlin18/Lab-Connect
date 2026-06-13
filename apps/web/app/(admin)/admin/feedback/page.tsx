"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, MessageSquareText, Shield, Star, ThumbsUp, Users } from "lucide-react";
import Link from "next/link";

import { getAllFeedback, getFeedbackAlerts, getFeedbackLeaderboard } from "@/api/feedback";
import { RatingStars } from "@/components/admin/RatingStars";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function FeedbackOverviewPage() {
  const alertsQ = useQuery({ queryKey: ["feedback-alerts"], queryFn: getFeedbackAlerts });
  const leaderQ = useQuery({ queryKey: ["feedback-leaderboard"], queryFn: getFeedbackLeaderboard });
  const allFeedbackQ = useQuery({
    queryKey: ["feedback-all", "overview"],
    queryFn: () => getAllFeedback({ limit: 50 }),
  });

  const alerts = alertsQ.data?.data ?? [];
  const leaderboard = leaderQ.data?.data ?? [];
  const feedbackList = allFeedbackQ.data?.data ?? [];

  const allRatings = feedbackList.length
    ? feedbackList.map((feedback) => feedback.overallRating)
    : leaderboard.flatMap((entry) => (entry.totalFeedbackCount > 0 ? [entry.averageRating] : []));
  const overallAvg = allRatings.length ? allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length : 0;
  const totalReviews = feedbackList.length || leaderboard.reduce((sum, entry) => sum + entry.totalFeedbackCount, 0);

  const gloveFailures = feedbackList.filter((feedback) => !feedback.woreGloves).length || alerts.filter((alert) => !alert.woreGloves).length;
  const gloveCompliance = totalReviews > 0 ? Math.round(((totalReviews - gloveFailures) / totalReviews) * 100) : 100;
  const loading = alertsQ.isLoading || leaderQ.isLoading || allFeedbackQ.isLoading;

  const stats = [
    {
      label: "Average Rating",
      value: overallAvg > 0 ? overallAvg.toFixed(1) : "-",
      suffix: " stars",
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
      color: gloveCompliance >= 90 ? "text-green-600 bg-green-50" : gloveCompliance >= 70 ? "text-orange-600 bg-orange-50" : "text-red-600 bg-red-50",
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
        description="Patient ratings, comments, and hygiene compliance"
      />

      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton className="h-28 rounded-2xl" key={index} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card className="rounded-2xl border-slate-200 shadow-sm" key={stat.label}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                    <p className="mt-1 text-2xl font-black text-slate-900">
                      {stat.value}
                      {stat.suffix ? <span className="ml-0.5 text-sm font-semibold text-slate-400">{stat.suffix}</span> : null}
                    </p>
                    {stat.label === "Needs Attention" && alerts.length > 0 ? (
                      <span className="mt-0.5 block text-[10px] font-bold text-red-500">Requires review</span>
                    ) : null}
                  </div>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {alerts.length > 0 ? (
        <Card className="rounded-2xl border-red-200 shadow-sm">
          <CardHeader className="border-b border-red-50 px-5 py-4">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-red-700">
              <AlertTriangle className="h-4 w-4" />
              Needs Attention ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {alerts.slice(0, 10).map((alert) => (
              <div className="flex items-start justify-between gap-4 rounded-xl border-l-4 border-red-500 bg-red-50 px-4 py-3" key={alert.id}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">{alert.employeeName ?? "Unknown employee"}</span>
                    <RatingStars rating={alert.overallRating} size="sm" showNumber />
                    {!alert.woreGloves ? <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">No gloves</span> : null}
                    {!alert.woreMask ? <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">No mask</span> : null}
                  </div>
                  {alert.comment ? <p className="mt-1 truncate text-xs text-slate-500">"{alert.comment}"</p> : null}
                  <p className="mt-1 text-[10px] text-slate-400">
                    {alert.patientFirstName || "Unknown"} | {new Date(alert.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} | #{alert.appointmentId.slice(0, 8)}
                  </p>
                </div>
                {alert.employeeId ? (
                  <Link className="flex items-center gap-1 whitespace-nowrap text-xs font-bold text-blue-600 hover:underline" href={`/admin/employees/${alert.employeeId}/feedback`}>
                    Profile <ArrowRight className="h-3 w-3" />
                  </Link>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-50 px-5 py-4">
          <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <MessageSquareText className="h-4 w-4 text-emerald-600" />
            All Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {allFeedbackQ.isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton className="h-20 rounded-xl" key={index} />
              ))}
            </div>
          ) : feedbackList.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">No feedback found</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {feedbackList.map((feedback) => (
                <div className="px-5 py-4" key={feedback.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">{feedback.employeeName ?? "Unknown employee"}</span>
                        <RatingStars rating={feedback.overallRating} size="sm" showNumber />
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                          #{feedback.appointmentId.slice(0, 8)}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Patient: {feedback.patientFirstName || "Unknown"} | {new Date(feedback.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      {feedback.comment ? <p className="mt-2 text-sm text-slate-600">"{feedback.comment}"</p> : null}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${feedback.woreGloves ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                        Gloves {feedback.woreGloves ? "Yes" : "No"}
                      </span>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${feedback.woreMask ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                        Mask {feedback.woreMask ? "Yes" : "No"}
                      </span>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${feedback.wasPunctual ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        Punctual {feedback.wasPunctual ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-50 px-5 py-4">
          <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Users className="h-4 w-4 text-blue-500" />
            Employee Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {leaderQ.isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton className="h-10" key={index} />
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">No employee feedback summary yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="w-10 px-5 py-3 text-left">#</th>
                    <th className="px-5 py-3 text-left">Employee</th>
                    <th className="px-5 py-3 text-left">Avg Rating</th>
                    <th className="px-5 py-3 text-left">Reviews</th>
                    <th className="px-5 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {leaderboard.map((employee, index) => (
                    <tr className="transition hover:bg-slate-50" key={employee.employeeId}>
                      <td className="px-5 py-3">
                        <span className="text-xs font-black text-slate-400">{index + 1}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-[10px] font-black text-white">
                            {employee.name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-xs font-semibold text-slate-800">{employee.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {employee.totalFeedbackCount > 0 ? <RatingStars rating={employee.averageRating} size="sm" showNumber /> : <span className="text-xs text-slate-300">No reviews</span>}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-bold text-slate-600">{employee.totalFeedbackCount}</span>
                      </td>
                      <td className="px-5 py-3">
                        <Link className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline" href={`/admin/employees/${employee.employeeId}/feedback`}>
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
