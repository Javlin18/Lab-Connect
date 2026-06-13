"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FlaskConical,
  IndianRupee,
  TrendingUp,
  Users,
  Zap,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";

import { listAppointments } from "@/api/appointments";
import { getFeedbackAlerts, getFeedbackLeaderboard } from "@/api/feedback";
import { listAllOrders } from "@/api/orders";
import { listUsers } from "@/api/users";
import { StatusBadge } from "@/components/app/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const appointmentsQ = useQuery({ queryKey: ["appointments", "dashboard"], queryFn: () => listAppointments() });
  const ordersQ        = useQuery({ queryKey: ["admin-orders"],              queryFn: listAllOrders });
  const patientsQ      = useQuery({ queryKey: ["users", "patients"],         queryFn: () => listUsers("patient") });
  const employeesQ     = useQuery({ queryKey: ["users", "employees"],        queryFn: () => listUsers("employee") });
  const alertsQ        = useQuery({ queryKey: ["feedback-alerts"],           queryFn: getFeedbackAlerts });
  const leaderQ        = useQuery({ queryKey: ["feedback-leaderboard"],      queryFn: getFeedbackLeaderboard });

  const appointments = appointmentsQ.data?.data ?? [];
  const orders       = ordersQ.data?.data ?? [];
  const patients     = patientsQ.data?.data ?? [];
  const employees    = employeesQ.data?.data ?? [];
  const alerts       = alertsQ.data?.data ?? [];
  const leaderboard  = leaderQ.data?.data ?? [];

  const todayAlerts  = alerts.filter((a) => {
    const d = new Date(a.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const todayReviews = leaderboard.reduce((s, e) => s + e.totalFeedbackCount, 0); // approximate
  const overallAvg   = leaderboard.filter(e => e.totalFeedbackCount > 0).reduce((s, e, _, arr) => s + e.averageRating / arr.length, 0);

  const pending    = appointments.filter((a) => a.status === "pending").length;
  const assigned   = appointments.filter((a) => a.status === "assigned").length;
  const processing = appointments.filter((a) => a.status === "processing").length;
  const completed  = appointments.filter((a) => a.status === "completed").length;
  const revenue    = orders.filter((o) => o.paymentStatus === "paid").reduce((s, o) => s + o.totalAmount, 0);

  const stats = [
    { label: "Total Appointments", value: appointments.length, icon: CalendarDays,  color: "bg-blue-50 text-blue-600",    trend: "All time" },
    { label: "Pending",            value: pending,             icon: Clock3,         color: "bg-amber-50 text-amber-600",  trend: "Need action" },
    { label: "Assigned",           value: assigned,            icon: Zap,            color: "bg-indigo-50 text-indigo-600",trend: "In progress" },
    { label: "Completed",          value: completed,           icon: CheckCircle2,   color: "bg-emerald-50 text-emerald-600", trend: "Done" },
    { label: "Revenue",            value: `₹${revenue.toLocaleString("en-IN")}`, icon: IndianRupee, color: "bg-green-50 text-green-600", trend: "Paid orders" },
    { label: "Patients",           value: patients.length,     icon: Users,          color: "bg-purple-50 text-purple-600",trend: "Registered" },
    { label: "Employees",          value: employees.length,    icon: Activity,       color: "bg-rose-50 text-rose-600",   trend: "Active staff" },
    { label: "Processing",         value: processing,          icon: FlaskConical,   color: "bg-cyan-50 text-cyan-600",   trend: "At lab" },
  ];

  const recent = [...appointments].reverse().slice(0, 8);

  // Status distribution for mini chart
  const statusDist = [
    { label: "Pending",    count: pending,    color: "bg-amber-400",   w: (pending / (appointments.length || 1)) * 100 },
    { label: "Assigned",   count: assigned,   color: "bg-indigo-500",  w: (assigned / (appointments.length || 1)) * 100 },
    { label: "Processing", count: processing, color: "bg-cyan-500",    w: (processing / (appointments.length || 1)) * 100 },
    { label: "Completed",  count: completed,  color: "bg-emerald-500", w: (completed / (appointments.length || 1)) * 100 },
  ];

  const loading = appointmentsQ.isLoading || ordersQ.isLoading;

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">Lab Connect — Admin Overview</p>
        </div>
        <Link
          className={buttonVariants({ className: "h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 gap-1.5" })}
          href="/admin/appointments/new"
        >
          + New Appointment
        </Link>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton className="h-28 rounded-2xl" key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition" key={s.label}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">{s.value}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{s.trend}</p>
                  </div>
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Status distribution bar */}
      {!loading && appointments.length > 0 && (
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="px-5 py-4 border-b border-slate-50">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" /> Appointment Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
              {statusDist.map((s) => (
                s.count > 0 ? (
                  <div
                    className={`${s.color} rounded-full transition-all`}
                    key={s.label}
                    style={{ width: `${s.w}%` }}
                    title={`${s.label}: ${s.count}`}
                  />
                ) : null
              ))}
            </div>
            <div className="flex flex-wrap gap-4 mt-4">
              {statusDist.map((s) => (
                <div className="flex items-center gap-1.5" key={s.label}>
                  <div className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
                  <span className="text-xs text-slate-600 font-medium">{s.label}</span>
                  <span className="text-xs text-slate-400 font-bold">({s.count})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent activity + Quick links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent appointments */}
        <div className="lg:col-span-2">
          <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="px-5 py-4 border-b border-slate-50 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-800">Recent Appointments</CardTitle>
              <Link className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1" href="/admin/appointments">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-3 p-5">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton className="h-10" key={i} />)}
                </div>
              ) : recent.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-sm text-slate-400">
                  No appointments yet
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {recent.map((a) => (
                    <div className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition" key={a.id}>
                      <div>
                        <p className="text-xs font-bold text-slate-800 font-mono">{a.id.slice(0, 10)}…</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{a.testTypes.slice(0, 2).join(", ")}{a.testTypes.length > 2 ? "…" : ""}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-[10px] text-slate-400 hidden sm:block">{a.slot?.split(" ")[0]}</p>
                        <StatusBadge status={a.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="px-5 py-4 border-b border-slate-50">
              <CardTitle className="text-sm font-bold text-slate-800">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {[
                { label: "New Appointment",  href: "/admin/appointments/new", color: "bg-blue-600 hover:bg-blue-700 text-white" },
                { label: "Manage Employees", href: "/admin/employees",        color: "bg-slate-800 hover:bg-slate-900 text-white" },
                { label: "Upload Report",    href: "/admin/reports",          color: "bg-emerald-600 hover:bg-emerald-700 text-white" },
                { label: "View Orders",      href: "/admin/orders",           color: "bg-purple-600 hover:bg-purple-700 text-white" },
                { label: "Send Notification",href: "/admin/notifications",    color: "bg-amber-500 hover:bg-amber-600 text-white" },
                { label: "View Feedback",    href: "/admin/feedback",         color: "bg-rose-500 hover:bg-rose-600 text-white" },
              ].map((action) => (
                <Link
                  className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-xs font-bold transition ${action.color}`}
                  href={action.href}
                  key={action.label}
                >
                  {action.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Revenue card */}
          <Card className="rounded-2xl border-slate-200 shadow-sm bg-gradient-to-br from-blue-600 to-blue-700 text-white overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <IndianRupee className="h-4 w-4 text-blue-200" />
                <p className="text-xs font-semibold text-blue-200">Total Revenue</p>
              </div>
              <p className="text-3xl font-black">₹{revenue.toLocaleString("en-IN")}</p>
              <p className="text-xs text-blue-200 mt-1">{orders.filter((o) => o.paymentStatus === "paid").length} paid orders</p>
              <Link className="mt-4 flex items-center gap-1 text-xs font-bold text-blue-200 hover:text-white transition" href="/admin/orders">
                View Orders <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>

          {/* Feedback widget */}
          <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-amber-500" />
                <p className="text-xs font-semibold text-slate-500">Feedback Summary</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900">
                  {overallAvg > 0 ? overallAvg.toFixed(1) : "—"}
                </span>
                <span className="text-base text-amber-400">★</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{todayReviews} total reviews</p>
              {todayAlerts.length > 0 && (
                <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                  <AlertTriangle className="inline-block h-3 w-3" /> {todayAlerts.length} alerts today
                </div>
              )}
              <Link className="mt-3 flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline" href="/admin/feedback">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
