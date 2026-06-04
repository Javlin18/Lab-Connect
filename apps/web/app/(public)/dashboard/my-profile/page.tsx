"use client";

import { Mail, Phone, UserRound } from "lucide-react";
import { useSession } from "next-auth/react";

import { PatientDashboardShell } from "@/components/app/patient-dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MyProfilePage() {
  const { data: session } = useSession();
  const name = session?.user?.name || "Aarav Sharma";
  const email = session?.user?.email || "patient@labconnect.com";

  return (
    <PatientDashboardShell>
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">My Profile</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">Patient account details.</h2>
      </section>

      <Card className="rounded-xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="p-5">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
            {name.slice(0, 2).toUpperCase()}
          </div>
          <CardTitle>{name}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-5 pt-0 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <Mail className="h-4 w-4 text-blue-600" />
              Email
            </p>
            <p className="mt-2 font-bold text-slate-950">{email}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <Phone className="h-4 w-4 text-blue-600" />
              Phone
            </p>
            <p className="mt-2 font-bold text-slate-950">+91 98765 43210</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <UserRound className="h-4 w-4 text-blue-600" />
              Role
            </p>
            <p className="mt-2 font-bold capitalize text-slate-950">Patient</p>
          </div>
        </CardContent>
      </Card>
    </PatientDashboardShell>
  );
}
