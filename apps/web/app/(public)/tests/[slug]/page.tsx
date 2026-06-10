"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  FlaskConical,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Zap
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { addToCart } from "@/api/cart";
import { getTestBySlug, listTests } from "@/api/tests";
import { buttonVariants } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const FALLBACK_TESTS = [
  { id: "1", name: "Complete Blood Count (CBC)", slug: "cbc", description: "Evaluates overall health and detects a wide range of disorders, including anemia, infection, and leukemia.", price: 399, discountPrice: 299, category: "Blood Tests", sampleType: "Blood", preparationInstructions: "No fasting required. Inform your physician about any medications you are taking.", turnaroundHours: 12, parameters: ["Hemoglobin (Hb)", "Total Leucocyte Count (WBC)", "Red Blood Cell Count (RBC)", "Platelet Count", "Differential Leukocyte Count (DLC)", "Packed Cell Volume (PCV)"] },
  { id: "2", name: "Thyroid Profile (T3, T4, TSH)", slug: "thyroid", description: "Evaluates thyroid gland function and hormone levels, helping diagnose hyperthyroidism or hypothyroidism.", price: 799, discountPrice: 499, category: "Thyroid", sampleType: "Blood", preparationInstructions: "10–12 hours overnight fasting recommended.", turnaroundHours: 24, parameters: ["Total Triiodothyronine (T3)", "Total Thyroxine (T4)", "Thyroid Stimulating Hormone (TSH)"] },
  { id: "3", name: "HbA1c (Glycated Hemoglobin)", slug: "hba1c", description: "Reflects average blood sugar levels over the past 3 months, key for diagnosing and managing diabetes.", price: 599, discountPrice: 349, category: "Diabetes", sampleType: "Blood", preparationInstructions: "No fasting required. Can be done at any time.", turnaroundHours: 12, parameters: ["HbA1c Percentage", "Estimated Average Glucose (eAG)"] },
  { id: "4", name: "Lipid Profile (Cholesterol)", slug: "lipid", description: "Measures cholesterol and triglyceride levels, essential for assessing cardiovascular risk.", price: 899, discountPrice: 599, category: "Heart", sampleType: "Blood", preparationInstructions: "10–12 hours strict fasting required. Water is permitted.", turnaroundHours: 12, parameters: ["Total Cholesterol", "HDL Cholesterol (Good)", "LDL Cholesterol (Bad)", "VLDL Cholesterol", "Triglycerides", "Total/HDL Ratio"] },
  { id: "5", name: "Vitamin D (25-Hydroxy)", slug: "vitamin-d", description: "Measures vitamin D levels to monitor bone health and immune function.", price: 1599, discountPrice: 799, category: "Vitamins", sampleType: "Blood", preparationInstructions: "No fasting required. Morning sample preferred.", turnaroundHours: 24, parameters: ["25-Hydroxy Vitamin D", "Vitamin D3", "Vitamin D2"] },
];

