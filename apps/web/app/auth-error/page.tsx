"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const errorCopy: Record<string, string> = {
  AccessDenied: "Access denied.",
  Configuration: "Auth configuration error.",
  CredentialsSignin: "Invalid login or password.",
  Default: "Login failed."
};

function AuthErrorInner() {
  const searchParams = useSearchParams();
  const code = searchParams.get("error") ?? "Default";
  const message = errorCopy[code] ?? errorCopy.Default;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_35%),linear-gradient(180deg,_#f8fafc,_#e2e8f0)] px-4">
      <Card className="w-full max-w-md border-slate-200 shadow-2xl shadow-slate-300/30">
        <CardHeader>
          <CardTitle>Auth Error</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link className={cn(buttonVariants(), "w-full")} href="/login">
            Back to login
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-slate-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AuthErrorInner />
    </Suspense>
  );
}
