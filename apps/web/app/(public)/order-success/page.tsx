"use client";

import { Check, CheckCircle2, ClipboardList, Home, Phone, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { buttonVariants } from "@/components/ui/button";

const steps = [
  { label: "Payment Confirmed",      done: true },
  { label: "Appointment Created",    done: true },
  { label: "Phlebotomist Assigning", done: false },
  { label: "Home Collection",        done: false },
  { label: "Report Ready",           done: false },
];

function OrderSuccessPageInner() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id") || "—";

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md space-y-4">

        {/* Main success card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
          {/* Green header */}
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 px-8 py-8 text-white text-center">
            <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h1 className="text-2xl font-black">Booking Confirmed!</h1>
            <p className="text-sm text-emerald-100 mt-1">Your home collection is scheduled</p>
          </div>

          {/* Order ID */}
          <div className="px-8 py-5 border-b border-slate-50">
            <div className="flex items-center justify-between bg-slate-50 rounded-2xl px-5 py-3">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Order ID</p>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{orderId}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Status</p>
                <p className="font-bold text-emerald-600 text-sm mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Paid
                </p>
              </div>
            </div>
          </div>

          {/* Progress tracker */}
          <div className="px-8 py-5 border-b border-slate-50">
            <p className="text-xs font-bold text-slate-600 mb-4">Your Order Progress</p>
            <div className="space-y-3">
              {steps.map((step, i) => (
                <div className="flex items-center gap-3" key={i}>
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    step.done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                  }`}>
                    {step.done ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <p className={`text-sm font-medium ${step.done ? "text-slate-800" : "text-slate-400"}`}>
                    {step.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="px-8 py-5 border-b border-slate-50">
            <p className="text-xs text-slate-500 leading-relaxed">
              A <span className="font-semibold text-slate-700">NABL-certified phlebotomist</span> will visit your address at the selected time slot. Please keep any prescription ready if applicable.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-600 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <Phone className="h-4 w-4 text-blue-500 flex-shrink-0" />
              Need help? Call 1800-200-4567
            </div>
          </div>

          {/* Actions */}
          <div className="px-8 py-6 space-y-3">
            <Link
              className={buttonVariants({ className: "w-full h-12 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-100 justify-center gap-2" })}
              href="/dashboard/my-bookings"
            >
              <ClipboardList className="h-4 w-4" /> View My Bookings
            </Link>
            <Link
              className={buttonVariants({ variant: "outline", className: "w-full h-12 rounded-2xl border-slate-200 text-slate-600 justify-center gap-2" })}
              href="/"
            >
              <Home className="h-4 w-4" /> Back to Home
            </Link>
          </div>
        </div>

        {/* Trust row */}
        <div className="flex items-center justify-center gap-6 text-[10px] text-slate-400">
          {["NABL Accredited", "256-bit SSL", "Free Cancellation"].map((t) => (
            <div className="flex items-center gap-1" key={t}>
              <ShieldCheck className="h-3 w-3 text-emerald-400" /> {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <OrderSuccessPageInner />
    </Suspense>
  );
}
