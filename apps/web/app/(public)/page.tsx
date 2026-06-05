"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Baby,
  Calendar,
  CheckCircle,
  ChevronRight,
  FileText,
  Flame,
  FlaskConical,
  Heart,
  Home,
  MapPin,
  Phone,
  Search,
  Shield,
  Smartphone,
  Star,
  TrendingUp,
  Truck,
  Zap
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { addToCart } from "@/api/cart";
import { listPackages } from "@/api/packages";
import { listTests } from "@/api/tests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

// ─── Static fallback data ───────────────────────────────────────────────────
const FALLBACK_TESTS = [
  { id: "t1", name: "Complete Blood Count (CBC)", slug: "cbc", price: 399, discountPrice: 299, category: "Blood Tests", turnaroundHours: 12, sampleType: "Blood", description: "Evaluates overall health and detects a wide range of disorders." },
  { id: "t2", name: "Thyroid Profile (T3, T4, TSH)", slug: "thyroid", price: 799, discountPrice: 499, category: "Thyroid", turnaroundHours: 24, sampleType: "Blood", description: "Evaluates thyroid gland function and hormone levels." },
  { id: "t3", name: "HbA1c (Glycated Hemoglobin)", slug: "hba1c", price: 599, discountPrice: 349, category: "Diabetes", turnaroundHours: 12, sampleType: "Blood", description: "Reflects average blood sugar levels over the past 3 months." },
  { id: "t4", name: "Lipid Profile (Cholesterol)", slug: "lipid", price: 899, discountPrice: 599, category: "Heart", turnaroundHours: 12, sampleType: "Blood", description: "Measures cholesterol and triglycerides in the blood." },
  { id: "t5", name: "Vitamin D (25-Hydroxy)", slug: "vitamin-d", price: 1599, discountPrice: 799, category: "Vitamins", turnaroundHours: 24, sampleType: "Blood", description: "Monitors bone health and immune function." },
  { id: "t6", name: "Vitamin B12", slug: "vitamin-b12", price: 999, discountPrice: 599, category: "Vitamins", turnaroundHours: 24, sampleType: "Blood", description: "Checks for B12 deficiency affecting nerves and blood cells." },
];

const FALLBACK_PACKAGES = [
  { id: "p1", name: "Full Body Checkup", slug: "full-body", price: 2999, discountPrice: 1499, description: "82 tests covering liver, kidney, blood & metabolic functions.", tests: [] },
  { id: "p2", name: "Diabetes Care Package", slug: "diabetes-care", price: 1999, discountPrice: 999, description: "35 tests to track blood sugar & kidney health.", tests: [] },
  { id: "p3", name: "Heart Health Package", slug: "heart-health", price: 3499, discountPrice: 1899, description: "42 cardiovascular risk indicator tests.", tests: [] },
  { id: "p4", name: "Women's Health Package", slug: "womens-health", price: 2499, discountPrice: 1299, description: "Hormonal, thyroid, vitamin & bone health tests.", tests: [] },
];

const CATEGORIES = [
  { label: "Diabetes", icon: Zap, color: "bg-blue-50 text-blue-600", href: "/tests?q=diabetes" },
  { label: "Heart Health", icon: Heart, color: "bg-red-50 text-red-600", href: "/tests?q=heart" },
  { label: "Thyroid", icon: FlaskConical, color: "bg-purple-50 text-purple-600", href: "/tests?q=thyroid" },
  { label: "Vitamins", icon: Star, color: "bg-yellow-50 text-yellow-600", href: "/tests?q=vitamins" },
  { label: "Full Body", icon: Shield, color: "bg-green-50 text-green-600", href: "/packages" },
  { label: "Women Care", icon: Baby, color: "bg-pink-50 text-pink-600", href: "/tests?q=women" },
  { label: "Home Visit", icon: Home, color: "bg-orange-50 text-orange-600", href: "/tests" },
  { label: "All Tests", icon: TrendingUp, color: "bg-slate-50 text-slate-600", href: "/tests" },
];

const TRUST_BADGES = [
  { icon: Shield, label: "NABL Accredited", sub: "ISO 9001:2015 Certified" },
  { icon: Truck, label: "Free Home Collection", sub: "In 60 minutes" },
  { icon: FileText, label: "Smart Reports", sub: "Digital & PDF Reports" },
  { icon: Phone, label: "24×7 Support", sub: "+91 1800 200 4567" },
];

