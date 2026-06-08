"use client";

import {
  Activity,
  Bell,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  History,
  Home,
  LogOut,
  Menu,
  User2,
  X
} from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/employee/dashboard",     icon: Home,          label: "Dashboard" },
  { href: "/employee/bookings",      icon: ClipboardList, label: "My Bookings" },
  { href: "/employee/available",     icon: Activity,      label: "Open Bookings" },
  { href: "/employee/history",       icon: History,       label: "History" },
  { href: "/employee/notifications", icon: Bell,          label: "Notifications" },
  { href: "/employee/profile",       icon: User2,         label: "My Profile" },
];

function NavLinks({ close }: { close?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-0.5 px-3 py-4">
      {navItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
            href={item.href}
            onClick={close}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Sidebar({ close }: { close?: () => void }) {
  return (
    <aside className="flex h-full w-64 flex-col bg-slate-900 text-white overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 shadow-lg shadow-emerald-600/30">
          <CheckCircle2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-black text-sm tracking-tight">Lab Connect</p>
          <p className="text-[10px] text-slate-400 font-medium">Employee Portal</p>
        </div>
        {close && (
          <button className="ml-auto text-slate-400 hover:text-white" onClick={close} type="button">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <NavLinks close={close} />

      <div className="mt-auto px-3 py-4 border-t border-slate-800">
        <button
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition"
          onClick={() => signOut({ callbackUrl: "/login" })}
          type="button"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export function EmployeeShell({
  children,
  userName,
  isAvailable,
}: {
  children: React.ReactNode;
  userName?: string;
  isAvailable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const currentItem = navItems.find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:z-40">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            aria-label="Close"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            type="button"
          />
          <div className="relative z-10">
            <Sidebar close={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-4 sm:px-6 h-16">
            <div className="flex items-center gap-3">
              <Button
                className="lg:hidden border-slate-200"
                onClick={() => setOpen(true)}
                size="icon"
                variant="outline"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <div>
                <p className="text-xs text-slate-400 font-medium">Employee Portal</p>
                <p className="font-bold text-slate-900 text-sm">{currentItem?.label ?? "Lab Connect"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Availability indicator */}
              <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                isAvailable
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : "bg-amber-50 text-amber-700 border-amber-100"
              }`}>
                <span className={`h-2 w-2 rounded-full ${isAvailable ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                {isAvailable ? "Available" : "Busy"}
              </div>

              <Link
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
                href="/employee/notifications"
              >
                <Bell className="h-4 w-4" />
              </Link>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white text-xs font-black">
                  {(userName ?? "E").charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 leading-none">{userName ?? "Employee"}</p>
                  <p className="text-[10px] text-slate-400 leading-none mt-0.5">Field Collector</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
