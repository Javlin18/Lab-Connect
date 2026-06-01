import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const errorCopy: Record<string, string> = {
  AccessDenied: "Access denied.",
  Configuration: "Auth configuration error.",
  CredentialsSignin: "Invalid login or password.",
  Default: "Login failed."
};

export default function AuthErrorPage({
  searchParams
}: {
  searchParams?: {
    error?: string;
  };
}) {
  const code = searchParams?.error ?? "Default";
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