export default function HomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchVal, setSearchVal] = useState("");

  const testsQuery  = useQuery({ queryKey: ["tests"],    queryFn: () => listTests() });
  const pkgsQuery   = useQuery({ queryKey: ["packages"], queryFn: () => listPackages() });

  const addMutation = useMutation({
    mutationFn: (data: { testId?: string; packageId?: string }) => addToCart(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({ title: "Added to cart", description: "Item added to your cart." });
    },
    onError: (err: any) => {
      if (err.message?.includes("Unauthorized") || err.message?.includes("JWT")) {
        toast({ title: "Login required", description: "Please login as a patient.", variant: "destructive" });
        router.push("/login");
      } else {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    },
  });

  const handleAdd = (id: string, isPackage = false) => {
    if (session?.user?.role === "admin") {
      toast({ title: "Admin cannot buy tests" });
      return;
    }
    addMutation.mutate(isPackage ? { packageId: id } : { testId: id });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) router.push(`/tests?q=${encodeURIComponent(searchVal)}`);
  };

  const tests    = testsQuery.data?.data?.length  ? testsQuery.data.data  : FALLBACK_TESTS;
  const packages = pkgsQuery.data?.data?.length   ? pkgsQuery.data.data   : FALLBACK_PACKAGES;

  return (
    <div className="flex flex-col">

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-red-700 via-red-600 to-red-500 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-xs font-semibold">
                <Flame className="h-3.5 w-3.5" /> Trusted by 5 Crore+ Patients
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight">
                Book Blood Tests<br />
                <span className="text-red-200">at Home</span>
              </h1>
              <p className="text-sm text-red-100 leading-relaxed max-w-md">
                NABL accredited lab diagnostics. Certified phlebotomists at your doorstep. Accurate reports in 12–24 hours.
              </p>

              {/* Search */}
              <form className="flex gap-2" onSubmit={handleSearch}>
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="pl-10 h-12 rounded-xl bg-white text-slate-800 border-0 shadow-lg text-sm"
                    onChange={(e) => setSearchVal(e.target.value)}
                    placeholder="Search tests, packages e.g. CBC, Thyroid..."
                    type="text"
                    value={searchVal}
                  />
                </div>
                <Button className="h-12 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg" type="submit">
                  Search
                </Button>
              </form>

              {/* Quick search tags */}
              <div className="flex flex-wrap gap-2">
                {["CBC", "Thyroid", "Vitamin D", "HbA1c", "Lipid"].map((tag) => (
                  <button
                    className="text-xs bg-white/20 hover:bg-white/30 rounded-full px-3 py-1 font-medium transition"
                    key={tag}
                    onClick={() => router.push(`/tests?q=${tag}`)}
                    type="button"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Right card */}
            <div className="hidden lg:flex justify-center">
              <div className="bg-white text-slate-800 rounded-2xl shadow-2xl p-6 w-80 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Book Appointment</p>
                    <p className="text-xs text-slate-500">Home Sample Collection</p>
                  </div>
                </div>
                {[
                  { label: "Sample Collected", time: "8:00 AM", done: true },
                  { label: "Processing at Lab", time: "11:00 AM", done: true },
                  { label: "Report Ready", time: "6:00 PM", done: false },
                ].map((step) => (
                  <div className="flex items-center gap-3" key={step.label}>
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step.done ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                      {step.done ? "✓" : "○"}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-800">{step.label}</p>
                    </div>
                    <span className="text-[10px] text-slate-400">{step.time}</span>
                  </div>
                ))}
                <Link href="/tests">
                  <Button className="w-full rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold mt-2">
                    Book Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BADGES ──────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
            {TRUST_BADGES.map((b) => (
              <div className="flex items-center gap-3 py-4 px-4 sm:px-6" key={b.label}>
                <div className="h-9 w-9 rounded-lg bg-red-50 flex items-center justify-center text-red-600 flex-shrink-0">
                  <b.icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">{b.label}</p>
                  <p className="text-[10px] text-slate-400">{b.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ────────────────────────────────────────────────────────── */}
      <section className="py-10 bg-slate-50/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800">Browse by Category</h2>
            <Link className="text-xs font-semibold text-red-600 hover:underline flex items-center gap-1" href="/tests">
              View All <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {CATEGORIES.map((cat) => (
              <Link
                className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border border-slate-100 hover:border-red-200 hover:shadow-md transition group text-center"
                href={cat.href}
                key={cat.label}
              >
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${cat.color} group-hover:scale-110 transition`}>
                  <cat.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-semibold text-slate-700 leading-tight">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── POPULAR TESTS ─────────────────────────────────────────────────────── */}
      <section className="py-12 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Popular Blood Tests</h2>
              <p className="text-xs text-slate-400 mt-0.5">Most booked diagnostic tests with home collection</p>
            </div>
            <Link className="text-xs font-semibold text-red-600 hover:underline flex items-center gap-1" href="/tests">
              View All Tests <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tests.slice(0, 6).map((t: any) => {
              const disc = t.discountPrice ? Math.round(((t.price - t.discountPrice) / t.price) * 100) : 0;
              return (
                <div
                  className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md hover:border-red-100 transition flex flex-col justify-between"
                  key={t.id || t.slug}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{t.category}</span>
                      {disc > 0 && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{disc}% OFF</span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm leading-snug">{t.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{t.description}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded font-medium">🩸 {t.sampleType}</span>
                      <span className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded font-medium">⏱ {t.turnaroundHours}h report</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-50">
                    <div>
                      <p className="text-base font-black text-slate-800">₹{t.discountPrice ?? t.price}</p>
                      {t.discountPrice && <p className="text-[10px] text-slate-400 line-through">₹{t.price}</p>}
                    </div>
                    <Button
                      className="h-8 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm"
                      onClick={() => handleAdd(t.id || t.slug)}
                    >
                      Add to Cart
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HEALTH PACKAGES ───────────────────────────────────────────────────── */}
      <section className="py-12 bg-slate-50/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Health Packages</h2>
              <p className="text-xs text-slate-400 mt-0.5">Comprehensive health checkups at best prices</p>
            </div>
            <Link className="text-xs font-semibold text-red-600 hover:underline flex items-center gap-1" href="/packages">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {packages.slice(0, 4).map((pkg: any) => {
              const disc = pkg.discountPrice ? Math.round(((pkg.price - pkg.discountPrice) / pkg.price) * 100) : 0;
              return (
                <div
                  className="bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-lg hover:border-red-100 transition flex flex-col"
                  key={pkg.id || pkg.slug}
                >
                  {/* Colored top strip */}
                  <div className="h-1.5 bg-gradient-to-r from-red-500 to-red-400" />
                  <div className="p-5 flex flex-col flex-1 justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Popular</span>
                        {disc > 0 && (
                          <span className="text-[10px] font-bold text-white bg-red-600 px-2 py-0.5 rounded-full">{disc}% OFF</span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm mt-2">{pkg.name}</h3>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-3">{pkg.description}</p>

                      <div className="space-y-1.5 mt-4">
                        {["Free Home Collection", "Digital Report", "Same Day Process"].map((f) => (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-600" key={f}>
                            <CheckCircle className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-50">
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-[10px] text-slate-400">Offer Price</p>
                          <p className="text-lg font-black text-slate-800">₹{pkg.discountPrice ?? pkg.price}</p>
                          {pkg.discountPrice && <p className="text-[10px] text-slate-400 line-through">₹{pkg.price}</p>}
                        </div>
                        <Button
                          className="h-8 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                          onClick={() => handleAdd(pkg.id || pkg.slug, true)}
                        >
                          Book Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────────── */}
      <section className="py-14 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-800">How It Works</h2>
            <p className="text-xs text-slate-400 mt-2">Get your tests done at home in 3 easy steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* connector line */}
            <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-px bg-red-100 z-0" />
            {[
              { step: "01", icon: Search, title: "Book Online", desc: "Search & select tests. Choose a convenient time slot and pay securely." },
              { step: "02", icon: Truck, title: "Home Collection", desc: "Certified phlebotomist visits your home to collect the sample." },
              { step: "03", icon: FileText, title: "Get Reports", desc: "Receive accurate digital reports in 12–24 hours via email & app." },
            ].map((s) => (
              <div className="flex flex-col items-center text-center relative z-10" key={s.step}>
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-200 mb-4">
                  <s.icon className="h-8 w-8" />
                </div>
                <span className="text-xs font-bold text-red-400 mb-1">STEP {s.step}</span>
                <h3 className="font-bold text-slate-800 text-base">{s.title}</h3>
                <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ─────────────────────────────────────────────────────── */}
      <section className="py-12 bg-red-600 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "5 Cr+", label: "Tests Conducted" },
              { value: "NABL", label: "Accredited Labs" },
              { value: "12 hrs", label: "Report Delivery" },
              { value: "500+", label: "Cities Covered" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-black">{stat.value}</p>
                <p className="text-xs text-red-200 mt-1 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────────────── */}
      <section className="py-14 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800">What Our Patients Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Ramesh Kumar", city: "Delhi NCR", text: "The phlebotomist was on time. Reports emailed in 12 hours. Incredible service!", stars: 5 },
              { name: "Sneha Patel", city: "Mumbai", text: "50% cheaper than local labs and the report layout is easy to understand.", stars: 5 },
              { name: "Vikram Rao", city: "Bengaluru", text: "Complete hygiene protocols followed. Highly recommended for elderly parents!", stars: 5 },
            ].map((r) => (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4" key={r.name}>
                <div className="flex gap-0.5 text-amber-400">
                  {Array.from({ length: r.stars }).map((_, i) => (
                    <Star className="h-4 w-4 fill-current" key={i} />
                  ))}
                </div>
                <p className="text-xs text-slate-500 italic leading-relaxed">{`"${r.text}"`}</p>
                <div>
                  <p className="text-xs font-bold text-slate-800">{r.name}</p>
                  <p className="text-[10px] text-slate-400">{r.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── APP DOWNLOAD BANNER ───────────────────────────────────────────────── */}
      <section className="py-12 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-white space-y-4 max-w-md">
              <h2 className="text-2xl font-extrabold">Manage Tests on the Go</h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Download the Labconnect app to view orders, download reports, and track your phlebotomist in real time.
              </p>
              <a
                className="inline-flex items-center gap-3 bg-white text-slate-900 rounded-xl px-5 py-3 hover:bg-slate-100 transition font-semibold text-sm"
                href="https://play.google.com/store"
                rel="noreferrer"
                target="_blank"
              >
                <Smartphone className="h-5 w-5 text-red-600" />
                Download on Google Play
              </a>
            </div>
            <div className="hidden md:flex items-center justify-center">
              <Smartphone className="h-40 w-40 text-slate-700" />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
