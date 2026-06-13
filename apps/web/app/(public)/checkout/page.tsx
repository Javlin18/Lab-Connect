"use client";

import { useMutation } from "@tanstack/react-query";
import { AlertCircle, CheckCircle, CreditCard, Loader2, ShieldCheck, Zap } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { createRazorpayOrder, verifyRazorpayPayment } from "@/api/payments";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const orderId = searchParams.get("orderId");
  const amount  = parseFloat(searchParams.get("amount") || "0");

  const [scriptLoaded,  setScriptLoaded]  = useState(false);
  const [scriptLoading, setScriptLoading] = useState(true);

  // Real Razorpay order (from /payments/create-order)
  const [rzpOrderId, setRzpOrderId] = useState<string | null>(null);
  const [rzpAmount,  setRzpAmount]  = useState<number>(0);
  const [rzpKeyId,   setRzpKeyId]   = useState<string>("");
  const [rzpError,   setRzpError]   = useState<string | null>(null);
  const [rzpLoading, setRzpLoading] = useState(true);

  // ── Load Razorpay script ───────────────────────────────────────────────────
  useEffect(() => {
    if (!orderId) { router.push("/cart"); return; }

    if (document.querySelector('script[src*="checkout.razorpay.com"]')) {
      setScriptLoaded(true);
      setScriptLoading(false);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload  = () => { setScriptLoaded(true); setScriptLoading(false); };
    script.onerror = () => setScriptLoading(false);
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, [orderId, router]);

  // ── Create Razorpay order via backend ──────────────────────────────────────
  useEffect(() => {
    if (!orderId || !amount) return;
    setRzpLoading(true);
    setRzpError(null);

    createRazorpayOrder({ orderId, amount })
      .then((res) => {
        setRzpOrderId(res.data.razorpayOrderId);
        setRzpAmount(res.data.amount as number);
        setRzpKeyId(res.data.keyId);
      })
      .catch((err) => {
        setRzpError(err.message ?? "Failed to initialize payment");
      })
      .finally(() => setRzpLoading(false));
  }, [orderId, amount]);

  // ── Verify via /payments/verify-payment ────────────────────────────────────
  const verifyMutation = useMutation({
    mutationFn: (data: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    }) =>
      verifyRazorpayPayment({
        orderId: orderId!,
        razorpayOrderId:   data.razorpayOrderId,
        razorpayPaymentId: data.razorpayPaymentId,
        razorpaySignature: data.razorpaySignature,
      }),
    onSuccess: () => {
      toast({ title: "Payment Confirmed", description: "Booking confirmed!" });
      router.push(`/order-success?id=${orderId}`);
    },
    onError: (err: any) => {
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
    },
  });

  // ── Open Razorpay ─────────────────────────────────────────────────────────
  const handlePay = () => {
    if (!scriptLoaded || !rzpOrderId || !rzpKeyId) {
      toast({ title: "Not ready", description: rzpError ?? "Please wait.", variant: "destructive" });
      return;
    }
    try {
      const rzp = new (window as any).Razorpay({
        key:         rzpKeyId,
        amount:      rzpAmount,
        currency:    "INR",
        name:        "Labconnect Diagnostics",
        description: "Home Sample Collection Booking",
        order_id:    rzpOrderId,
        theme:       { color: "#dc2626" },
        handler: (response: any) => {
          verifyMutation.mutate({
            razorpayOrderId:   response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
        },
        modal: {
          ondismiss: () => toast({ title: "Payment cancelled", variant: "destructive" }),
        },
      });
      rzp.on("payment.failed", (resp: any) => {
        toast({ title: "Payment failed", description: resp.error?.description, variant: "destructive" });
      });
      rzp.open();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const isInit  = scriptLoading || rzpLoading;
  const isReady = scriptLoaded && !!rzpOrderId && !!rzpKeyId;
  const isBusy  = verifyMutation.isPending;

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
            ) : rzpError ? (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left">
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-800">Payment gateway unavailable</p>
                  <p className="text-xs text-amber-600 mt-1">{rzpError}</p>
                  <p className="text-xs text-amber-600 mt-2">
                    Check the Razorpay credentials on the API server and restart the backend.
                  </p>
                </div>
              </div>
            ) : (
              <Button
                className="w-full h-13 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-200 flex items-center justify-center gap-2 py-4"
                disabled={!isReady || isBusy}
                onClick={handlePay}
              >
                <Zap className="h-4 w-4" />
                Pay ₹{amount} via Razorpay
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
