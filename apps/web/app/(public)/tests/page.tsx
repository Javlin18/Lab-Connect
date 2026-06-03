"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, ShoppingCart, SlidersHorizontal, FlaskConical, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { listTests } from "@/api/tests";
import { listPackages } from "@/api/packages";
import { addToCart } from "@/api/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const categories = ["All", "Blood Tests", "Diabetes", "Heart", "Thyroid", "Vitamins", "Packages"];

const FALLBACK_TESTS = [
  { id: "1", name: "Complete Blood Count (CBC)", slug: "cbc", description: "Evaluates overall health and detects a wide range of disorders.", price: 399, discountPrice: 299, category: "Blood Tests", sampleType: "Blood", preparationInstructions: "No fasting required", turnaroundHours: 12 },
  { id: "2", name: "Thyroid Profile (T3, T4, TSH)", slug: "thyroid", description: "Evaluates thyroid gland function and hormone levels.", price: 799, discountPrice: 499, category: "Thyroid", sampleType: "Blood", preparationInstructions: "Fasting recommended", turnaroundHours: 24 },
  { id: "3", name: "HbA1c (Glycated Hemoglobin)", slug: "hba1c", description: "Reflects average blood sugar levels over the past 3 months.", price: 599, discountPrice: 349, category: "Diabetes", sampleType: "Blood", preparationInstructions: "No fasting required", turnaroundHours: 12 },
  { id: "4", name: "Lipid Profile (Cholesterol)", slug: "lipid", description: "Measures cholesterol and triglyceride levels in the blood.", price: 899, discountPrice: 599, category: "Heart", sampleType: "Blood", preparationInstructions: "10-12 hours fasting required", turnaroundHours: 12 },
  { id: "5", name: "Vitamin D (25-Hydroxy)", slug: "vitamin-d", description: "Measures vitamin D levels to monitor bone health.", price: 1599, discountPrice: 799, category: "Vitamins", sampleType: "Blood", preparationInstructions: "No fasting required", turnaroundHours: 24 }
];

const FALLBACK_PACKAGES = [
  { id: "pkg-1", name: "Full Body Checkup", slug: "full-body", description: "Comprehensive health check covering liver, kidney, blood, and metabolic functions.", price: 2999, discountPrice: 1499, category: "Packages" },
  { id: "pkg-2", name: "Diabetes Care Package", slug: "diabetes-care", description: "Specialized tests to track and manage blood sugar levels.", price: 1999, discountPrice: 999, category: "Packages" },
  { id: "pkg-3", name: "Heart Health Package", slug: "heart-health", description: "Evaluates cardiovascular risks with lipid profiles and sugar checks.", price: 3499, discountPrice: 1899, category: "Packages" }
];

export default function TestsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const testsQuery = useQuery({
    queryKey: ["tests"],
    queryFn: () => listTests()
  });

  const packagesQuery = useQuery({
    queryKey: ["packages"],
    queryFn: () => listPackages()
  });

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
      if (err.message.includes("Unauthorized") || err.message.includes("token") || err.message.includes("JWT")) {
        toast({
          title: "Login Required",
          description: "Please login as a patient to add items to your cart.",
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

  const handleAddToCart = (id: string, isPackage: boolean) => {
    if (session?.user?.role === "admin") {
      toast({
        title: "Admin restriction",
        description: "Admins cannot buy tests."
      });
      return;
    }
    addToCartMutation.mutate(
      isPackage ? { packageId: id } : { testId: id }
    );
  };

  // Merge tests and packages
  const testList = testsQuery.data?.data?.length ? testsQuery.data.data : FALLBACK_TESTS;
  const packageList = packagesQuery.data?.data?.length ? packagesQuery.data.data : FALLBACK_PACKAGES;

  // Filter logic
  const filteredItems = [
    ...testList.map((item) => ({ ...item, isPackage: false })),
    ...packageList.map((item) => ({ ...item, isPackage: true, category: "Packages" }))
  ].filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Diagnostic Tests & Health Packages</h1>
          <p className="text-sm text-slate-500 mt-1">Book tests and packages for accurate home collection diagnostics</p>
        </div>

        {/* Search and filter controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9 rounded-xl border-slate-200"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by test name or keyword..."
              type="text"
              value={searchQuery}
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {categories.map((cat) => (
              <Button
                className={`rounded-xl text-xs font-semibold px-4 py-2 border transition ${
                  selectedCategory === cat
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"
                }`}
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                variant="ghost"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* List Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-100/50">
            <FlaskConical className="h-12 w-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 mt-4">No Diagnostics Found</h3>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or changing filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item: any) => {
              const discPercent = item.discountPrice ? Math.round(((item.price - item.discountPrice) / item.price) * 100) : 0;
              return (
                <div
                  className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-slate-200/50 transition flex flex-col justify-between"
                  key={item.id || item.slug}
                >
                  <div>
                    {/* Header tags */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="inline-block text-[10px] font-bold text-primary bg-red-50 px-2 py-0.5 rounded-full">
                        {item.category}
                      </span>
                      {discPercent > 0 && (
                        <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {discPercent}% OFF
                        </span>
                      )}
                    </div>

                    <Link className="group" href={`/tests/${item.slug}`}>
                      <h3 className="font-bold text-slate-800 text-base leading-tight group-hover:text-primary transition line-clamp-1">
                        {item.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 h-8 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Meta Info */}
                    {!item.isPackage && (
                      <div className="flex items-center gap-4 text-[10px] text-slate-400 mt-4">
                        <span className="flex items-center gap-0.5 font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded">
                          🩸 {item.sampleType}
                        </span>
                        <span className="flex items-center gap-0.5 font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded">
                          ⏱ {item.turnaroundHours} hrs
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions & Price */}
                  <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-black text-slate-800">₹{item.discountPrice || item.price}</span>
                        {item.discountPrice && (
                          <span className="text-xs text-slate-400 line-through">₹{item.price}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {!item.isPackage && (
                        <Link href={`/tests/${item.slug}`}>
                          <Button className="h-9 rounded-xl border-slate-200 text-slate-600 text-xs px-3 hover:bg-slate-50" variant="outline">
                            Details
                          </Button>
                        </Link>
                      )}
                      <Button
                        className="h-9 rounded-xl bg-primary text-white hover:bg-primary/95 text-xs font-bold shadow-sm shadow-primary/10 transition"
                        onClick={() => handleAddToCart(item.id || item.slug, item.isPackage)}
                      >
                        Add to Cart
                      </Button>
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
