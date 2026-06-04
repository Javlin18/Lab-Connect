"use client";

import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Headphones,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Plus,
  TestTube2,
  UserRound,
  UsersRound
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

import { PatientDashboardShell } from "@/components/app/patient-dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { icon: ClipboardList, label: "Total Bookings", value: "24", tone: "bg-blue-50 text-blue-600" },
  { icon: Clock3, label: "Pending Tests", value: "03", tone: "bg-amber-50 text-amber-600" },
  { icon: CheckCircle2, label: "Completed Tests", value: "18", tone: "bg-emerald-50 text-emerald-600" }
];

const activeBooking = {
  id: "LC-2048",
  testName: "Complete Blood Count",
  bookingDate: "04 Jun 2026",
  collectionDateTime: "04 Jun 2026, 10:30 AM",
  status: "Assigned"
};

export default function PatientDashboardPage() {
  const { data: session } = useSession();
  const patientName = session?.user?.name || "Aarav Sharma";

  return (
    <PatientDashboardShell>
      <section className="dashboard-card-soft border-blue-100 p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Patient Home</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Welcome Back, {patientName}
            </h2>
            <p className="mt-2 text-sm text-slate-500">Manage your test bookings and sample collections</p>
          </div>
          <Link className={buttonVariants({ className: "h-11 rounded-xl bg-blue-600 px-5 text-white hover:bg-blue-700" })} href="/dashboard/book-test">
            <Plus className="mr-2 h-4 w-4" />
            Book New Test
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card className="dashboard-card group" key={stat.label}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-950">{stat.value}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition group-hover:scale-105 ${stat.tone}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Link className={buttonVariants({ className: "h-12 rounded-xl bg-blue-600 text-white hover:bg-blue-700" })} href="/dashboard/book-test">
          <TestTube2 className="mr-2 h-4 w-4" />
          Book New Test
        </Link>
        <Link className={buttonVariants({ className: "h-12 rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-700", variant: "outline" })} href="/dashboard/my-bookings">
          <ClipboardList className="mr-2 h-4 w-4" />
          View My Bookings
        </Link>
        <Link className={buttonVariants({ className: "h-12 rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-700", variant: "outline" })} href="/dashboard/track-collection">
          <Navigation className="mr-2 h-4 w-4" />
          Track Collection
        </Link>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.7fr)]">
        <Card className="dashboard-card-soft overflow-hidden">
          <CardHeader className="flex-row items-center justify-between space-y-0 p-5">
            <CardTitle className="text-lg">Active Booking</CardTitle>
            <Badge className="border-indigo-200 bg-indigo-50 text-indigo-700">{activeBooking.status}</Badge>
          </CardHeader>
          <CardContent className="space-y-5 p-5 pt-0">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Booking ID</p>
                <p className="mt-1 font-bold text-slate-950">#{activeBooking.id}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Test Name</p>
                <p className="mt-1 font-bold text-slate-950">{activeBooking.testName}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Booking Date</p>
                <p className="mt-1 font-bold text-slate-950">{activeBooking.bookingDate}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Collection Date & Time</p>
                <p className="mt-1 font-bold text-slate-950">{activeBooking.collectionDateTime}</p>
              </div>
            </div>
            <Link className={buttonVariants({ className: "h-11 rounded-xl border-slate-200 text-slate-700", variant: "outline" })} href="/dashboard/my-bookings">
              View Details
            </Link>
          </CardContent>
        </Card>

        <Card className="dashboard-card-soft">
          <CardHeader className="p-5">
            <CardTitle className="text-lg">Track Collection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-5 pt-0">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-100 text-xl font-bold text-blue-700">RM</div>
              <div>
                <p className="font-bold text-slate-950">Rahul Mehra</p>
                <p className="text-sm text-slate-500">Collection Executive</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-blue-700">
                  <Phone className="h-4 w-4" />
                  +91 98765 43210
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Estimated Arrival</p>
                <p className="mt-1 font-bold text-slate-950">10:30 AM</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Status</p>
                <p className="mt-1 font-bold text-emerald-600">On the way</p>
              </div>
            </div>
            <p className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-medium text-slate-700">
              <MapPin className="h-5 w-5 text-blue-600" />
              Collector is near your saved address.
            </p>
            <Link className={buttonVariants({ className: "h-11 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700" })} href="/dashboard/track-collection">
              <Navigation className="mr-2 h-4 w-4" />
              Track Collection
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="dashboard-card-soft">
          <CardHeader className="p-5">
            <CardTitle className="text-lg">Family Members Summary</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 p-5 pt-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="dashboard-icon h-12 w-12">
                <UsersRound className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Family Members</p>
                <p className="text-2xl font-bold text-slate-950">03</p>
              </div>
            </div>
            <Button className="h-11 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
              <UserRound className="mr-2 h-4 w-4" />
              Add New Member
            </Button>
          </CardContent>
        </Card>

        <Card className="dashboard-card-soft">
          <CardHeader className="p-5">
            <CardTitle className="text-lg">Support</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 p-5 pt-0 sm:grid-cols-3">
            <Button className="h-11 rounded-xl border-slate-200 text-slate-700" variant="outline">
              <Headphones className="mr-2 h-4 w-4" />
              Ticket
            </Button>
            <Button className="h-11 rounded-xl border-slate-200 text-slate-700" variant="outline">
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp
            </Button>
            <Button className="h-11 rounded-xl border-slate-200 text-slate-700" variant="outline">
              <Phone className="mr-2 h-4 w-4" />
              Call
            </Button>
          </CardContent>
        </Card>
      </section>
    </PatientDashboardShell>
  );
}
