"use client";

import {
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

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { icon: ClipboardList, label: "Total Bookings", value: "24", tone: "bg-blue-50 text-blue-600" },
  { icon: Clock3,        label: "Pending Tests",  value: "03", tone: "bg-amber-50 text-amber-600" },
  { icon: CheckCircle2,  label: "Completed Tests",value: "18", tone: "bg-emerald-50 text-emerald-600" },
];

const activeBooking = {
  id: "LC-2048",
  testName: "Complete Blood Count",
  bookingDate: "04 Jun 2026",
  collectionDateTime: "04 Jun 2026, 10:30 AM",
  status: "Assigned",
};

export default function PatientDashboardPage() {
  const { data: session } = useSession();
  const patientName = session?.user?.name || "Patient";

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Welcome */}
      <div className="rounded-2xl bg-red-50 border border-red-100 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Patient Portal</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Welcome, {patientName}</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your test bookings and sample collections</p>
        </div>
        <Link className={buttonVariants({ className: "h-10 rounded-xl bg-red-600 px-5 text-white hover:bg-red-700 text-sm" })} href="/tests">
          <Plus className="mr-2 h-4 w-4" /> Book New Test
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((s) => (
          <Card className="rounded-2xl border-slate-100 shadow-sm" key={s.label}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-slate-500">{s.label}</p>
                <p className="mt-1 text-3xl font-black text-slate-900">{s.value}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.tone}`}>
                <s.icon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Link className={buttonVariants({ className: "h-11 rounded-xl bg-red-600 text-white hover:bg-red-700" })} href="/tests">
          <TestTube2 className="mr-2 h-4 w-4" /> Book New Test
        </Link>
        <Link className={buttonVariants({ className: "h-11 rounded-xl border-slate-200", variant: "outline" })} href="/dashboard/my-bookings">
          <ClipboardList className="mr-2 h-4 w-4" /> My Bookings
        </Link>
        <Link className={buttonVariants({ className: "h-11 rounded-xl border-slate-200", variant: "outline" })} href="/dashboard/track-collection">
          <Navigation className="mr-2 h-4 w-4" /> Track Collection
        </Link>
      </div>

      {/* Active booking + Track */}
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardHeader className="flex-row items-center justify-between p-5">
            <CardTitle className="text-base">Active Booking</CardTitle>
            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">{activeBooking.status}</Badge>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Booking ID", val: `#${activeBooking.id}` },
                { label: "Test Name",  val: activeBooking.testName },
                { label: "Booking Date", val: activeBooking.bookingDate },
                { label: "Collection Time", val: activeBooking.collectionDateTime },
              ].map((item) => (
                <div className="rounded-xl bg-slate-50 p-3" key={item.label}>
                  <p className="text-[10px] font-semibold uppercase text-slate-400">{item.label}</p>
                  <p className="mt-1 font-bold text-slate-900 text-sm">{item.val}</p>
                </div>
              ))}
            </div>
            <Link className={buttonVariants({ variant: "outline", className: "rounded-xl text-sm" })} href="/dashboard/my-bookings">
              View All Bookings
            </Link>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardHeader className="p-5">
            <CardTitle className="text-base">Track Collection</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center text-lg font-bold text-red-600">RM</div>
              <div>
                <p className="font-bold text-slate-900 text-sm">Rahul Mehra</p>
                <p className="text-xs text-slate-500">Collection Executive</p>
                <p className="text-xs font-semibold text-red-600 flex items-center gap-1 mt-0.5">
                  <Phone className="h-3 w-3" /> +91 98765 43210
                </p>
              </div>
            </div>
            <p className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-slate-700">
              <MapPin className="h-4 w-4 text-red-600 flex-shrink-0" /> Collector is near your address.
            </p>
            <Link className={buttonVariants({ className: "w-full h-10 rounded-xl bg-red-600 text-white hover:bg-red-700 text-sm" })} href="/dashboard/track-collection">
              <Navigation className="mr-2 h-4 w-4" /> Track Live
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Support */}
      <Card className="rounded-2xl border-slate-100 shadow-sm">
        <CardHeader className="p-5">
          <CardTitle className="text-base">Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 p-5 pt-0 sm:grid-cols-3">
          <Button className="h-10 rounded-xl border-slate-200" variant="outline">
            <Headphones className="mr-2 h-4 w-4" /> Raise Ticket
          </Button>
          <Button className="h-10 rounded-xl border-slate-200" variant="outline">
            <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
          </Button>
          <Button className="h-10 rounded-xl border-slate-200" variant="outline">
            <Phone className="mr-2 h-4 w-4" /> Call Us
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
