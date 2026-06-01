"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ShieldAlert, Sparkles, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { listPackages } from "@/api/packages";
import { addToCart } from "@/api/cart";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const FALLBACK_PACKAGES = [
  { id: "pkg-1", name: "Full Body Checkup", slug: "full-body", description: "Comprehensive health check covering liver, kidney, blood, sugar, and lipid functions. Designed for complete metabolic health tracking.", price: 2999, discountPrice: 1499, parametersCount: 82 },
  { id: "pkg-2", name: "Diabetes Care Package", slug: "diabetes-care", description: "Specialized tests to track and manage blood sugar levels, kidney health, and potential long-term diabetic risks.", price: 1999, discountPrice: 999, parametersCount: 35 },
  { id: "pkg-3", name: "Heart Health Package", slug: "heart-health", description: "Evaluates cardiovascular risk indicators including comprehensive lipid profiles, liver enzymes, and sugar markers.", price: 3499, discountPrice: 1899, parametersCount: 42 }
];

export default function PackagesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const packagesQuery = useQuery({
    queryKey: ["packages"],
    queryFn: () => listPackages()
  });

  const addToCartMutation = useMutation({
    mutationFn: (data: { packageId?: string }) => addToCart(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({
        title: "Added to cart",
        description: "The package is now in your cart."
      });
    },
    onError: (err: any) => {
      toast({
        title: "Authentication needed",
        description: "Please login as a patient to add packages.",
        variant: "destructive"
      });
      router.push("/login");
    }
  });

  const handleAddToCart = (id: string) => {
    if (session?.user?.role === "admin") {
      toast({
        title: "Admin restriction",
        description: "Admins cannot buy health packages."
      });
      return;
    }
    addToCartMutation.mutate({ packageId: id });
  };

  const packages = packagesQuery.data?.data?.length ? packagesQuery.data.data : FALLBACK_PACKAGES;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Full Body Health Packages</h1>
          <p className="text-sm text-slate-500 mt-1">Holistic health screenings at discounted prices from the comfort of home</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {packages.map((pkg: any) => {
            const discPercent = pkg.discountPrice ? Math.round(((pkg.price - pkg.discountPrice) / pkg.price) * 100) : 0;
            return (
              <div
                className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-slate-200/50 transition flex flex-col justify-between"
                key={pkg.id || pkg.slug}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <Sparkles className="h-3 w-3" /> Popular Bundle
                    </span>
                    {discPercent > 0 && (
                      <span className="text-[10px] font-extrabold text-white bg-emerald-600 px-2.5 py-0.5 rounded-full animate-pulse">
                        {discPercent}% OFF
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-800 text-lg">{pkg.name}</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {pkg.description}
                  </p>

                  <div className="space-y-2 mt-6 pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span>Includes {pkg.parametersCount || pkg.tests?.length || 10} test parameters</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span>Free home collection</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span>Smart report in 24 hours</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 flex items-end justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Special Offer</span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-xl font-black text-slate-800">₹{pkg.discountPrice || pkg.price}</span>
                      {pkg.discountPrice && (
                        <span className="text-xs text-slate-400 line-through">₹{pkg.price}</span>
                      )}
                    </div>
                  </div>

                  <Button
                    className="rounded-xl bg-primary text-white hover:bg-primary/95 font-bold shadow-sm shadow-primary/10 transition"
                    onClick={() => handleAddToCart(pkg.id || pkg.slug)}
                  >
                    Add to Cart
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
