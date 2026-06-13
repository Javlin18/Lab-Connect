"use client";

import type { Appointment } from "@lab-app/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isSameMonth, parseISO, startOfMonth } from "date-fns";
import {
  Activity,
  AlertTriangle,
  AreaChart,
  Award,
  BadgeIndianRupee,
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarX2,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Star,
  TrendingDown,
  TrendingUp,
  Trophy,
  User2,
  Users,
<<<<<<< Updated upstream
  X,
  Zap,
  Star
=======
  WalletCards,
  X
>>>>>>> Stashed changes
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { listAppointments } from "@/api/appointments";
<<<<<<< Updated upstream
import { countEmployeeTasksForDate, listEmployees, updateEmployeeLocation } from "@/api/employees";
import { getFeedbackLeaderboard } from "@/api/feedback";
=======
import { type EmployeeRecord, listEmployees, updateEmployeeLocation } from "@/api/employees";
>>>>>>> Stashed changes
import { createEmployee } from "@/api/users";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const SAMPLE_REVENUE = 140;
const BASE_EARNINGS = 18000;
const PETROL_ALLOWANCE = 2500;
const TARGET_DAILY_SAMPLES = 8;
const today = new Date();
const todayKey = format(today, "yyyy-MM-dd");

type Icon = LucideIcon;

function money(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function pct(value: number) {
  return `${Math.round(value)}%`;
}

function safeDate(value: string) {
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? new Date(value) : parsed;
}

function appointmentDay(appointment: Appointment) {
  return appointment.slot?.slice(0, 10) || appointment.createdAt.slice(0, 10);
}

function isThisMonth(appointment: Appointment) {
  return isSameMonth(safeDate(appointmentDay(appointment)), today);
}

function workingDaysElapsed() {
  const start = startOfMonth(today);
  let count = 0;

  for (let date = new Date(start); date <= today; date.setDate(date.getDate() + 1)) {
    if (date.getDay() !== 0) count += 1;
  }

  return Math.max(count, 1);
}

function employeeAppointments(appointments: Appointment[], employeeUserId: string) {
  return appointments.filter((appointment) => appointment.employeeId === employeeUserId);
}

function employeeAnalytics(record: EmployeeRecord, appointments: Appointment[], revenueRank: number) {
  const all = employeeAppointments(appointments, record.user.id);
  const month = all.filter(isThisMonth);
  const todayAppointments = all.filter((appointment) => appointmentDay(appointment) === todayKey);

  const completed = month.filter((appointment) => appointment.status === "completed");
  const completedToday = todayAppointments.filter((appointment) => appointment.status === "completed");
  const pending = month.filter((appointment) => appointment.status === "pending" || appointment.status === "assigned");
  const active = month.filter((appointment) => !["completed", "pending"].includes(appointment.status));
  const cancelled = 0;

  const activeDays = new Set(month.map(appointmentDay)).size;
  const workDays = workingDaysElapsed();
  const presentDays = Math.min(activeDays, workDays);
  const leaveDays = Math.max(workDays - presentDays, 0);
  const absentDays = leaveDays;
  const lateArrivals = Math.max(0, Math.floor(active.length / 9));
  const attendancePercentage = workDays ? (presentDays / workDays) * 100 : 0;

  const monthlySamples = completed.length;
  const todaySamples = completedToday.length;
  const monthlyRevenue = monthlySamples * SAMPLE_REVENUE;
  const todayRevenue = todaySamples * SAMPLE_REVENUE;
  const averageSamplesPerDay = presentDays ? monthlySamples / presentDays : 0;
  const expectedDailySamples = Math.max(TARGET_DAILY_SAMPLES, Math.round(averageSamplesPerDay));
  const revenueLost = leaveDays * expectedDailySamples * SAMPLE_REVENUE;
  const potentialRevenue = monthlyRevenue + revenueLost;

  const incentives = monthlySamples * 25;
  const starRatingBonus = monthlySamples >= 120 ? 1500 : monthlySamples >= 80 ? 900 : monthlySamples >= 40 ? 400 : 0;
  const referralBonus = monthlySamples >= 100 ? 750 : 0;
  const deductions = absentDays * 300 + lateArrivals * 100;
  const netEarnings = BASE_EARNINGS + incentives + PETROL_ALLOWANCE + starRatingBonus + referralBonus - deductions;

  const completionRate = month.length ? (completed.length / month.length) * 100 : 0;
  const acceptanceRate = month.length ? (all.length / month.length) * 100 : 0;
  const cancellationRate = month.length ? (cancelled / month.length) * 100 : 0;
  const customerRating = Math.min(5, 4.1 + Math.min(monthlySamples, 90) / 100);
  const status = leaveDays > 2 && !record.employee.isAvailable ? "On Leave" : record.employee.isAvailable ? "Free" : "Busy";

  return {
    absentDays,
    acceptanceRate,
    activeBookings: active.length,
    activeAppointments: active,
    attendancePercentage,
    averageSamplesPerDay,
    cancellationRate,
    cancelledBookings: cancelled,
    completedBookings: completed.length,
    completionRate,
    customerRating,
    deductions,
    expectedDailySamples,
    incentives,
    lateArrivals,
    leaveDays,
    monthlyRevenue,
    monthlySamples,
    netEarnings,
    pendingBookings: pending.length,
    petrolAllowance: PETROL_ALLOWANCE,
    potentialRevenue,
    presentDays,
    rank: revenueRank,
    referralBonus,
    revenueLost,
    starRatingBonus,
    status,
    todayRevenue,
    todaySamples,
    totalBookings: month.length
  };
}

function statusStyles(status: string) {
  if (status === "Free") return "border-emerald-100 bg-emerald-50 text-emerald-700";
  if (status === "On Leave") return "border-rose-100 bg-rose-50 text-rose-700";
  return "border-amber-100 bg-amber-50 text-amber-700";
}

function AvailabilityBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusStyles(status)}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function MiniBar({ value, tone = "blue" }: { value: number; tone?: "blue" | "emerald" | "amber" | "rose" }) {
  const colors = {
    amber: "bg-amber-500",
    blue: "bg-blue-600",
    emerald: "bg-emerald-500",
    rose: "bg-rose-500"
  };

  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${colors[tone]}`} style={{ width: `${Math.min(Math.max(value, 3), 100)}%` }} />
    </div>
  );
}

function TrendBars({ values, tone = "blue" }: { values: number[]; tone?: "blue" | "emerald" | "amber" | "rose" }) {
  const max = Math.max(...values, 1);
  const colors = {
    amber: "bg-amber-500",
    blue: "bg-blue-600",
    emerald: "bg-emerald-500",
    rose: "bg-rose-500"
  };

  return (
    <div className="flex h-20 items-end gap-1.5">
      {values.map((value, index) => (
        <div className="flex-1 rounded-t bg-slate-100" key={`${value}-${index}`}>
          <div className={`rounded-t ${colors[tone]}`} style={{ height: `${Math.max((value / max) * 80, 8)}px` }} />
        </div>
      ))}
    </div>
  );
}

function StatTile({
  icon: IconComponent,
  label,
  tone = "blue",
  value
}: {
  icon: Icon;
  label: string;
  tone?: "blue" | "emerald" | "amber" | "rose" | "slate";
  value: string | number;
}) {
  const tones = {
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    slate: "bg-slate-100 text-slate-700"
  };

  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-1 truncate text-2xl font-black text-slate-900">{value}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
          <IconComponent className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function CompactMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}

function EmployeeCompactCard({
  analytics,
  onOpen,
  record
}: {
  analytics: ReturnType<typeof employeeAnalytics>;
  onOpen: () => void;
  record: EmployeeRecord;
}) {
  const initials = record.user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card
      className="cursor-pointer rounded-2xl border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
      onClick={onOpen}
      role="button"
      tabIndex={0}
    >
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-black text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-900">{record.user.name}</p>
              <p className="mt-0.5 truncate font-mono text-[10px] text-slate-400">EMP-{record.employee.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
          <AvailabilityBadge status={analytics.status} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <CompactMetric label="Today's Samples" value={analytics.todaySamples} />
          <CompactMetric label="Today's Revenue" value={money(analytics.todayRevenue)} />
          <CompactMetric label="Active Bookings" value={analytics.activeBookings} />
          <CompactMetric label="Leave Days" value={analytics.leaveDays} />
          <CompactMetric label="Monthly Samples" value={analytics.monthlySamples} />
          <CompactMetric label="Monthly Revenue" value={money(analytics.monthlyRevenue)} />
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="truncate text-xs font-medium text-slate-500">{record.employee.zone || "No zone assigned"}</span>
          <Button className="h-8 rounded-xl px-3 text-xs font-bold" type="button" variant="outline">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailTile({ label, value, helper }: { helper?: string; label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-black text-slate-900">{value}</p>
      {helper ? <p className="text-[10px] text-slate-500">{helper}</p> : null}
    </div>
  );
}

function EmployeeDetailDrawer({
  analytics,
  appointments,
  onClose,
  onToggle,
  record,
  toggling
}: {
  analytics: ReturnType<typeof employeeAnalytics>;
  appointments: Appointment[];
  onClose: () => void;
  onToggle: () => void;
  record: EmployeeRecord;
  toggling: boolean;
}) {
  const initials = record.user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const dailySamples = Array.from({ length: 7 }, (_, index) => {
    const day = String(Math.max(1, today.getDate() - 6 + index)).padStart(2, "0");
    const month = format(today, "yyyy-MM");
    return employeeAppointments(appointments, record.user.id).filter(
      (appointment) => appointment.status === "completed" && appointmentDay(appointment) === `${month}-${day}`
    ).length;
  });
  const revenueTrend = dailySamples.map((samples) => samples * SAMPLE_REVENUE);
  const leaveHistory = Array.from({ length: analytics.leaveDays }).map((_, index) => `Estimated leave day ${index + 1}`);
  const badges = [
    analytics.monthlySamples >= 80 ? { icon: Trophy, label: "Top Performer", tone: "emerald" } : null,
    analytics.attendancePercentage < 80 ? { icon: AlertTriangle, label: "Attendance Warning", tone: "amber" } : null,
    analytics.completionRate < 55 && analytics.totalBookings > 0 ? { icon: TrendingDown, label: "Low Performance", tone: "rose" } : null,
    analytics.rank === 1 && analytics.monthlyRevenue > 0 ? { icon: Award, label: "Revenue Champion", tone: "blue" } : null
  ].filter(Boolean) as Array<{ icon: Icon; label: string; tone: "blue" | "emerald" | "amber" | "rose" }>;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
      <button aria-label="Close employee details" className="hidden flex-1 lg:block" onClick={onClose} type="button" />
      <aside className="flex h-full w-full max-w-5xl flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-base font-black text-white">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-xl font-black text-slate-900">{record.user.name}</h2>
                  <AvailabilityBadge status={analytics.status} />
                </div>
                <p className="mt-1 font-mono text-[11px] text-slate-400">EMP-{record.employee.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="h-9 rounded-xl border-slate-200 text-xs font-bold"
                disabled={toggling}
                onClick={onToggle}
                type="button"
                variant="outline"
              >
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${toggling ? "animate-spin" : ""}`} />
                Toggle Status
              </Button>
              <Button className="h-9 w-9 rounded-xl p-0" onClick={onClose} type="button" variant="outline">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid gap-3 text-xs text-slate-500 sm:grid-cols-2 xl:grid-cols-4">
            <span className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
              <Phone className="h-3.5 w-3.5" /> {record.user.phone}
            </span>
            <span className="flex min-w-0 items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
              <Mail className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{record.user.email}</span>
            </span>
            <span className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
              <MapPin className="h-3.5 w-3.5" /> {record.employee.zone || "No zone assigned"}
            </span>
            <span className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
              <User2 className="h-3.5 w-3.5" /> Field Collection Specialist
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => (
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                  badge.tone === "emerald"
                    ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                    : badge.tone === "amber"
                      ? "border-amber-100 bg-amber-50 text-amber-700"
                      : badge.tone === "rose"
                        ? "border-rose-100 bg-rose-50 text-rose-700"
                        : "border-blue-100 bg-blue-50 text-blue-700"
                }`}
                key={badge.label}
              >
                <badge.icon className="h-3 w-3" />
                {badge.label}
              </span>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <DetailTile helper={`${analytics.monthlySamples} x ₹${SAMPLE_REVENUE}`} label="Revenue Generated" value={money(analytics.monthlyRevenue)} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <section className="rounded-2xl border border-slate-100 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-slate-900">Attendance & Leave</p>
                  <p className="text-[11px] text-slate-500">Estimated from assigned collection days until attendance data is available.</p>
                </div>
                <CalendarX2 className="h-5 w-5 text-amber-600" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <DetailTile label="Present Days" value={analytics.presentDays} />
                <DetailTile label="Absent Days" value={analytics.absentDays} />
                <DetailTile label="Leave Days" value={analytics.leaveDays} />
                <DetailTile label="Late Arrivals" value={analytics.lateArrivals} />
              </div>
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Attendance Percentage</span>
                  <span className="text-slate-500">{pct(analytics.attendancePercentage)}</span>
                </div>
                <MiniBar value={analytics.attendancePercentage} tone={analytics.attendancePercentage < 80 ? "amber" : "emerald"} />
              </div>
              <div className="mt-4 rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Leave History</p>
                {leaveHistory.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {leaveHistory.slice(0, 8).map((item) => (
                      <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-500" key={item}>
                        {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs font-semibold text-emerald-700">No estimated leave days this month.</p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-100 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-slate-900">Samples & Bookings</p>
                  <p className="text-[11px] text-slate-500">Completed, pending, active, and monthly workload.</p>
                </div>
                <BriefcaseBusiness className="h-5 w-5 text-blue-600" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <DetailTile label="Completed Samples" value={analytics.monthlySamples} />
                <DetailTile label="Pending Samples" value={analytics.pendingBookings} />
                <DetailTile label="Active Bookings" value={analytics.activeBookings} />
                <DetailTile label="Cancelled Bookings" value={analytics.cancelledBookings} />
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Bookings</p>
                {analytics.activeAppointments.length ? (
                  analytics.activeAppointments.slice(0, 5).map((appointment) => (
                    <div className="flex items-center justify-between rounded-xl bg-blue-50 px-3 py-2" key={appointment.id}>
                      <span className="font-mono text-[10px] text-blue-700">#{appointment.id.slice(0, 10)}</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-blue-700">{appointment.status}</span>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">No active bookings right now.</p>
                )}
              </div>
            </section>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <section className="rounded-2xl border border-slate-100 p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-black text-slate-900">Earnings Breakdown</p>
                <WalletCards className="h-5 w-5 text-blue-600" />
              </div>
              <div className="space-y-2 text-xs">
                {[
                  ["Base Earnings", money(BASE_EARNINGS), "text-slate-700"],
                  ["Incentives", money(analytics.incentives), "text-emerald-700"],
                  ["Petrol Allowance", money(analytics.petrolAllowance), "text-blue-700"],
                  ["Star Rating Bonus", money(analytics.starRatingBonus), "text-amber-700"],
                  ["Referral Bonus", money(analytics.referralBonus), "text-indigo-700"],
                  ["Deductions", `-${money(analytics.deductions)}`, "text-rose-700"]
                ].map(([label, value, color]) => (
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2" key={label}>
                    <span className="font-medium text-slate-500">{label}</span>
                    <span className={`font-black ${color}`}>{value}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-100 p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-black text-slate-900">Performance Metrics</p>
                <Activity className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="space-y-4">
                {[
                  ["Sample Completion Rate", analytics.completionRate, "emerald"],
                  ["Booking Acceptance Rate", analytics.acceptanceRate, "blue"],
                  ["Cancellation Rate", analytics.cancellationRate, "rose"],
                  ["Customer Rating", (analytics.customerRating / 5) * 100, "amber"]
                ].map(([label, value, tone]) => (
                  <div key={label as string}>
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">{label}</span>
                      <span className="text-slate-500">
                        {label === "Customer Rating" ? analytics.customerRating.toFixed(1) : pct(value as number)}
                      </span>
                    </div>
                    <MiniBar value={value as number} tone={tone as "blue" | "emerald" | "amber" | "rose"} />
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-100 p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-black text-slate-900">Performance Charts</p>
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-700">
                    <AreaChart className="h-3.5 w-3.5 text-blue-600" /> Daily Samples Trend
                  </div>
                  <TrendBars values={dailySamples} tone="blue" />
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-700">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> Revenue Trend
                  </div>
                  <TrendBars values={revenueTrend} tone="emerald" />
                </div>
              </div>
            </section>
          </div>

        </div>
      </aside>
    </div>
  );
}

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [zone, setZone] = useState("");
  const [password, setPassword] = useState("");

<<<<<<< Updated upstream
  const employeesQ    = useQuery({ queryKey: ["employees"],               queryFn: listEmployees });
  const appointmentsQ = useQuery({ queryKey: ["appointments", "emp-page"],queryFn: listAppointments });
  const leaderQ       = useQuery({ queryKey: ["feedback-leaderboard"],    queryFn: getFeedbackLeaderboard });
=======
  const employeesQ = useQuery({ queryKey: ["employees"], queryFn: listEmployees });
  const appointmentsQ = useQuery({ queryKey: ["appointments", "emp-page"], queryFn: () => listAppointments() });
>>>>>>> Stashed changes

  const employees = employeesQ.data?.data ?? [];
  const appointments = appointmentsQ.data?.data ?? [];
  const leaderMap    = Object.fromEntries(
    (leaderQ.data?.data ?? []).map((e) => [e.employeeId, e])
  );

  const rankedRevenue = useMemo(() => {
    const pairs = employees
      .map((record) => ({
        employeeId: record.employee.id,
        revenue:
          employeeAppointments(appointments, record.user.id).filter(
            (appointment) => appointment.status === "completed" && isThisMonth(appointment)
          ).length * SAMPLE_REVENUE
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return new Map(pairs.map((item, index) => [item.employeeId, index + 1]));
  }, [appointments, employees]);

  const analyticsByEmployee = useMemo(() => {
    return new Map(
      employees.map((record) => [
        record.employee.id,
        employeeAnalytics(record, appointments, rankedRevenue.get(record.employee.id) ?? employees.length)
      ])
    );
  }, [appointments, employees, rankedRevenue]);

  const selectedEmployee = employees.find((record) => record.employee.id === selectedEmployeeId) ?? null;
  const selectedAnalytics = selectedEmployee ? analyticsByEmployee.get(selectedEmployee.employee.id) ?? null : null;

  const summary = useMemo(() => {
    const analytics = employees.map((record) => analyticsByEmployee.get(record.employee.id)).filter(Boolean) as Array<
      ReturnType<typeof employeeAnalytics>
    >;
    const totalSamples = analytics.reduce((sum, item) => sum + item.monthlySamples, 0);
    const totalRevenue = analytics.reduce((sum, item) => sum + item.monthlyRevenue, 0);
    const totalRevenueLost = analytics.reduce((sum, item) => sum + item.revenueLost, 0);
    const topIndex = analytics.reduce((best, item, index) => (item.monthlyRevenue > (analytics[best]?.monthlyRevenue ?? -1) ? index : best), 0);

    return {
      activeEmployees: employees.filter((record) => record.employee.isAvailable).length,
      onLeave: analytics.filter((item) => item.status === "On Leave").length,
      topEmployee: employees[topIndex]?.user.name ?? "No employee",
      totalRevenue,
      totalRevenueLost,
      totalSamples
    };
  }, [analyticsByEmployee, employees]);

  const createMutation = useMutation({
    mutationFn: () => createEmployee({ email, name, password, phone, zone }),
    onSuccess: () => {
      toast({ title: "Employee created" });
      setShowModal(false);
      setName("");
      setEmail("");
      setPhone("");
      setZone("");
      setPassword("");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: Error) => toast({ title: "Create failed", description: e.message, variant: "destructive" })
  });

  const toggleAvailability = useMutation({
    mutationFn: ({ empId, isAvailable }: { empId: string; isAvailable: boolean }) =>
      updateEmployeeLocation(empId, { isAvailable, latitude: 0, longitude: 0 }),
    onSuccess: () => {
      toast({ title: "Availability updated" });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" })
  });

  const closeModal = () => {
    setShowModal(false);
    setName("");
    setEmail("");
    setPhone("");
    setZone("");
    setPassword("");
  };

  const fillRandomPhone = () => {
    const suffix = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join("");
    setPhone(`+919${suffix}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        action={
          <Button
            className="h-9 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700"
            onClick={() => setShowModal(true)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Employee
          </Button>
        }
        description="Compact workforce overview with detailed analytics on click."
        title="Employee Management"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={Users} label="Total Employees" value={employees.length} />
        <StatTile icon={CheckCircle2} label="Active Employees" tone="emerald" value={summary.activeEmployees} />
        <StatTile icon={CalendarX2} label="Employees on Leave" tone="amber" value={summary.onLeave} />
        <StatTile icon={Award} label="Top Performing Employee" tone="slate" value={summary.topEmployee} />
        <StatTile icon={BriefcaseBusiness} label="Total Samples Collected" tone="blue" value={summary.totalSamples} />
        <StatTile icon={BadgeIndianRupee} label="Total Revenue Generated" tone="emerald" value={money(summary.totalRevenue)} />
        <StatTile icon={TrendingDown} label="Revenue Lost Due to Leave" tone="rose" value={money(summary.totalRevenueLost)} />
        <StatTile icon={Star} label="Potential Revenue" tone="amber" value={money(summary.totalRevenue + summary.totalRevenueLost)} />
      </div>

      {employeesQ.isLoading || appointmentsQ.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton className="h-64 rounded-2xl" key={index} />
          ))}
        </div>
      ) : employees.length === 0 ? (
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No employees yet</p>
            <p className="mt-1 text-xs text-slate-400">Add your first field collection employee</p>
            <Button className="mt-4 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700" onClick={() => setShowModal(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Add Employee
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {employees.map((record) => {
            const analytics = analyticsByEmployee.get(record.employee.id);
            if (!analytics) return null;

            return (
              <EmployeeCompactCard
                analytics={analytics}
                key={record.employee.id}
<<<<<<< Updated upstream
              >
                {/* Top strip */}
                <div className={`h-1 ${record.employee.isAvailable ? "bg-emerald-400" : "bg-amber-400"}`} />

                <CardContent className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                        {initials}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{record.user.name}</p>
                        <AvailabilityBadge available={record.employee.isAvailable} />
                      </div>
                    </div>
                    <button
                      className="h-7 w-7 rounded-lg text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition flex items-center justify-center"
                      onClick={() => toggleAvailability.mutate({ empId: record.employee.id, isAvailable: !record.employee.isAvailable })}
                      title="Toggle availability"
                      type="button"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Phone className="h-3.5 w-3.5 text-slate-300" />
                      {record.user.phone}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5 text-slate-300" />
                      {record.employee.zone || "No zone assigned"}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <User2 className="h-3.5 w-3.5 text-slate-300" />
                      {record.user.email}
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50">
                    <div className="bg-slate-50 rounded-xl px-3 py-2">
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Today</p>
                      <p className="text-lg font-black text-slate-800">{taskCount}</p>
                      <p className="text-[9px] text-slate-400">tasks</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl px-3 py-2">
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Active</p>
                      <p className="text-lg font-black text-slate-800">{assigned.length}</p>
                      <p className="text-[9px] text-slate-400">bookings</p>
                    </div>
                  </div>

                  {/* Rating row */}
                  {(() => {
                    const entry = leaderMap[record.employee.id];
                    return entry && entry.totalFeedbackCount > 0 ? (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                        <div className="flex items-center gap-1">
                          <span className="text-amber-400"><Star className="h-4 w-4 fill-amber-400" /></span>
                          <span className="text-sm font-black text-slate-800">{entry.averageRating.toFixed(1)}</span>
                          <span className="text-[10px] text-slate-400">({entry.totalFeedbackCount})</span>
                        </div>
                        <a
                          href={`/admin/employees/${record.employee.id}/feedback`}
                          className="text-[10px] font-bold text-blue-600 hover:underline"
                        >
                          View Feedback →
                        </a>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-slate-50">
                        <span className="text-[10px] text-slate-300">No reviews yet</span>
                      </div>
                    );
                  })()}

                  {/* Active bookings preview */}
                  {assigned.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Active bookings</p>
                      {assigned.slice(0, 2).map((a) => (
                        <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-1.5" key={a.id}>
                          <span className="text-[10px] font-mono text-blue-700">{a.id.slice(0, 10)}…</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            a.status === "en_route" ? "bg-indigo-100 text-indigo-600" :
                            a.status === "collected" ? "bg-cyan-100 text-cyan-600" :
                            "bg-blue-100 text-blue-600"
                          }`}>
                            {a.status}
                          </span>
                        </div>
                      ))}
                      {assigned.length > 2 && (
                        <p className="text-[10px] text-slate-400 text-center">+{assigned.length - 2} more</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
=======
                onOpen={() => setSelectedEmployeeId(record.employee.id)}
                record={record}
              />
>>>>>>> Stashed changes
            );
          })}
        </div>
      )}

      {selectedEmployee && selectedAnalytics && (
        <EmployeeDetailDrawer
          analytics={selectedAnalytics}
          appointments={appointments}
          onClose={() => setSelectedEmployeeId(null)}
          onToggle={() =>
            toggleAvailability.mutate({
              empId: selectedEmployee.employee.id,
              isAvailable: !selectedEmployee.employee.isAvailable
            })
          }
          record={selectedEmployee}
          toggling={toggleAvailability.isPending}
        />
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <Card className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="flex items-center gap-2 font-bold text-slate-800">
                <Plus className="h-4 w-4 text-blue-500" /> Add Employee
              </h3>
              <Button className="h-8 w-8 rounded-full p-0 text-slate-400" onClick={closeModal} variant="ghost">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-4 p-6">
              {[
                { label: "Full Name", placeholder: "Rahul Mehra", setter: setName, type: "text", value: name },
                { label: "Email", placeholder: "rahul@labconnect.com", setter: setEmail, type: "email", value: email },
                { label: "Phone", placeholder: "+91 9876543210", setter: setPhone, type: "tel", value: phone },
                { label: "Zone / Area", placeholder: "e.g. Bhopal North Zone", setter: setZone, type: "text", value: zone },
                { label: "Password", placeholder: "Temporary password", setter: setPassword, type: "password", value: password }
              ].map((field) => (
                <div className="space-y-1.5" key={field.label}>
                  <div className="flex items-center justify-between gap-3">
                    <Label>{field.label}</Label>
                    {field.label === "Phone" && (
                      <Button className="h-7 rounded-lg px-2 text-[10px] font-bold" onClick={fillRandomPhone} type="button" variant="outline">
                        Random No
                      </Button>
                    )}
                  </div>
                  <Input
                    className="h-10 rounded-xl"
                    onChange={(event) => field.setter(event.target.value)}
                    placeholder={field.placeholder}
                    type={field.type}
                    value={field.value}
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700"
                  disabled={createMutation.isPending || !name || !email || !phone || !password}
                  onClick={() => createMutation.mutate()}
                >
                  {createMutation.isPending ? "Creating..." : "Create Employee"}
                </Button>
                <Button className="rounded-xl" onClick={closeModal} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
