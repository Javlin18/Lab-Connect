"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, CheckCircle, Clock, FlaskConical, ShieldAlert, Sparkles } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { getTestBySlug, listTests } from "@/api/tests";
import { addToCart } from "@/api/cart";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const FALLBACK_TESTS = [
  { id: "1", name: "Complete Blood Count (CBC)", slug: "cbc", description: "Evaluates overall health and detects a wide range of disorders, including anemia, infection, and leukemia.", price: 399, discountPrice: 299, category: "Blood Tests", sampleType: "Blood", preparationInstructions: "No fasting required. Inform your physician about any medications you are taking.", turnaroundHours: 12, parameters: ["Hemoglobin (Hb)", "Total Leucocyte Count (WBC)", "Red Blood Cell Count (RBC)", "Platelet Count", "Differential Leukocyte Count (DLC)", "Packed Cell Volume (PCV)"] },
  { id: "2", name: "Thyroid Profile (T3, T4, TSH)", slug: "thyroid", description: "Evaluates thyroid gland function and hormone levels, helping diagnose hyperthyroidism or hypothyroidism.", price: 799, discountPrice: 499, category: "Thyroid", sampleType: "Blood", preparationInstructions: "10-12 hours overnight fasting recommended. Do not take thyroid medication before blood collection on the morning of the test.", turnaroundHours: 24, parameters: ["Total Triiodothyronine (T3)", "Total Thyroxine (T4)", "Thyroid Stimulating Hormone (TSH)"] },
  { id: "3", name: "HbA1c (Glycated Hemoglobin)", slug: "hba1c", description: "Reflects average blood sugar levels over the past 3 months, key for diagnosing and managing diabetes.", price: 599, discountPrice: 349, category: "Diabetes", sampleType: "Blood", preparationInstructions: "No fasting required. Can be done at any time of the day.", turnaroundHours: 12, parameters: ["HbA1c Percentage", "Estimated Average Glucose (eAG)"] },
  { id: "4", name: "Lipid Profile (Cholesterol)", slug: "lipid", description: "Measures cholesterol and triglyceride levels in the blood, essential for assessing cardiovascular health and cardiac risk factors.", price: 899, discountPrice: 599, category: "Heart", sampleType: "Blood", preparationInstructions: "10-12 hours strict fasting required. Water is permitted.", turnaroundHours: 12, parameters: ["Total Cholesterol", "HDL Cholesterol (Good)", "LDL Cholesterol (Bad)", "VLDL Cholesterol", "Triglycerides", "Total/HDL Ratio"] },
  { id: "5", name: "Vitamin D (25-Hydroxy)", slug: "vitamin-d", description: "Measures vitamin D levels to monitor bone health, calcium absorption, and overall immune system functioning.", price: 1599, discountPrice: 799, category: "Vitamins", sampleType: "Blood", preparationInstructions: "No fasting required. Morning sample is preferred.", turnaroundHours: 24, parameters: ["25-Hydroxy Vitamin D", "Vitamin D3", "Vitamin D2"] }
];

