"use client";

import { AlertCircle, CheckCircle, CreditCard, Loader2, ShieldCheck, Zap } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { createPaymentOrder } from "@/api/payments";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

function CheckoutPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const orderId = searchParams.get("orderId");
  const amount  = parseFloat(searchParams.get("amount") || "0");

  const [pgOrderId, setPgOrderId] = useState<string | null>(null);
  const [pgRedirectUrl, setPgRedirectUrl] = useState<string>("");
  const [pgError, setPgError] = useState<string | null>(null);
  const [pgLoading, setPgLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // ── Create PhonePe order via backend ──────────────────────────────────────
  useEffect(() => {
    if (!orderId || !amount) {
      if (!orderId) router.push("/cart");
      return;
    }
    
    setPgLoading(true);
    setPgError(null);

    createPaymentOrder({ orderId, amount })
      .then((res) => {
        setPgOrderId(res.data.phonepeOrderId);
        setPgRedirectUrl(res.data.redirectUrl);
      })
      .catch((err) => {
        setPgError(err.message ?? "Failed to initialize payment");
      })
      .finally(() => setPgLoading(false));
  }, [orderId, amount, router]);

  // ── Redirect to PhonePe ──────────────────────────────────────────────────
  const handlePay = () => {
    if (!pgOrderId || !pgRedirectUrl) {
      toast({ title: "Not ready", description: pgError ?? "Please wait.", variant: "destructive" });
      return;
    }
    setIsRedirecting(true);
    window.location.href = pgRedirectUrl;
  };

  const isInit  = pgLoading;
  const isReady = !!pgOrderId && !!pgRedirectUrl;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md space-y-4">

        {/* Main checkout card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
          {/* Header strip */}
          <div className="bg-gradient-to-r from-red-600 to-red-500 px-8 py-6 text-white text-center">
            <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
              <CreditCard className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-black">Secure Checkout</h1>
            <p className="text-xs text-red-100 mt-1">Complete payment to confirm your booking</p>
          </div>

          {/* Order summary */}
          <div className="px-8 py-6 border-b border-slate-50">
            <div className="bg-slate-50 rounded-2xl p-5 text-center space-y-1">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Amount to Pay</p>
              <p className="text-4xl font-black text-slate-900">₹{amount}</p>
              <p className="text-[10px] text-slate-400">Order #{orderId?.slice(0, 8)}…</p>
            </div>
          </div>

          {/* Payment buttons */}
          <div className="px-8 py-6 space-y-4">
            {isInit ? (
              <div className="flex items-center justify-center gap-3 text-sm text-slate-400 py-6">
                <Loader2 className="h-5 w-5 animate-spin text-red-500" />
                Initialising payment gateway...
              </div>
            ) : pgError ? (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left">
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-800">Payment gateway unavailable</p>
                  <p className="text-xs text-amber-600 mt-1">{pgError}</p>
                  <p className="text-xs text-amber-600 mt-2">
                    Check the PhonePe credentials on the API server and restart the backend.
                  </p>
                </div>
              </div>
            ) : (
              <Button
                className="w-full h-13 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-200 flex items-center justify-center gap-2 py-4"
                disabled={!isReady || isRedirecting}
                onClick={handlePay}
              >
                {isRedirecting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Redirecting...</>
                ) : (
                  <><Zap className="h-4 w-4" /> Pay ₹{amount} Securely</>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: ShieldCheck, label: "SSL Encrypted" },
            { icon: CheckCircle, label: "NABL Certified" },
            { icon: CreditCard, label: "Secure Gateway" },
          ].map((b) => (
            <div className="bg-white rounded-2xl border border-slate-100 p-3 text-center shadow-sm" key={b.label}>
              <b.icon className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
              <p className="text-[10px] text-slate-500 font-medium">{b.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CheckoutPageInner />
    </Suspense>
  );
}
