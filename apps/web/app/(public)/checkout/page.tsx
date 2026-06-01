"use client";

import { useMutation } from "@tanstack/react-query";
import { CreditCard, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { verifyPayment } from "@/api/orders";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const orderId = searchParams.get("orderId");
  const paymentId = searchParams.get("paymentId"); // Razorpay Order ID
  const amount = parseFloat(searchParams.get("amount") || "0");
  const keyId = searchParams.get("keyId");

  const [loading, setLoading] = useState(true);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Verification Mutation
  const verifyMutation = useMutation({
    mutationFn: (data: {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      orderId?: string;
      status?: string;
    }) => verifyPayment(data),
    onSuccess: () => {
      toast({
        title: "Payment Confirmed",
        description: "Your health test has been booked successfully!"
      });
      router.push(`/order-success?id=${orderId}`);
    },
    onError: (err: any) => {
      toast({
        title: "Verification failed",
        description: err.message,
        variant: "destructive"
      });
    }
  });

  // Load Razorpay Script
  useEffect(() => {
    if (!orderId || !paymentId) {
      router.push("/cart");
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      setScriptLoaded(true);
      setLoading(false);
    };
    script.onerror = () => {
      setLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [orderId, paymentId, router]);

  // Open Razorpay Popup
  const handlePay = () => {
    if (!scriptLoaded || !paymentId || !keyId) {
      toast({
        title: "Razorpay script missing",
        description: "Failed to initialize payment gateway. Use simulation below."
      });
      return;
    }

    try {
      const options = {
        key: keyId,
        amount: Math.round(amount * 100),
        currency: "INR",
        name: "Labconnect Diagnostics",
        description: "Secure Home Laboratory Test Booking",
        order_id: paymentId,
        handler: function (response: any) {
          verifyMutation.mutate({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });
        },
        theme: {
          color: "#C41E3A"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (e: any) {
      toast({
        title: "Checkout Error",
        description: e.message,
        variant: "destructive"
      });
    }
  };

  // Mock Sandbox verification helper
  const handleSimulateSuccess = () => {
    if (!paymentId) return;
    verifyMutation.mutate({
      orderId: paymentId,
      status: "paid"
    });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center space-y-8">
      <div className="bg-white border border-slate-100 p-8 rounded-3xl shadow-xl space-y-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-primary mx-auto">
          <CreditCard className="h-8 w-8" />
        </div>

        <div>
          <h1 className="text-2xl font-black text-slate-800">Secure Payment</h1>
          <p className="text-xs text-slate-400 mt-1">Complete your transaction to finalize booking</p>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl space-y-1">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Amount to Pay</p>
          <p className="text-3xl font-black text-slate-800">₹{amount}</p>
          <p className="text-[9px] text-slate-400">Order ID: {orderId?.slice(0, 8)}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 text-sm text-slate-400 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Loading Payment Gateway...
          </div>
        ) : (
          <div className="space-y-4">
            <Button
              className="w-full rounded-2xl bg-primary hover:bg-primary/95 text-white py-6 font-bold shadow-lg shadow-primary/20 transition hover:scale-102 flex items-center justify-center gap-2"
              disabled={verifyMutation.isPending}
              onClick={handlePay}
            >
              Pay Now (Razorpay)
            </Button>

            <div className="relative my-6 flex items-center justify-center">
              <span className="absolute inset-x-0 h-px bg-slate-100" />
              <span className="relative bg-white px-3 text-[10px] text-slate-400 uppercase font-bold">Or Testing sandbox</span>
            </div>

            <Button
              className="w-full rounded-2xl border-slate-200 text-slate-600 py-6 hover:bg-slate-50 font-bold transition hover:scale-102 flex items-center justify-center gap-2"
              disabled={verifyMutation.isPending}
              onClick={handleSimulateSuccess}
              variant="outline"
            >
              {verifyMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 text-amber-500" />
              )}
              Simulate Sandbox Success
            </Button>
          </div>
        )}

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-4">
          <ShieldCheck className="h-4 w-4 text-emerald-500" /> Secure 256-bit SSL encrypted checkout
        </div>
      </div>
    </div>
  );
}