export default function TestDetailPage() {
  const router = useRouter();
  const { slug } = useParams() as { slug: string };
  const { data: session } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const testQuery = useQuery({
    queryKey: ["test", slug],
    queryFn: () => getTestBySlug(slug),
    retry: false
  });

  const allTestsQuery = useQuery({
    queryKey: ["tests"],
    queryFn: () => listTests()
  });

  const addToCartMutation = useMutation({
    mutationFn: (data: { testId?: string }) => addToCart(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({
        title: "Added to cart",
        description: "The test is now in your cart."
      });
    },
    onError: (err: any) => {
      toast({
        title: "Authentication needed",
        description: "Please login as a patient to add tests.",
        variant: "destructive"
      });
      router.push("/login");
    }
  });

  // Handle local mock fallback
  const test = testQuery.data?.data || FALLBACK_TESTS.find((t) => t.slug === slug);
  const testsList = allTestsQuery.data?.data?.length ? allTestsQuery.data.data : FALLBACK_TESTS;
  const relatedTests = testsList.filter((t) => t.slug !== slug && t.category === test?.category).slice(0, 3);

  if (!test) {
    return (
      <div className="text-center py-24 mx-auto max-w-md">
        <AlertCircle className="h-12 w-12 text-slate-300 mx-auto" />
        <h3 className="font-bold text-slate-800 mt-4 text-lg">Test Not Found</h3>
        <p className="text-xs text-slate-400 mt-1">We couldn't locate the requested diagnostic test.</p>
        <Link href="/tests">
          <Button className="mt-6 rounded-xl" variant="outline">Back to tests</Button>
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (session?.user?.role === "admin") {
      toast({
        title: "Admin restriction",
        description: "Admins cannot buy tests."
      });
      return;
    }
    addToCartMutation.mutate({ testId: test.id || test.slug });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <Link className="flex items-center gap-1 text-xs text-slate-500 hover:text-primary transition mb-8" href="/tests">
        <ArrowLeft className="h-4 w-4" /> Back to All Tests
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Main Info Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
            <span className="inline-block text-xs font-bold text-primary bg-red-50 px-3 py-1 rounded-full mb-4">
              {test.category}
            </span>
            <h1 className="text-3xl font-black text-slate-800 leading-tight">{test.name}</h1>
            <p className="text-sm text-slate-500 mt-3 leading-relaxed">{test.description}</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mt-8 pt-8 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                  <FlaskConical className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Sample Type</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{test.sampleType}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Turnaround Time</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">Report in {test.turnaroundHours}h</p>
                </div>
              </div>
              <div className="flex items-center gap-3 col-span-2 sm:col-span-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Lab Certification</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">NABL Accredited</p>
                </div>
              </div>
            </div>
          </div>

          {/* Preparation Instructions */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" /> Preparation Instructions
            </h2>
            <p className="text-xs text-slate-500 mt-3 leading-relaxed bg-red-50/30 p-4 rounded-2xl border border-red-50/50">
              {test.preparationInstructions}
            </p>
          </div>

          {/* What is tested (Parameters) */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-2">Parameters Tested ({test.parameters?.length || 0})</h2>
            <p className="text-xs text-slate-400 mb-6">List of biomarkers included in this diagnostic profile:</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {test.parameters?.map((param: string, index: number) => (
                <div className="flex items-center gap-2 bg-slate-50/50 px-4 py-3 rounded-xl border border-slate-100/30" key={index}>
                  <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-xs font-semibold text-slate-700">{param}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md sticky top-24">
            <h3 className="font-bold text-slate-800 text-sm">Booking Summary</h3>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-3xl font-black text-slate-800">₹{test.discountPrice || test.price}</span>
              {test.discountPrice && (
                <span className="text-sm text-slate-400 line-through">₹{test.price}</span>
              )}
            </div>
            {test.discountPrice && (
              <span className="inline-block text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2">
                Save ₹{test.price - test.discountPrice} ({Math.round(((test.price - test.discountPrice) / test.price) * 100)}% off)
              </span>
            )}

            <ul className="text-xs text-slate-500 mt-6 space-y-2 border-t border-slate-100 pt-4">
              <li className="flex justify-between"><span>✓ Free Doctor Report Review</span></li>
              <li className="flex justify-between"><span>✓ Free Doorstep Sample Pick</span></li>
              <li className="flex justify-between"><span>✓ Safe & Hygienic Collection</span></li>
            </ul>

            <Button
              className="w-full mt-8 rounded-2xl bg-primary hover:bg-primary/95 text-white py-6 font-bold shadow-lg shadow-primary/20 transition hover:scale-102"
              onClick={handleAddToCart}
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </div>

      {/* Related Tests */}
      {relatedTests.length > 0 && (
        <div className="mt-16 pt-12 border-t border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Related Tests</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {relatedTests.map((t: any) => (
              <Link className="group bg-white border border-slate-100 hover:border-slate-200/50 hover:shadow-lg p-5 rounded-2xl transition" href={`/tests/${t.slug}`} key={t.id || t.slug}>
                <span className="text-[10px] font-bold text-primary bg-red-50 px-2 py-0.5 rounded-full">
                  {t.category}
                </span>
                <h3 className="font-bold text-slate-800 text-sm mt-3 group-hover:text-primary transition line-clamp-1">{t.name}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 h-8">{t.description}</p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-slate-700">₹{t.discountPrice || t.price}</span>
                  <span className="text-[10px] text-primary font-bold group-hover:underline">Book Now →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
