"use client";

import { Mail, Phone, UserRound } from "lucide-react";
import { useSession } from "next-auth/react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MyProfilePage() {
  const { data: session } = useSession();
  const name  = session?.user?.name  || "Patient";
  const email = session?.user?.email || "patient@labconnect.com";

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-red-600">My Profile</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Patient account details</h1>
      </div>

      <Card className="rounded-2xl border-slate-100 shadow-sm">
        <CardHeader className="p-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-xl font-black text-white mb-3">
            {name.slice(0, 2).toUpperCase()}
          </div>
          <CardTitle className="text-lg">{name}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-5 pt-0 sm:grid-cols-2">
          {[
            { icon: Mail,     label: "Email",  val: email },
            { icon: Phone,    label: "Phone",  val: "+91 98765 43210" },
            { icon: UserRound,label: "Role",   val: "Patient" },
          ].map((item) => (
            <div className="rounded-xl bg-slate-50 p-4" key={item.label}>
              <p className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <item.icon className="h-3.5 w-3.5 text-red-500" /> {item.label}
              </p>
              <p className="mt-2 font-bold text-slate-900 text-sm">{item.val}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
