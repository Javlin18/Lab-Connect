"use client";

import { Boxes, Coins, FlaskConical, LayoutDashboard, Menu, Receipt, Settings, Stethoscope, Users, UserSquare2, X } from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

const navItems = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/appointments", icon: Stethoscope, label: "Appointments" },
  { href: "/admin/orders", icon: Receipt, label: "Orders" },
  { href: "/admin/tests", icon: FlaskConical, label: "Tests" },
  { href: "/admin/packages", icon: Boxes, label: "Packages" },
  { href: "/admin/pricing", icon: Coins, label: "Pricing" },
  { href: "/admin/employees", icon: Users, label: "Employees" },
  { href: "/admin/patients", icon: UserSquare2, label: "Patients" },
  { href: "/admin/settings", icon: Settings, label: "Settings" }
];

function Sidebar({ close }: { close?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-72 flex-col bg-[hsl(var(--sidebar-background))] px-4 py-6 text-[hsl(var(--sidebar-foreground))]">
      <div className="px-2">
        <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--sidebar-ring))]">Labconnect</p>
        <h2 className="mt-2 text-2xl font-semibold">Admin Cave</h2>
      </div>
      <Separator className="my-6 bg-[hsl(var(--sidebar-border))]" />
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition",
                active
                  ? "bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]"
                  : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]"
              )}
              href={item.href}
              onClick={close}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((state) => state.user);

  return (
    <div className="min-h-screen bg-slate-100/70">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex">
        <Sidebar />
      </div>
      {open ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            aria-label="Close sidebar"
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => setOpen(false)}
            type="button"
          />
          <div className="relative z-10">
            <Sidebar close={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Button className="lg:hidden" onClick={() => setOpen(true)} size="icon" type="button" variant="outline">
                <Menu className="h-4 w-4" />
              </Button>
              <div>
                <p className="text-sm text-muted-foreground">Administrator</p>
                <p className="font-semibold">{user?.name ?? "Admin"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => signOut({ callbackUrl: "/login" })}
                type="button"
                variant="outline"
              >
                Logout
              </Button>
              <Button
                className="lg:hidden"
                onClick={() => setOpen(false)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
