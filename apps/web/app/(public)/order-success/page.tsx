"use client";

import { CheckCircle2, ChevronRight, FileText, Home, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id") || "Unknown";

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center space-y-8">
      <div className="bg-white border border-slate-100 p-8 rounded-3xl shadow-xl space-y-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 mx-auto animate-bounce">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Booking Confirmed!</h1>
          <p className="text-xs text-slate-400">Thank you for booking with Labconnect. Your health is our priority.</p>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50 space-y-1.5 text-left text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Order ID:</span>
            <span className="font-bold text-slate-700">{orderId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Status:</span>
            <span className="font-bold text-emerald-600 flex items-center gap-0.5">Paid ✓</span>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
          <p>
            A NABL-certified Phlebotomist will visit your collection address at your selected slot. Please keep a copy of your prescription (if any) ready.
          </p>
        </div>

        <div className="space-y-3 pt-4">
          <Link href="/dashboard">
            <Button className="w-full rounded-2xl bg-primary hover:bg-primary/95 text-white py-6 font-bold shadow-lg shadow-primary/20 transition hover:scale-102 flex items-center justify-center gap-1.5">
              <FileText className="h-4 w-4" /> Go to My Orders
            </Button>
          </Link>

          <Link href="/">
            <Button className="w-full rounded-2xl border-slate-200 text-slate-600 py-6 hover:bg-slate-50 font-bold transition hover:scale-102 flex items-center justify-center gap-1.5" variant="outline">
              <Home className="h-4 w-4" /> Return to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
