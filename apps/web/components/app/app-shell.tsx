"use client";

import {
  Bell,
  Boxes,
  ChevronDown,
  Coins,
  FileText,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Receipt,
  Settings,
  Star,
  Stethoscope,
  Users,
  UserSquare2,
  X,
  Activity
} from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

const navItems = [
  { href: "/admin/dashboard",         icon: LayoutDashboard, label: "Dashboard",        group: "main" },
  { href: "/admin/appointments",      icon: Stethoscope,     label: "Appointments",     group: "main" },
  { href: "/admin/appointments/new",  icon: Plus,            label: "New Appointment",  group: "main" },
  { href: "/admin/orders",            icon: Receipt,         label: "Orders",           group: "main" },
  { href: "/admin/reports",           icon: FileText,        label: "Reports",          group: "main" },
  { href: "/admin/notifications",     icon: Bell,            label: "Notifications",    group: "main" },
  { href: "/admin/tests",             icon: FlaskConical,    label: "Tests",            group: "catalog" },
  { href: "/admin/packages",          icon: Boxes,           label: "Packages",         group: "catalog" },
  { href: "/admin/pricing",           icon: Coins,           label: "Pricing",          group: "catalog" },
  { href: "/admin/employees",         icon: Users,           label: "Employees",        group: "people" },
  { href: "/admin/feedback",          icon: Star,            label: "Feedback",         group: "people" },
  { href: "/admin/patients",          icon: UserSquare2,     label: "Patients",         group: "people" },
  { href: "/admin/settings",          icon: Settings,        label: "Settings",         group: "system" },
];

const groups = [
  { key: "main",    label: "Operations" },
  { key: "catalog", label: "Catalog" },
  { key: "people",  label: "People" },
  { key: "system",  label: "System" },
];

function Sidebar({ close }: { close?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col bg-slate-900 text-white overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
          <Activity className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-black text-sm tracking-tight">Lab Connect</p>
          <p className="text-[10px] text-slate-400 font-medium">Admin Panel</p>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-3 py-4 space-y-5">
        {groups.map((group) => {
          const items = navItems.filter((n) => n.group === group.key);
          return (
            <div key={group.key}>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 px-3 mb-2">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href ||
                    (item.href !== "/admin/appointments/new" && pathname.startsWith(`${item.href}/`));
                  return (
                    <Link
                      key={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                        active
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                          : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      )}
                      href={item.href}
                      onClick={close}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom logout */}
      <div className="px-3 py-4 border-t border-slate-800">
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const pathname = usePathname();

  // Get current page label
  const currentItem = navItems.find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:z-40">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            aria-label="Close sidebar"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            type="button"
          />
          <div className="relative z-10">
            <Sidebar close={() => setOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-4 sm:px-6 h-16">
            <div className="flex items-center gap-3">
              <Button
                className="lg:hidden border-slate-200"
                onClick={() => setOpen(true)}
                size="icon"
                type="button"
                variant="outline"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <div>
                <p className="text-xs text-slate-400 font-medium">Admin Panel</p>
                <p className="font-bold text-slate-900 text-sm">{currentItem?.label ?? "Lab Connect"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Notification bell */}
              <Link
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
                href="/admin/notifications"
              >
                <Bell className="h-4 w-4" />
              </Link>

              {/* Admin profile chip */}
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white text-xs font-black">
                  {(user?.name ?? "A").charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 leading-none">{user?.name ?? "Admin"}</p>
                  <p className="text-[10px] text-slate-400 leading-none mt-0.5">Administrator</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
