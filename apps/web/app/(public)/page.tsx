"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle,
  FileText,
  Heart,
  HelpCircle,
  MapPin,
  Play,
  Search,
  Shield,
  Smartphone,
  Star,
  TrendingUp,
  Upload
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { listTests, createTest } from "@/api/tests";
import { listPackages, createPackage } from "@/api/packages";
import { addToCart } from "@/api/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

// Static Seed Data in case DB is empty
const SEED_TESTS = [
  { name: "Complete Blood Count (CBC)", slug: "cbc", description: "Evaluates overall health and detects a wide range of disorders.", price: 399, discountPrice: 299, category: "Blood Tests", sampleType: "Blood", preparationInstructions: "No fasting required", turnaroundHours: 12, parameters: ["Hemoglobin", "WBC Count", "RBC Count", "Platelets"], isActive: true },
  { name: "Thyroid Profile (T3, T4, TSH)", slug: "thyroid", description: "Evaluates thyroid gland function and hormone levels.", price: 799, discountPrice: 499, category: "Thyroid", sampleType: "Blood", preparationInstructions: "Fasting recommended", turnaroundHours: 24, parameters: ["Total Triiodothyronine (T3)", "Total Thyroxine (T4)", "Thyroid Stimulating Hormone (TSH)"], isActive: true },
  { name: "HbA1c (Glycated Hemoglobin)", slug: "hba1c", description: "Reflects your average blood sugar levels over the past 3 months.", price: 599, discountPrice: 349, category: "Diabetes", sampleType: "Blood", preparationInstructions: "No fasting required", turnaroundHours: 12, parameters: ["HbA1c Percentage", "Estimated Average Glucose"], isActive: true },
  { name: "Lipid Profile (Cholesterol)", slug: "lipid", description: "Measures cholesterol and triglyceride levels in the blood.", price: 899, discountPrice: 599, category: "Heart", sampleType: "Blood", preparationInstructions: "10-12 hours fasting required", turnaroundHours: 12, parameters: ["Total Cholesterol", "HDL Cholesterol", "LDL Cholesterol", "Triglycerides"], isActive: true },
  { name: "Vitamin D (25-Hydroxy)", slug: "vitamin-d", description: "Measures vitamin D levels to monitor bone health and immune function.", price: 1599, discountPrice: 799, category: "Vitamins", sampleType: "Blood", preparationInstructions: "No fasting required", turnaroundHours: 24, parameters: ["25-Hydroxy Vitamin D"], isActive: true }
];

const SEED_PACKAGES = [
  { name: "Full Body Checkup", slug: "full-body", description: "Comprehensive health check covering liver, kidney, blood, and metabolic functions.", price: 2999, discountPrice: 1499 },
  { name: "Diabetes Care Package", slug: "diabetes-care", description: "Specialized tests to track and manage blood sugar levels and potential complications.", price: 1999, discountPrice: 999 },
  { name: "Heart Health Package", slug: "heart-health", description: "Evaluates cardiovascular risks with lipid profiles, sugar, and cardiac biomarkers.", price: 3499, discountPrice: 1899 }
];

