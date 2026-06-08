"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  MapPin,
  Menu,
  Phone,
  Search,
  ShoppingCart,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

import { getCart } from "@/api/cart";
import { PatientSidebar } from "@/components/app/patient-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const NAV_LINKS = [
  { label: "Tests",           href: "/tests" },
  { label: "Packages",        href: "/packages" },
  { label: "Home Collection", href: "/tests" },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname    = usePathname();
  const router      = useRouter();
  const searchParams = useSearchParams();

  const [searchVal, setSearchVal]     = useState(searchParams.get("q") || "");
  const [location, setLocation]       = useState("New Delhi");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isPatient = session?.user?.role === "patient";
  const isAdmin   = session?.user?.role === "admin";

  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn:  () => getCart(),
    enabled:  status === "authenticated",
    retry:    false,
  });

  const cartItemsCount = cartQuery.data?.data?.items?.length || 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) router.push(`/tests?q=${encodeURIComponent(searchVal)}`);
  };

  // Initials for avatar
  const initials = session?.user?.name
    ? session.user.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
    : "P";

  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* ── TOP UTILITY BAR ─────────────────────────────────────────────────── */}
      <div className="bg-red-700 text-white text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-9">
          <div className="flex items-center gap-4">
            <a className="flex items-center gap-1 hover:text-red-200 transition" href="tel:+911800200456">
              <Phone className="h-3 w-3" /> 1800-200-4567
            </a>
            <span className="text-red-400 hidden sm:inline">|</span>
            <span className="hidden sm:inline text-red-200">Mon–Sat: 7 AM – 9 PM</span>
          </div>
          <div className="flex items-center gap-1.5 text-red-200">
            <MapPin className="h-3 w-3 text-red-300" />
            <select
              className="bg-transparent border-none text-red-100 focus:ring-0 cursor-pointer outline-none text-xs"
              onChange={(e) => setLocation(e.target.value)}
              value={location}
            >
              <option value="New Delhi">New Delhi</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Kolkata">Kolkata</option>
              <option value="Hyderabad">Hyderabad</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── MAIN HEADER ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-100 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-4">

            {/* Logo */}
            <Link className="flex items-center gap-2 flex-shrink-0 group" href="/">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shadow-md shadow-red-200 transition group-hover:scale-105">
                <Activity className="h-5 w-5" />
              </div>
              <div className="hidden sm:block">
                <p className="text-lg font-black text-slate-800 leading-none">Lab<span className="text-red-600">connect</span></p>
                <p className="text-[9px] text-slate-400 font-medium tracking-wider uppercase">NABL Accredited</p>
              </div>
            </Link>

            {/* Search Bar */}
            <form className="flex-1 max-w-xl" onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  className="w-full pl-10 h-10 rounded-xl border-slate-200 bg-slate-50 focus:bg-white text-sm transition"
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Search tests, e.g. CBC, Thyroid…"
                  type="search"
                  value={searchVal}
                />
              </div>
            </form>

            {/* Right actions */}
            <div className="flex items-center gap-2 flex-shrink-0">

              {/* Cart */}
              <Link
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition"
                href="/cart"
                aria-label="Cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white">
                    {cartItemsCount}
                  </span>
                )}
              </Link>

              {status === "loading" ? (
                <div className="h-10 w-10 rounded-xl bg-slate-100 animate-pulse" />
              ) : status === "authenticated" ? (
                <>
                  {/* Admin link */}
                  {isAdmin && (
                    <Link
                      className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      href="/admin/dashboard"
                    >
                      <User className="h-3.5 w-3.5" /> Admin
                    </Link>
                  )}

                  {/* Patient avatar + hamburger */}
                  {isPatient && (
                    <button
                      aria-label="Open patient menu"
                      className="flex items-center gap-2 h-10 pl-1 pr-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-red-200 transition shadow-sm"
                      onClick={() => setSidebarOpen(true)}
                      type="button"
                    >
                      {/* Avatar */}
                      <div className="h-7 w-7 rounded-lg bg-red-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                        {initials}
                      </div>
                      {/* Name — hidden on very small screens */}
                      <span className="hidden sm:inline text-xs font-semibold text-slate-700 max-w-[80px] truncate">
                        {session.user.name}
                      </span>
                      {/* Hamburger lines */}
                      <div className="flex flex-col gap-[3px] ml-1">
                        <span className="block h-0.5 w-4 bg-slate-400 rounded-full" />
                        <span className="block h-0.5 w-4 bg-slate-400 rounded-full" />
                        <span className="block h-0.5 w-3 bg-slate-400 rounded-full" />
                      </div>
                    </button>
                  )}

                  {/* Employee link */}
                  {session?.user?.role === "employee" && (
                    <Link
                      className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      href="/employee/dashboard"
                    >
                      <User className="h-3.5 w-3.5" /> My Tasks
                    </Link>
                  )}
                </>
              ) : (
                /* Not logged in */
                <div className="flex items-center gap-2">
                  <Link
                    className="hidden sm:flex h-9 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 items-center hover:bg-slate-50 transition"
                    href="/login"
                  >
                    Login
                  </Link>
                  <Link
                    className="flex h-9 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold items-center gap-1.5 shadow-sm shadow-red-200 transition"
                    href="/login"
                  >
                    <User className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Register / Login</span>
                    <span className="sm:hidden">Login</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── NAV LINKS BAR ─────────────────────────────────────────────────── */}
        <div className="border-t border-slate-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-6 h-10 overflow-x-auto scrollbar-hide">
              {NAV_LINKS.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={`${link.label}-${link.href}`}
                    className={`text-xs font-semibold whitespace-nowrap transition border-b-2 h-full flex items-center ${
                      active
                        ? "text-red-600 border-red-600"
                        : "text-slate-600 border-transparent hover:text-red-600 hover:border-red-300"
                    }`}
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                );
              })}
              {/* Show "My Bookings" in nav when logged in as patient */}
              {isPatient && (
                <button
                  className="text-xs font-semibold whitespace-nowrap text-slate-600 border-b-2 border-transparent hover:text-red-600 hover:border-red-300 h-full transition"
                  onClick={() => setSidebarOpen(true)}
                  type="button"
                >
                  My Account ▾
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Patient sidebar */}
      {isPatient && (
        <PatientSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          userName={session?.user?.name}
          userEmail={session?.user?.email}
        />
      )}

      {/* Main Content */}
      <main className="flex-grow">{children}</main>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600">
                  <Activity className="h-4 w-4" />
                </div>
                <span className="text-base font-black">Labconnect</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                NABL accredited diagnostics. Trusted by 5 Crore+ patients across 500+ cities.
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Phone className="h-3.5 w-3.5 text-red-400" />
                1800-200-4567
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-4 text-white">Quick Links</h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li><Link className="hover:text-red-400 transition" href="/tests">Book a Test</Link></li>
                <li><Link className="hover:text-red-400 transition" href="/packages">Health Packages</Link></li>
                <li><Link className="hover:text-red-400 transition" href="/login">Patient Login</Link></li>
                <li><Link className="hover:text-red-400 transition" href="/cart">My Cart</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-4 text-white">Popular Tests</h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li className="hover:text-red-400 cursor-pointer transition">Complete Blood Count (CBC)</li>
                <li className="hover:text-red-400 cursor-pointer transition">Thyroid Profile (T3, T4, TSH)</li>
                <li className="hover:text-red-400 cursor-pointer transition">HbA1c — Diabetes</li>
                <li className="hover:text-red-400 cursor-pointer transition">Lipid Profile</li>
                <li className="hover:text-red-400 cursor-pointer transition">Vitamin D</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-4 text-white">Contact</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                12, Medical Plaza, Sector 15<br />
                Gurugram, Haryana – 122001<br /><br />
                <span className="text-slate-300 font-semibold">Email:</span> care@labconnect.com<br />
                <span className="text-slate-300 font-semibold">Phone:</span> +91 1800 200 4567
              </p>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>&copy; {new Date().getFullYear()} Labconnect. All rights reserved.</p>
            <div className="flex gap-4">
              <span className="hover:text-slate-300 cursor-pointer transition">Privacy Policy</span>
              <span className="hover:text-slate-300 cursor-pointer transition">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
