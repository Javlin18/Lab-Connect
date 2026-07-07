"use client";

import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const errorCopy: Record<string, string> = {
  AccessDenied: "Access denied.",
  Configuration: "Auth setup error. Try again.",
  CredentialsSignin: "Invalid login or password."
};

export function LoginView({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false
    });

    setLoading(false);

    if (result?.error) {
      toast({
        title: "Login failed",
        description: result.error,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Welcome back",
      description: "Admin session ready"
    });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_35%),linear-gradient(180deg,_#f8fafc,_#e2e8f0)] px-4">
      <Card className="w-full max-w-md border-slate-200 shadow-2xl shadow-slate-300/30">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>
            {initialError ? errorCopy[initialError] ?? "Login failed. Try again." : "Use admin email or legacy login ID."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="labconnect.work@gmail.com"
                type="text"
                value={email}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                value={password}
              />
            </div>
            <Button className="w-full" disabled={loading} type="submit">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enter"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
