"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Droplet, FlaskConical, Search, ShoppingCart, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Suspense, useState } from "react";

import { addToCart } from "@/api/cart";
import { listPackages } from "@/api/packages";
import { listTests } from "@/api/tests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["All", "Blood Tests", "Diabetes", "Heart", "Thyroid", "Vitamins", "Packages"];

const FALLBACK_TESTS = [
  { id: "f1", name: "Complete Blood Count (CBC)", slug: "cbc", description: "Evaluates overall health and detects a wide range of disorders.", price: 399, discountPrice: 299, category: "Blood Tests", sampleType: "Blood", turnaroundHours: 12 },
  { id: "f2", name: "Thyroid Profile (T3, T4, TSH)", slug: "thyroid", description: "Evaluates thyroid gland function and hormone levels.", price: 799, discountPrice: 499, category: "Thyroid", sampleType: "Blood", turnaroundHours: 24 },
  { id: "f3", name: "HbA1c (Glycated Hemoglobin)", slug: "hba1c", description: "Reflects average blood sugar levels over the past 3 months.", price: 599, discountPrice: 349, category: "Diabetes", sampleType: "Blood", turnaroundHours: 12 },
  { id: "f4", name: "Lipid Profile (Cholesterol)", slug: "lipid", description: "Measures cholesterol and triglyceride levels in the blood.", price: 899, discountPrice: 599, category: "Heart", sampleType: "Blood", turnaroundHours: 12 },
  { id: "f5", name: "Vitamin D (25-Hydroxy)", slug: "vitamin-d", description: "Measures vitamin D levels to monitor bone health.", price: 1599, discountPrice: 799, category: "Vitamins", sampleType: "Blood", turnaroundHours: 24 },
];

const FALLBACK_PACKAGES = [
  { id: "fp1", name: "Full Body Checkup", slug: "full-body", description: "Comprehensive health check covering liver, kidney, blood, and metabolic functions.", price: 2999, discountPrice: 1499, category: "Packages" },
  { id: "fp2", name: "Diabetes Care Package", slug: "diabetes-care", description: "Specialized tests to track and manage blood sugar levels.", price: 1999, discountPrice: 999, category: "Packages" },
  { id: "fp3", name: "Heart Health Package", slug: "heart-health", description: "Evaluates cardiovascular risks with lipid profiles and sugar checks.", price: 3499, discountPrice: 1899, category: "Packages" },
];

// Check if ID is a real DB id (cuid — starts with 'c') vs fallback
const isRealId = (id: string) => id && id.startsWith("c");

