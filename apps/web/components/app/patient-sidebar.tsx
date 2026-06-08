"use client";

import {
  BookOpen,
  ClipboardList,
  FileText,
  Headphones,
  Home,
  LogOut,
  MapPin,
  User2,
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect } from "react";

const menuItems = [
  { icon: Home,          label: "Home",             href: "/" },
  { icon: BookOpen,      label: "Book Test",         href: "/tests" },
  { icon: ClipboardList, label: "My Bookings",       href: "/dashboard/my-bookings" },
  { icon: MapPin,        label: "Track Collection",  href: "/dashboard/track-collection" },
  { icon: FileText,      label: "My Reports",        href: "/dashboard/reports" },
  { icon: User2,         label: "My Profile",        href: "/dashboard/my-profile" },
  { icon: Headphones,    label: "Support",           href: "/dashboard/support" },
];

interface PatientSidebarProps {
  open: boolean;
  onClose: () => void;
  userName?: string;
  userEmail?: string;
}

export function PatientSidebar({ open, onClose, userName, userEmail }: PatientSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Close on route change
  useEffect(() => { onClose(); }, [pathname]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const initials = userName
    ? userName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
    : "P";

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-80 max-w-[85vw] bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Patient menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Patient Menu</p>
          <button
            aria-label="Close menu"
            className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Avatar section */}
        <div className="px-5 py-5 border-b border-slate-50 bg-gradient-to-br from-red-50 to-white">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-red-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-red-200 flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-black text-slate-900 text-base truncate">{userName ?? "Patient"}</p>
              <p className="text-xs text-slate-400 truncate mt-0.5">{userEmail ?? ""}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-semibold text-emerald-600">Active Patient</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {menuItems.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition ${
                  active
                    ? "bg-red-600 text-white shadow-sm shadow-red-200"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <item.icon className={`h-5 w-5 flex-shrink-0 ${active ? "text-white" : "text-slate-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-slate-100">
          <button
            className="flex w-full items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-red-500 hover:bg-red-50 transition"
            onClick={() => { onClose(); signOut({ callbackUrl: "/" }); }}
            type="button"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            Logout
          </button>
        </div>

        {/* Bottom branding */}
        <div className="px-5 py-3 border-t border-slate-50">
          <p className="text-[10px] text-slate-300 text-center">Lab Connect · NABL Accredited</p>
        </div>
      </div>
    </>
  );
}
