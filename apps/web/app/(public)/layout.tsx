"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ChevronDown,
  ClipboardList,
  Headphones,
  Home,
  LogOut,
  MapPin,
  Navigation,
  Phone,
  Search,
  ShoppingCart,
  TestTube2,
  User,
  UserRound
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

import { getCart } from "@/api/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const patientNavItems = [
  { icon: Home,          label: "Home",             href: "/dashboard" },
  { icon: TestTube2,     label: "Book Test",        href: "/dashboard/book-test" },
  { icon: ClipboardList, label: "My Bookings",      href: "/dashboard/my-bookings" },
  { icon: Navigation,    label: "Track Collection", href: "/dashboard/track-collection" },
  { icon: UserRound,     label: "My Profile",       href: "/dashboard/my-profile" },
  { icon: Headphones,    label: "Support",          href: "/dashboard/support" },
];

const NAV_LINKS = [
  { label: "Tests",    href: "/tests" },
  { label: "Packages", href: "/packages" },
  { label: "Home Collection", href: "/tests" },
  { label: "Reports",  href: "/dashboard/my-bookings" },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchVal, setSearchVal] = useState(searchParams.get("q") || "");
  const [location, setLocation] = useState("New Delhi");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isPatient = session?.user?.role === "patient";
  const isAdmin   = session?.user?.role === "admin";

  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: () => getCart(),
    enabled: status === "authenticated",
    retry: false,
  });

  const cartItemsCount = cartQuery.data?.data?.items?.length || 0;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) router.push(`/tests?q=${encodeURIComponent(searchVal)}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* ── TOP UTILITY BAR ─────────────────────────────────────────────────── */}
      <div className="bg-red-700 text-white text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-9">
          <div className="flex items-center gap-4">
            <a className="flex items-center gap-1 hover:text-red-200 transition" href="tel:+911800200456">
              <Phone className="h-3 w-3" /> 1800-200-4567
            </a>
            <span className="text-red-400">|</span>
            <span className="hidden sm:inline text-red-200">Mon–Sat: 7 AM – 9 PM</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-red-200">
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
      </div>

      {/* ── MAIN HEADER ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
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
                  placeholder="Search tests, e.g. CBC, Thyroid, Vitamin D..."
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
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white">
                    {cartItemsCount}
                  </span>
                )}
              </Link>

              {status === "authenticated" ? (
                <>
                  {/* Admin */}
                  {isAdmin && (
                    <div className="flex items-center gap-1.5">
                      <Link href="/admin/dashboard">
                        <Button className="rounded-xl h-9 text-xs border-slate-200" variant="outline">
                          <User className="h-3.5 w-3.5 mr-1" /> Admin
                        </Button>
                      </Link>
                      <Button
                        className="rounded-xl h-9"
                        onClick={() => signOut({ callbackUrl: "/" })}
                        size="icon"
                        variant="ghost"
                      >
                        <LogOut className="h-4 w-4 text-slate-500" />
                      </Button>
                    </div>
                  )}

                  {/* Patient dropdown */}
                  {isPatient && (
                    <div className="relative" ref={dropdownRef}>
                      <button
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 h-10 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-red-200 transition"
                        onClick={() => setDropdownOpen((v) => !v)}
                        type="button"
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-600 text-white text-[10px] font-bold">
                          {session.user.name?.charAt(0).toUpperCase() ?? "P"}
                        </div>
                        <span className="hidden sm:inline max-w-[80px] truncate text-xs">{session.user.name}</span>
                        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                      </button>

                      {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-100 bg-white shadow-xl py-2 z-50">
                          <div className="px-4 py-3 border-b border-slate-50">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white font-bold text-sm">
                                {session.user.name?.charAt(0).toUpperCase() ?? "P"}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800 truncate">{session.user.name}</p>
                                <p className="text-xs text-slate-400">Patient</p>
                              </div>
                            </div>
                          </div>
                          <div className="py-1">
                            {patientNavItems.map((item) => {
                              const active = item.href === "/dashboard"
                                ? pathname === item.href
                                : pathname.startsWith(item.href);
                              return (
                                <Link
                                  className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-slate-50 transition ${active ? "text-red-600 bg-red-50/50" : "text-slate-700"}`}
                                  href={item.href}
                                  key={item.href}
                                  onClick={() => setDropdownOpen(false)}
                                >
                                  <item.icon className={`h-4 w-4 ${active ? "text-red-600" : "text-slate-400"}`} />
                                  {item.label}
                                </Link>
                              );
                            })}
                          </div>
                          <div className="border-t border-slate-50 pt-1">
                            <button
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition"
                              onClick={() => signOut({ callbackUrl: "/" })}
                              type="button"
                            >
                              <LogOut className="h-4 w-4" /> Logout
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <Link href="/login">
                  <Button className="rounded-xl h-9 bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm shadow-red-200 text-xs px-4">
                    <User className="h-3.5 w-3.5 mr-1.5" /> Login / Register
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── NAV LINKS BAR ───────────────────────────────────────────────────── */}
        <div className="border-t border-slate-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-6 h-10 overflow-x-auto scrollbar-hide">
              {NAV_LINKS.map((link) => {
                const active = pathname === link.href || pathname.startsWith(link.href + "/");
                return (
                  <Link
                    className={`text-xs font-semibold whitespace-nowrap transition border-b-2 h-full flex items-center ${
                      active
                        ? "text-red-600 border-red-600"
                        : "text-slate-600 border-transparent hover:text-red-600 hover:border-red-300"
                    }`}
                    href={link.href}
                    key={link.label}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </header>

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
                NABL accredited diagnostics. Trusted by 5 Crore+ patients across 500+ cities for accurate, swift lab reports.
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