export default function TestDetailPage() {
  const router = useRouter();
  const { slug } = useParams() as { slug: string };
  const { data: session } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const testQuery = useQuery({ queryKey: ["test", slug], queryFn: () => getTestBySlug(slug), retry: false });
  const allTestsQuery = useQuery({ queryKey: ["tests"], queryFn: () => listTests() });

  const addMutation = useMutation({
    mutationFn: (data: { testId?: string }) => addToCart(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({ title: "Added to cart", description: "Test added to your cart." });
    },
    onError: () => {
      toast({ title: "Login required", description: "Please login as a patient.", variant: "destructive" });
      router.push("/login");
    },
  });

  const test = testQuery.data?.data || FALLBACK_TESTS.find((t) => t.slug === slug);
  const allTests = allTestsQuery.data?.data?.length ? allTestsQuery.data.data : FALLBACK_TESTS;
  const related = allTests.filter((t) => t.slug !== slug && t.category === test?.category).slice(0, 3);

  if (!test) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">Test Not Found</h3>
          <p className="text-sm text-slate-400 mt-2">We couldn't find this diagnostic test.</p>
          <Link className={buttonVariants({ variant: "outline", className: "mt-5 rounded-xl" })} href="/tests">
            Back to Tests
          </Link>
        </div>
      </div>
    );
  }

  const disc = test.discountPrice ? Math.round(((test.price - test.discountPrice) / test.price) * 100) : 0;

  const handleAdd = () => {
    if (session?.user?.role === "admin") { toast({ title: "Admin cannot purchase" }); return; }
    addMutation.mutate({ testId: test.id || test.slug });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <Link className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600 transition mb-8 font-medium" href="/tests">
        <ArrowLeft className="h-3.5 w-3.5" /> All Tests
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Left ────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Hero card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-red-600 to-red-400" />
            <div className="p-7">
              <span className="inline-block text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full mb-4">
                {test.category}
              </span>
              <h1 className="text-2xl font-black text-slate-900 leading-tight">{test.name}</h1>
              <p className="text-sm text-slate-500 mt-3 leading-relaxed">{test.description}</p>

              {/* Meta chips */}
              <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-slate-50">
                {[
                  { icon: FlaskConical, label: "Sample Type", val: test.sampleType },
                  { icon: Clock,        label: "Report Time", val: `${test.turnaroundHours} hours` },
                  { icon: Star,         label: "Accreditation", val: "NABL Certified" },
                  { icon: Sparkles,     label: "Parameters", val: `${test.parameters?.length || 0} included` },
                ].map((m) => (
                  <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100" key={m.label}>
                    <div className="h-8 w-8 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                      <m.icon className="h-4 w-4 text-red-500" />
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">{m.label}</p>
                      <p className="text-xs font-bold text-slate-700 mt-0.5">{m.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Preparation card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-7 py-5 border-b border-slate-50 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-500" />
              <h2 className="font-bold text-slate-800 text-sm">Preparation Instructions</h2>
            </div>
            <div className="p-7">
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                <p className="text-sm text-slate-600 leading-relaxed">{test.preparationInstructions}</p>
              </div>
            </div>
          </div>

          {/* Parameters card */}
          {test.parameters && test.parameters.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-7 py-5 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-red-500" />
                  <h2 className="font-bold text-slate-800 text-sm">Parameters Tested</h2>
                </div>
                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                  {test.parameters.length} parameters
                </span>
              </div>
              <div className="p-7">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {test.parameters.map((param: string, i: number) => (
                    <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100" key={i}>
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-xs font-semibold text-slate-700">{param}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right sidebar ────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-md overflow-hidden sticky top-24">
            {/* Price header */}
            <div className="bg-gradient-to-br from-red-600 to-red-500 px-6 py-6 text-white text-center">
              <p className="text-[10px] uppercase font-bold text-red-200 tracking-widest">Offer Price</p>
              <div className="flex items-end justify-center gap-2 mt-2">
                <span className="text-4xl font-black">₹{test.discountPrice ?? test.price}</span>
                {test.discountPrice && (
                  <span className="text-sm text-red-300 line-through mb-1">₹{test.price}</span>
                )}
              </div>
              {disc > 0 && (
                <div className="inline-flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-xs font-bold mt-2">
                  <Zap className="h-3 w-3" /> Save {disc}% — ₹{test.price - (test.discountPrice ?? test.price)} off
                </div>
              )}
            </div>

            {/* Features */}
            <div className="px-6 py-5 border-b border-slate-50 space-y-2.5">
              {[
                "Free Home Sample Collection",
                "NABL Certified Laboratory",
                "Digital Report in 12–24 hrs",
                "Free Doctor Report Consultation",
              ].map((f) => (
                <div className="flex items-center gap-2.5 text-xs text-slate-600" key={f}>
                  <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" /> {f}
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="px-6 py-5">
              <button
                className="w-full h-12 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-100 transition flex items-center justify-center gap-2 disabled:opacity-60"
                disabled={addMutation.isPending}
                onClick={handleAdd}
                type="button"
              >
                <ShoppingCart className="h-4 w-4" />
                {addMutation.isPending ? "Adding..." : "Add to Cart"}
              </button>
              <p className="text-center text-[10px] text-slate-400 mt-3 flex items-center justify-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-400" /> 256-bit SSL secured payment
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Related tests */}
      {related.length > 0 && (
        <div className="mt-14 pt-10 border-t border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Related Tests in {test.category}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {related.map((t: any) => {
              const rd = t.discountPrice ? Math.round(((t.price - t.discountPrice) / t.price) * 100) : 0;
              return (
                <Link
                  className="group bg-white border border-slate-100 hover:border-red-200 hover:shadow-lg p-5 rounded-2xl transition flex flex-col justify-between"
                  href={`/tests/${t.slug}`}
                  key={t.id || t.slug}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{t.category}</span>
                      {rd > 0 && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{rd}% OFF</span>}
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm group-hover:text-red-600 transition line-clamp-2">{t.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{t.description}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                    <div>
                      <p className="font-black text-slate-800">₹{t.discountPrice ?? t.price}</p>
                      {t.discountPrice && <p className="text-[9px] text-slate-400 line-through">₹{t.price}</p>}
                    </div>
                    <span className="text-[10px] text-red-500 font-bold group-hover:underline">Book →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
