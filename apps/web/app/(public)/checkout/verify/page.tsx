"use client";

import { useMutation } from "@tanstack/react-query";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useRef } from "react";
import Link from "next/link";

import { verifyPaymentStatus } from "@/api/payments";
import { Button } from "@/components/ui/button";

function VerifyPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const merchantTransactionId = searchParams.get("transactionId");
  const code = searchParams.get("code");
  const providerReferenceId = searchParams.get("providerReferenceId");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const verified = useRef(false);

  const verifyMutation = useMutation({
    mutationFn: (orderId: string) => verifyPaymentStatus({ orderId }),
    onSuccess: () => {
      setStatus("success");
      setTimeout(() => {
        router.push(`/order-success?id=${merchantTransactionId}`);
      }, 2000);
    },
    onError: (err: any) => {
      setStatus("error");
      setErrorMessage(err.message || "Payment verification failed.");
    }
  });

  useEffect(() => {
    if (!merchantTransactionId || verified.current) return;
    verified.current = true;
    
    if (code === "PAYMENT_SUCCESS") {
      verifyMutation.mutate(merchantTransactionId);
    } else {
      setStatus("error");
      setErrorMessage(`Payment issue: ${code || "Unknown error"}. Try again.`);
    }
  }, [merchantTransactionId, code]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-xl p-8 text-center space-y-6">
        {status === "loading" && (
          <div className="space-y-4">
            <Loader2 className="h-12 w-12 text-red-600 animate-spin mx-auto" />
            <h2 className="text-xl font-bold text-slate-800">Verifying Payment...</h2>
            <p className="text-sm text-slate-500">Please wait while we confirm your transaction. Do not refresh.</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto" />
            <h2 className="text-2xl font-black text-slate-900">Payment Successful!</h2>
            <p className="text-sm text-slate-500">Redirecting you to your booking confirmation...</p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h2 className="text-2xl font-black text-slate-900">Verification Failed</h2>
            <p className="text-sm text-red-600">{errorMessage}</p>
            <div className="pt-4">
              <Link href={`/checkout?orderId=${merchantTransactionId}`}>
                <Button className="w-full bg-red-600 hover:bg-red-700 h-12 rounded-xl text-white font-bold">
                  Try Again
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-red-600 animate-spin" /></div>}>
      <VerifyPageInner />
    </Suspense>
  );
}
