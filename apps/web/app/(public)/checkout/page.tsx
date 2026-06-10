"use client";

import { useMutation } from "@tanstack/react-query";
import { CheckCircle, CreditCard, Loader2, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { verifyPayment } from "@/api/orders";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const orderId   = searchParams.get("orderId");
  const paymentId = searchParams.get("paymentId");
  const amount    = parseFloat(searchParams.get("amount") || "0");
  const keyId     = searchParams.get("keyId");

  const [loading, setLoading] = useState(true);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const verifyMutation = useMutation({
    mutationFn: (data: any) => verifyPayment(data),
    onSuccess: () => {
      toast({ title: "Payment Confirmed!", description: "Your test has been booked successfully." });
      router.push(`/order-success?id=${orderId}`);
    },
    onError: (err: any) => {
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (!orderId || !paymentId) { router.push("/cart"); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload  = () => { setScriptLoaded(true); setLoading(false); };
    script.onerror = () => setLoading(false);
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, [orderId, paymentId, router]);

  const handlePay = () => {
    if (!scriptLoaded || !paymentId || !keyId) {
      toast({ title: "Gateway not ready", description: "Use sandbox simulation below.", variant: "destructive" });
      return;
    }
    try {
      const rzp = new (window as any).Razorpay({
        key: keyId,
        amount: Math.round(amount * 100),
        currency: "INR",
        name: "Labconnect Diagnostics",
        description: "Home Sample Collection Booking",
        order_id: paymentId,
        handler: (response: any) => verifyMutation.mutate({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        }),
        theme: { color: "#dc2626" },
      });
      rzp.open();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

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
            {loading ? (
              <div className="flex items-center justify-center gap-3 text-sm text-slate-400 py-6">
                <Loader2 className="h-5 w-5 animate-spin text-red-500" />
                Loading payment gateway...
              </div>
            ) : (
              <>
                <Button
                  className="w-full h-13 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-200 flex items-center justify-center gap-2 py-4"
                  disabled={verifyMutation.isPending}
                  onClick={handlePay}
                >
                  <Zap className="h-4 w-4" />
                  Pay ₹{amount} via Razorpay
                </Button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-100" />
                  <span className="text-[10px] text-slate-400 uppercase font-bold">or sandbox test</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                <Button
                  className="w-full h-12 rounded-2xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 flex items-center justify-center gap-2"
                  disabled={verifyMutation.isPending}
                  onClick={() => verifyMutation.mutate({ orderId: paymentId, status: "paid" })}
                  variant="outline"
                >
                  {verifyMutation.isPending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Sparkles className="h-4 w-4 text-amber-500" />
                  }
                  Simulate Sandbox Payment
                </Button>
              </>
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
