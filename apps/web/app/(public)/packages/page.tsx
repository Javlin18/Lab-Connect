"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ShoppingCart, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { addToCart } from "@/api/cart";
import { listPackages } from "@/api/packages";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const FALLBACK_PACKAGES = [
  { id: "fp1", name: "Full Body Checkup", slug: "full-body", description: "Comprehensive health check covering liver, kidney, blood, sugar, and lipid functions.", price: 2999, discountPrice: 1499, testsCount: 82 },
  { id: "fp2", name: "Diabetes Care Package", slug: "diabetes-care", description: "Specialized tests to track and manage blood sugar levels, kidney health, and diabetic risks.", price: 1999, discountPrice: 999, testsCount: 35 },
  { id: "fp3", name: "Heart Health Package", slug: "heart-health", description: "Evaluates cardiovascular risk indicators including lipid profiles and cardiac biomarkers.", price: 3499, discountPrice: 1899, testsCount: 42 },
  { id: "fp4", name: "Women's Health Package", slug: "womens-health", description: "Hormonal panel, thyroid, vitamins, and bone density markers for women's wellness.", price: 2499, discountPrice: 1299, testsCount: 38 },
];

const isRealId = (id: string) => id && id.startsWith("c");

export default function PackagesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const packagesQuery = useQuery({ queryKey: ["packages"], queryFn: () => listPackages() });

  const addMutation = useMutation({
    mutationFn: (data: { packageId: string }) => addToCart(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({ title: "Added to cart", description: "Package added to your cart." });
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
    if (session.user?.role === "admin") { toast({ title: "Admin cannot purchase packages" }); return false; }
    return true;
  };

  const handleAddToCart = (pkg: any) => {
    if (!guardAuth()) return;
    if (!isRealId(pkg.id)) { toast({ title: "Please seed database first", description: "Run db:seed to add packages.", variant: "destructive" }); return; }
    addMutation.mutate({ packageId: pkg.id });
  };

  const handleBuyNow = (pkg: any) => {
    if (!guardAuth()) return;
    if (!isRealId(pkg.id)) { toast({ title: "Please seed database first", variant: "destructive" }); return; }
    addMutation.mutate({ packageId: pkg.id }, {
      onSuccess: () => router.push("/cart"),
    });
  };

  const packages = packagesQuery.data?.data?.length ? packagesQuery.data.data : FALLBACK_PACKAGES;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-800">Full Body Health Packages</h1>
        <p className="text-sm text-slate-500 mt-1">Comprehensive health screenings bundled at the best prices</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {packages.map((pkg: any) => {
          const disc = pkg.discountPrice ? Math.round(((pkg.price - pkg.discountPrice) / pkg.price) * 100) : 0;
          const testsCount = pkg.testsCount ?? pkg.tests?.length ?? 10;
          return (
            <div
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-emerald-200 transition flex flex-col"
              key={pkg.id || pkg.slug}
            >
              {/* Green top strip */}
              <div className="h-1 bg-gradient-to-r from-emerald-500 to-emerald-400" />

              <div className="p-5 flex flex-col flex-1">
                {/* Badges */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Health Package
                  </span>
                  {disc > 0 && (
                    <span className="text-[10px] font-bold text-white bg-red-600 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <Zap className="h-2.5 w-2.5" /> {disc}% OFF
                    </span>
                  )}
                </div>

                {/* Name + desc */}
                <h3 className="font-bold text-slate-800 text-sm leading-snug">{pkg.name}</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-3 flex-1">{pkg.description}</p>

                {/* Features */}
                <div className="space-y-1.5 mt-4">
                  {[
                    `${testsCount} test parameters`,
                    "Free home collection",
                    "Report in 24 hours",
                  ].map((f) => (
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-600" key={f}>
                      <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>

                {/* Price + buttons */}
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="mb-3">
                    <p className="text-[10px] text-slate-400">Offer Price</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-black text-slate-800">₹{pkg.discountPrice ?? pkg.price}</span>
                      {pkg.discountPrice && (
                        <span className="text-xs text-slate-400 line-through">₹{pkg.price}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 h-9 rounded-xl border border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold"
                      disabled={addMutation.isPending}
                      onClick={() => handleAddToCart(pkg)}
                      variant="ghost"
                    >
                      <ShoppingCart className="h-3.5 w-3.5 mr-1" /> Add to Cart
                    </Button>
                    <Button
                      className="flex-1 h-9 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm"
                      disabled={addMutation.isPending}
                      onClick={() => handleBuyNow(pkg)}
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
    </div>
  );
}