export default function HomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchVal, setSearchVal] = useState("");

  // Fetch Tests and Packages
  const testsQuery = useQuery({
    queryKey: ["tests"],
    queryFn: () => listTests()
  });

  const packagesQuery = useQuery({
    queryKey: ["packages"],
    queryFn: () => listPackages()
  });

  // Add to Cart Mutation
  const addToCartMutation = useMutation({
    mutationFn: (data: { testId?: string; packageId?: string }) => addToCart(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({
        title: "Added to cart",
        description: "Your selection has been saved."
      });
    },
    onError: (err: any) => {
      if (err.message.includes("Unauthorized") || err.message.includes("JWT") || err.message.includes("token")) {
        toast({
          title: "Please Login First",
          description: "You must be logged in as a patient to add tests to your cart.",
          variant: "destructive"
        });
        router.push("/login");
      } else {
        toast({
          title: "Error adding to cart",
          description: err.message,
          variant: "destructive"
        });
      }
    }
  });

  // Seed DB Helper (in case it is blank)
  const seedMutation = useMutation({
    mutationFn: async () => {
      // Seed tests first
      const createdTests: any[] = [];
      for (const t of SEED_TESTS) {
        try {
          const res = await createTest(t);
          createdTests.push(res.data);
        } catch (e) {
          // might exist
        }
      }
      // Seed packages
      if (createdTests.length > 0) {
        for (const p of SEED_PACKAGES) {
          try {
            await createPackage({
              ...p,
              testIds: createdTests.slice(0, 3).map((item) => item.id)
            });
          } catch (e) {
            // might exist
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tests"] });
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      toast({
        title: "Demo Data Seeded",
        description: "Sample tests and packages are now live in the database!"
      });
    }
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/tests?q=${encodeURIComponent(searchVal)}`);
  };

  const handleAddToCart = (id: string, isPackage = false) => {
    if (session?.user?.role === "admin") {
      toast({
        title: "Admin restriction",
        description: "Admins cannot buy tests. Log in as a patient."
      });
      return;
    }
    addToCartMutation.mutate(
      isPackage ? { packageId: id } : { testId: id }
    );
  };

  const tests = testsQuery.data?.data?.length ? testsQuery.data.data : SEED_TESTS;
  const packages = packagesQuery.data?.data?.length ? packagesQuery.data.data : SEED_PACKAGES;

  return (
    <div className="flex flex-col">
      {/* Seed helper for blank DB */}
      {testsQuery.data?.data?.length === 0 && (
        <div className="bg-amber-50 border-b border-amber-200 py-3 text-center text-sm text-amber-800 flex items-center justify-center gap-3 px-4">
          <span>Database is empty. Click to seed popular blood tests & packages for a full demo!</span>
          <Button
            className="h-8 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
            disabled={seedMutation.isPending}
            onClick={() => seedMutation.mutate()}
          >
            {seedMutation.isPending ? "Seeding..." : "Seed Demo Data"}
          </Button>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-red-50/50 via-slate-50 to-red-50/20 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Info */}
            <div className="space-y-6 max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-red-100/80 px-3.5 py-1 text-xs font-semibold text-primary">
                <Shield className="h-3 w-3" /> NABL Accredited Diagnostics
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-slate-800 leading-tight">
                Book a Health Test <br />
                <span className="text-primary">from the Comfort of Home</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
                Skip the clinic queue. Get verified, certified lab technicians at your doorstep in under 60 minutes. Accurate reports delivered in 12-24 hours.
              </p>

              {/* Search form */}
              <form className="relative" onSubmit={handleSearchSubmit}>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      className="w-full pl-11 pr-4 py-6 rounded-2xl border-slate-200 bg-white shadow-lg shadow-slate-100 text-slate-700 placeholder-slate-400 focus:ring-primary focus:border-primary transition"
                      onChange={(e) => setSearchVal(e.target.value)}
                      placeholder="Type Vitamin D, Lipid Profile, Thyroid..."
                      type="text"
                      value={searchVal}
                    />
                  </div>
                  <Button className="rounded-2xl bg-primary hover:bg-primary/95 text-white px-6 font-bold shadow-lg shadow-primary/20" type="submit">
                    Search
                  </Button>
                </div>
              </form>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-4 text-xs font-medium text-slate-500">
                <div className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-emerald-500" /> Free Doctor Consultation</div>
                <div className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-emerald-500" /> Smart Diagnostic Reports</div>
              </div>
            </div>

            {/* Right Graphic */}
            <div className="relative hidden lg:flex justify-center items-center">
              <div className="absolute inset-0 bg-radial-gradient(circle_at_center,rgba(196,30,58,0.08),transparent_70%) animate-pulse" />
              <div className="relative bg-white/70 backdrop-blur-md border border-slate-100 rounded-3xl p-6 shadow-2xl max-w-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Smartphone className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Swift Collection</h3>
                    <p className="text-xs text-slate-400">Home visit in 1 hr</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                    <span>Selected: Complete Body Checkup</span>
                    <span className="text-primary font-semibold">₹1,499</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                    <span>Phlebotomist Assigned</span>
                    <span className="text-emerald-500 font-semibold flex items-center gap-0.5">En Route</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 -mt-10 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 hover:scale-102 hover:shadow-2xl transition cursor-pointer group">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-primary transition group-hover:bg-primary group-hover:text-white">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Download Report</h3>
              <p className="text-xs text-slate-400 mt-0.5">Get your PDF reports online</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 hover:scale-102 hover:shadow-2xl transition cursor-pointer group">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-primary transition group-hover:bg-primary group-hover:text-white">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Upload Prescription</h3>
              <p className="text-xs text-slate-400 mt-0.5">Let our experts pick the tests</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 hover:scale-102 hover:shadow-2xl transition cursor-pointer group">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-primary transition group-hover:bg-primary group-hover:text-white">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Find Centre</h3>
              <p className="text-xs text-slate-400 mt-0.5">Locate nearest partner lab</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Tests Horizontal Scroll */}
      <section className="py-16 bg-white overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" /> Popular Diagnostic Tests
              </h2>
              <p className="text-xs text-slate-400 mt-1">Book highly recommended diagnostics with ease</p>
            </div>
            <Link className="text-xs font-semibold text-primary hover:underline flex items-center gap-1" href="/tests">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Horizontal scroll container */}
          <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {tests.map((test: any) => (
              <div
                className="flex-shrink-0 w-80 bg-slate-50/50 border border-slate-100 hover:border-slate-200/80 p-5 rounded-2xl hover:bg-white shadow-sm hover:shadow-md transition flex flex-col justify-between"
                key={test.id || test.slug}
              >
                <div>
                  <span className="inline-block text-[10px] font-bold text-primary bg-red-50 px-2 py-0.5 rounded-full mb-3">
                    {test.category}
                  </span>
                  <h3 className="font-bold text-slate-800 line-clamp-1">{test.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 h-8">{test.description}</p>

                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-4">
                    <span className="flex items-center gap-1 font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      ⏱ {test.turnaroundHours}h Report
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-black text-slate-800">₹{test.discountPrice || test.price}</span>
                      {test.discountPrice && (
                        <span className="text-xs text-slate-400 line-through">₹{test.price}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    className="h-9 rounded-xl bg-primary text-white hover:bg-primary/95 text-xs font-bold shadow-sm shadow-primary/10 transition hover:scale-102"
                    onClick={() => handleAddToCart(test.id || test.slug, false)}
                  >
                    Add to Cart
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Health Packages Grid */}
      <section className="py-16 bg-slate-50/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" /> Health Packages
              </h2>
              <p className="text-xs text-slate-400 mt-1">Holistic checkup bundles designed for you and your family</p>
            </div>
            <Link className="text-xs font-semibold text-primary hover:underline flex items-center gap-1" href="/packages">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg: any) => {
              const discPercent = pkg.discountPrice ? Math.round(((pkg.price - pkg.discountPrice) / pkg.price) * 100) : 0;
              return (
                <div
                  className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-xl transition flex flex-col justify-between"
                  key={pkg.id || pkg.slug}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Full Body Care
                      </span>
                      {discPercent > 0 && (
                        <span className="text-[10px] font-extrabold text-white bg-emerald-600 px-2.5 py-0.5 rounded-full">
                          SAVE {discPercent}%
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg">{pkg.name}</h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-3">{pkg.description}</p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">Special Offer Price</p>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-xl font-black text-slate-800">₹{pkg.discountPrice || pkg.price}</span>
                        {pkg.discountPrice && (
                          <span className="text-xs text-slate-400 line-through">₹{pkg.price}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      className="rounded-xl bg-primary text-white hover:bg-primary/95 font-bold shadow-sm shadow-primary/10"
                      onClick={() => handleAddToCart(pkg.id || pkg.slug, true)}
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

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-800">How It Works</h2>
          <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">Get your blood tests done at home in three simple steps</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-16 relative">
            <div className="flex flex-col items-center group">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-primary font-bold text-xl group-hover:bg-primary group-hover:text-white transition shadow-sm">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-800 mt-4 text-base">1. Book Online</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
                Search diagnostic tests, select preferred slot, fill patient details & pay securely.
              </p>
            </div>
            <div className="flex flex-col items-center group">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-primary font-bold text-xl group-hover:bg-primary group-hover:text-white transition shadow-sm">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-800 mt-4 text-base">2. Sample Collection</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
                Certified Phlebotomist visits your doorstep at the selected slot to collect samples.
              </p>
            </div>
            <div className="flex flex-col items-center group">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-primary font-bold text-xl group-hover:bg-primary group-hover:text-white transition shadow-sm">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-800 mt-4 text-base">3. Smart Report</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
                Accurate diagnostic reports compiled by experts, delivered online within 12-24 hours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-slate-50/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-800">What Our Patients Say</h2>
          <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">We are committed to delivering the highest level of care</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 text-left">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex text-amber-500 gap-0.5"><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /></div>
              <p className="text-xs text-slate-500 italic leading-relaxed">
                "The phlebotomist was on time and very gentle with the needle. Reports were emailed to me within 12 hours. Incredible service!"
              </p>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Ramesh Kumar</h4>
                <p className="text-[10px] text-slate-400">Delhi NCR</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex text-amber-500 gap-0.5"><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /></div>
              <p className="text-xs text-slate-500 italic leading-relaxed">
                "Great experience booking Vitamin D checkup. The price was 50% cheaper than local labs, and report layout is easy to understand."
              </p>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Sneha Patel</h4>
                <p className="text-[10px] text-slate-400">Mumbai</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex text-amber-500 gap-0.5"><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /></div>
              <p className="text-xs text-slate-500 italic leading-relaxed">
                "I ordered full body checkups for my aging parents. Phlebotomist followed complete hygiene protocols. Highly recommended!"
              </p>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Vikram Rao</h4>
                <p className="text-[10px] text-slate-400">Bengaluru</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Download App Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-r from-primary to-red-800 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8 shadow-xl shadow-primary/20">
          <div className="space-y-4 max-w-md text-center md:text-left z-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Manage Your Health on the Go
            </h2>
            <p className="text-xs text-red-100/90 leading-relaxed">
              Download the Labconnect Android app to view active orders, download smart reports, and get instant updates directly on your phone.
            </p>
            <div className="flex justify-center md:justify-start pt-2">
              <a
                className="flex items-center gap-2.5 bg-slate-950 text-white rounded-xl px-4 py-2 hover:bg-slate-900 border border-slate-800/80 transition"
                href="https://play.google.com/store"
                target="_blank"
                rel="noreferrer"
              >
                <div className="h-6 w-6 flex items-center justify-center text-primary">
                  <Play className="h-4 w-4 fill-current text-emerald-400" />
                </div>
                <div className="text-left">
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest leading-none">Get it on</p>
                  <p className="text-xs font-semibold leading-none mt-0.5">Google Play Store</p>
                </div>
              </a>
            </div>
          </div>
          <div className="relative hidden md:flex items-center justify-center">
            <Smartphone className="h-48 w-48 text-red-200/20 absolute -translate-y-4 animate-bounce" />
            <Smartphone className="h-40 w-40 text-white drop-shadow-2xl" />
          </div>
        </div>
      </section>
    </div>
  );
}