function TestsPageInner() {
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const testsQuery = useQuery({ queryKey: ["tests"], queryFn: () => listTests() });
  const packagesQuery = useQuery({ queryKey: ["packages"], queryFn: () => listPackages() });

  const addMutation = useMutation({
    mutationFn: (data: { testId?: string; packageId?: string }) => addToCart(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({ title: "Added to cart", description: "Item saved to your cart." });
    },
    onError: (err: any) => {
      if (err.message?.includes("Unauthorized") || err.message?.includes("JWT") || err.message?.includes("token")) {
        toast({ title: "Login required", description: "Please login as a patient.", variant: "destructive" });
        router.push("/login");
      } else {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    },
  });

  const guardAuth = () => {
    if (!session) { toast({ title: "Login required", description: "Please login as a patient.", variant: "destructive" }); router.push("/login"); return false; }
    if (session.user?.role === "admin") { toast({ title: "Admin cannot purchase tests" }); return false; }
    return true;
  };

  const handleAddToCart = (item: any, isPackage: boolean) => {
    if (!guardAuth()) return;
    // Fallback items — redirect to detail page
    if (!isRealId(item.id)) { router.push(isPackage ? "/packages" : `/tests/${item.slug}`); return; }
    addMutation.mutate(isPackage ? { packageId: item.id } : { testId: item.id });
  };

  const handleBuyNow = (item: any, isPackage: boolean) => {
    if (!guardAuth()) return;
    if (!isRealId(item.id)) { router.push(isPackage ? "/packages" : `/tests/${item.slug}`); return; }
    addMutation.mutate(isPackage ? { packageId: item.id } : { testId: item.id }, {
      onSuccess: () => router.push("/cart"),
    });
  };

  const testList = testsQuery.data?.data?.length ? testsQuery.data.data : FALLBACK_TESTS;
  const packageList = packagesQuery.data?.data?.length ? packagesQuery.data.data : FALLBACK_PACKAGES;

  const filteredItems = [
    ...testList.map((item) => ({ ...item, isPackage: false })),
    ...packageList.map((item) => ({ ...item, isPackage: true, category: "Packages" })),
  ].filter((item) => {
    const matchCat = selectedCategory === "All" || item.category === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item as any).description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-slate-800">Diagnostic Tests & Health Packages</h1>
          <p className="text-sm text-slate-500 mt-1">Book home sample collection tests at NABL certified labs</p>
        </div>

        {/* Search + Category filter */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-10 rounded-xl border-slate-200 h-10"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tests, e.g. CBC, Thyroid..."
              value={searchQuery}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                className={`h-8 px-3 rounded-xl text-xs font-semibold transition border ${
                  selectedCategory === cat
                    ? "bg-red-600 text-white border-red-600 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-red-300 hover:text-red-600"
                }`}
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                type="button"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border border-slate-100">
            <FlaskConical className="h-12 w-12 text-slate-300 mb-3" />
            <h3 className="font-bold text-slate-700">No Tests Found</h3>
            <p className="text-xs text-slate-400 mt-1">Try adjusting search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map((item: any) => {
              const disc = item.discountPrice ? Math.round(((item.price - item.discountPrice) / item.price) * 100) : 0;
              return (
                <div
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-red-200 transition flex flex-col"
                  key={item.id || item.slug}
                >
                  {/* Top colored strip */}
                  <div className={`h-1 ${item.isPackage ? "bg-gradient-to-r from-emerald-500 to-emerald-400" : "bg-gradient-to-r from-red-600 to-red-400"}`} />

                  <div className="p-5 flex flex-col flex-1">
                    {/* Badges */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.isPackage ? "text-emerald-700 bg-emerald-50" : "text-red-600 bg-red-50"}`}>
                        {item.category}
                      </span>
                      {disc > 0 && (
                        <span className="text-[10px] font-bold text-white bg-red-600 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <Zap className="h-2.5 w-2.5" /> {disc}% OFF
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <Link className="group" href={item.isPackage ? "/packages" : `/tests/${item.slug}`}>
                      <h3 className="font-bold text-slate-800 text-sm leading-snug group-hover:text-red-600 transition line-clamp-2">
                        {item.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed flex-1">
                      {item.description}
                    </p>

                    {/* Meta chips */}
                    {!item.isPackage && (
                      <div className="flex gap-2 mt-3">
                        <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full font-medium"><Droplet className="h-3 w-3" /> {item.sampleType}</span>
                        <span className="text-[10px] text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full font-medium">⏱ {item.turnaroundHours}h</span>
                      </div>
                    )}

                    {/* Price + Buttons */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="text-lg font-black text-slate-800">₹{item.discountPrice ?? item.price}</span>
                          {item.discountPrice && (
                            <span className="text-xs text-slate-400 line-through ml-1.5">₹{item.price}</span>
                          )}
                        </div>
                        {!item.isPackage && (
                          <Link className="text-[10px] text-red-600 font-semibold hover:underline" href={`/tests/${item.slug}`}>
                            View Details →
                          </Link>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 h-9 rounded-xl border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 text-xs font-bold"
                          disabled={addMutation.isPending}
                          onClick={() => handleAddToCart(item, item.isPackage)}
                          variant="ghost"
                        >
                          <ShoppingCart className="h-3.5 w-3.5 mr-1" /> Add to Cart
                        </Button>
                        <Button
                          className="flex-1 h-9 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm"
                          disabled={addMutation.isPending}
                          onClick={() => handleBuyNow(item, item.isPackage)}
                        >
                          Buy Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TestsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <TestsPageInner />
    </Suspense>
  );
}
