"use client";

import { Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export default function MyProfilePage() {
  const { data: session } = useSession();
  const name  = session?.user?.name  || "Patient";
  const email = session?.user?.email || "—";
  const phone = (session?.user as any)?.phone || "—";

  const initials = name.split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Your Lab Connect patient account</p>
      </div>

      {/* Avatar card */}
      <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-br from-red-600 to-red-400" />
        <CardContent className="px-6 pb-6">
          <div className="-mt-10 flex items-end gap-4 mb-5">
            <div className="h-20 w-20 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-3xl font-black text-red-600">
              {initials}
            </div>
            <div className="pb-1">
              <p className="text-lg font-black text-slate-900 leading-tight">{name}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-600">Verified Patient</span>
              </div>
            </div>
          </div>

          {/* Info fields */}
          <div className="space-y-3">
            {[
              { icon: Mail,     label: "Email Address", val: email },
              { icon: Phone,    label: "Phone Number",  val: phone },
              { icon: UserRound,label: "Account Type",  val: "Patient" },
            ].map((item) => (
              <div className="flex items-center gap-4 bg-slate-50 rounded-xl px-4 py-3" key={item.label}>
                <div className="h-9 w-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-4 w-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{item.val}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick links */}
      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardHeader className="px-5 py-4 border-b border-slate-50">
          <CardTitle className="text-sm font-bold text-slate-800">Quick Access</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          {[
            { label: "My Bookings",      href: "/dashboard/my-bookings",      color: "border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100" },
            { label: "Track Collection", href: "/dashboard/track-collection",  color: "border-cyan-200 text-cyan-700 bg-cyan-50 hover:bg-cyan-100" },
            { label: "My Reports",       href: "/dashboard/reports",           color: "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100" },
            { label: "Support",          href: "/dashboard/support",           color: "border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100" },
          ].map((item) => (
            <Link
              className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-semibold border transition ${item.color}`}
              href={item.href}
              key={item.label}
            >
              {item.label}
              <span className="text-xs">→</span>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
