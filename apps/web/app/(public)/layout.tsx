"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, LogOut, MapPin, Search, ShoppingCart, User } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

import { getCart } from "@/api/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchVal, setSearchVal] = useState(searchParams.get("q") || "");
  const [location, setLocation] = useState("New Delhi");

  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: () => getCart(),
    enabled: status === "authenticated",
    retry: false
  });

  const cartItemsCount = cartQuery.data?.data?.items?.length || 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/tests?q=${encodeURIComponent(searchVal)}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link className="flex items-center gap-2 group" href="/">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/20 transition group-hover:scale-105">
                <Activity className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-800">
                Lab<span className="text-primary">connect</span>
              </span>
            </Link>

            {/* Location Selector (Mock) */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100/80 px-2.5 py-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <select
                className="bg-transparent border-none font-medium text-slate-600 focus:ring-0 cursor-pointer outline-none"
                onChange={(e) => setLocation(e.target.value)}
                value={location}
              >
                <option value="New Delhi">New Delhi</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Kolkata">Kolkata</option>
              </select>
            </div>

            {/* Search Bar */}
            <form className="flex-1 max-w-md hidden sm:block" onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  className="w-full pl-9 pr-4 py-1.5 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white text-sm transition"
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Search blood tests, packages..."
                  type="search"
                  value={searchVal}
                />
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-primary" href="/cart">
                <ShoppingCart className="h-5 w-5" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-white ring-2 ring-white animate-pulse">
                    {cartItemsCount}
                  </span>
                )}
              </Link>

              {status === "authenticated" ? (
                <div className="flex items-center gap-2">
                  <Link href={session.user.role === "admin" ? "/admin/dashboard" : "/dashboard"}>
                    <Button className="rounded-xl flex items-center gap-1.5" variant="outline">
                      <User className="h-4 w-4" />
                      <span className="hidden md:inline">Dashboard</span>
                    </Button>
                  </Link>
                  <Button
                    className="rounded-xl"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    size="icon"
                    variant="ghost"
                  >
                    <LogOut className="h-4 w-4 text-slate-500 hover:text-primary" />
                  </Button>
                </div>
              ) : (
                <Link href="/login">
                  <Button className="rounded-xl bg-primary text-white hover:bg-primary/95 shadow-sm shadow-primary/10">
                    <User className="h-4 w-4 mr-1.5" />
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">{children}</main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-100 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                  <Activity className="h-4 w-4" />
                </div>
                <span className="text-lg font-bold text-slate-800">Labconnect</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Premium home healthcare & laboratory services. Trusted by millions of families for accurate, swift, and certified reports.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800 mb-3">Quick Links</h4>
              <ul className="space-y-2 text-xs text-slate-500">
                <li><Link className="hover:text-primary transition" href="/tests">Book a Test</Link></li>
                <li><Link className="hover:text-primary transition" href="/packages">Health Packages</Link></li>
                <li><Link className="hover:text-primary transition" href="/login">Patient Portal</Link></li>
                <li><Link className="hover:text-primary transition" href="/login?admin=true">Admin Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800 mb-3">Popular Tests</h4>
              <ul className="space-y-2 text-xs text-slate-500">
                <li>Complete Blood Count (CBC)</li>
                <li>Thyroid Profile (T3, T4, TSH)</li>
                <li>HbA1c (Diabetes)</li>
                <li>Lipid Profile (Cholesterol)</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800 mb-3">Contact Us</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                12, Medical Plaza, Sector 15<br />
                Gurugram, Haryana - 122001<br />
                <span className="font-semibold text-slate-700">Phone:</span> +91 1800 200 4567<br />
                <span className="font-semibold text-slate-700">Email:</span> care@labconnect.com
              </p>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} Labconnect. All rights reserved.</p>
            <div className="flex gap-4 text-xs text-slate-400">
              <span className="hover:text-primary transition cursor-pointer">Privacy Policy</span>
              <span className="hover:text-primary transition cursor-pointer">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
