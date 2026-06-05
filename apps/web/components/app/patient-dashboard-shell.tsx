"use client";

import {
  Bell,
  ClipboardList,
  Headphones,
  HeartPulse,
  Home,
  LogOut,
  Menu,
  Navigation,
  ShieldCheck,
  TestTube2,
  UserRound,
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

const sidebarItems = [
  { icon: Home, label: "Home", href: "/dashboard" },
  { icon: TestTube2, label: "Book Test", href: "/dashboard/book-test" },
  { icon: ClipboardList, label: "My Bookings", href: "/dashboard/my-bookings" },
  { icon: Navigation, label: "Track Collection", href: "/dashboard/track-collection" },
  { icon: UserRound, label: "My Profile", href: "/dashboard/my-profile" },
  { icon: Headphones, label: "Support", href: "/dashboard/support" }
];

function isActiveRoute(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PatientDashboardShell({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const patientName = session?.user?.name || "Aarav Sharma";

  const initials = useMemo(
    () =>
      patientName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [patientName]
  );

  const sidebar = (
    <aside className="flex h-full w-72 flex-col overflow-y-auto border-r border-slate-900 bg-slate-950 px-4 py-5 text-white shadow-sm lg:shadow-none">
      <div className="mb-8 flex items-center justify-between px-2">
        <Link className="flex items-center gap-3" href="/">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/30">
            <HeartPulse className="h-6 w-6" />
          </span>
          <span>
            <span className="block text-lg font-bold tracking-tight text-white">LabConnect</span>
            <span className="block text-xs font-medium text-slate-400">Patient Portal</span>
          </span>
        </Link>
        <button
          aria-label="Close navigation"
          className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white lg:hidden"
          onClick={() => setSidebarOpen(false)}
          type="button"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="space-y-1.5 pb-4">
        {sidebarItems.map((item) => {
          const active = isActiveRoute(pathname, item.href);
          return (
            <Link
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                active
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                  : "text-slate-200 hover:bg-white/10 hover:text-white"
              }`}
              href={item.href}
              key={item.label}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-xl border border-white/10 bg-white/10 p-4">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <p className="text-sm font-bold text-white">Certified Collection</p>
        <p className="mt-1 text-xs leading-5 text-slate-300">Home sample collection with verified phlebotomists.</p>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div
        className={`fixed inset-0 z-40 bg-slate-900/30 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}
        onClick={() => setSidebarOpen(false)}
      />
      <div className={`fixed inset-y-0 left-0 z-50 transform transition lg:hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {sidebar}
      </div>

      <div className="min-h-screen">
        <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">{sidebar}</div>
        <div className="flex min-w-0 flex-1 flex-col lg:pl-72">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  aria-label="Open navigation"
                  className="rounded-xl border border-slate-200 p-2.5 text-slate-600 lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                  type="button"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Patient Dashboard</p>
                  <h1 className="truncate text-xl font-bold text-slate-950 sm:text-2xl">Welcome Back, {patientName}</h1>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50" type="button">
                  <Bell className="h-5 w-5" />
                </button>
                <div className="hidden items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm sm:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">{initials}</div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{patientName}</p>
                    <p className="text-xs text-slate-500">Patient</p>
                  </div>
                </div>
                <Button className="h-11 rounded-xl border-slate-200 text-slate-600" onClick={() => signOut({ callbackUrl: "/" })} size="icon" variant="outline">
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
