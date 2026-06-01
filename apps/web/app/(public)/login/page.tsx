"use client";

import { useMutation } from "@tanstack/react-query";
import { Loader2, Lock, Mail, Smartphone, User, UserPlus } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { registerPatient } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [isAdmin, setIsAdmin] = useState(searchParams.get("admin") === "true");

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: () =>
      registerPatient({
        name,
        email,
        phone,
        password
      }),
    onSuccess: () => {
      toast({
        title: "Registration successful",
        description: "Please login with your credentials."
      });
      setActiveTab("login");
      // clear fields except email
      setPassword("");
      setName("");
      setPhone("");
    },
    onError: (err: any) => {
      toast({
        title: "Registration failed",
        description: err.message || "Something went wrong.",
        variant: "destructive"
      });
    }
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please enter your email and password.",
        variant: "destructive"
      });
      return;
    }

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
        description: result.error.includes("Admin") ? "Admin login restriction. Patients please use standard login." : result.error,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Welcome Back",
      description: "Session initialized successfully."
    });

    // Check role from session by forcing router reload / push
    router.refresh();
    setTimeout(() => {
      // Direct redirect check or default push
      if (isAdmin) {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    }, 500);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !password) {
      toast({
        title: "Missing fields",
        description: "Please fill all registration fields.",
        variant: "destructive"
      });
      return;
    }
    registerMutation.mutate();
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center py-12 px-4 bg-slate-50/50">
      <Card className="w-full max-w-md border-slate-100 shadow-xl shadow-slate-200/50 rounded-3xl bg-white">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-black text-slate-800">
            {isAdmin ? "Admin Console" : "Patient Portal"}
          </CardTitle>
          <CardDescription>
            {isAdmin ? "Access laboratory admin commands" : "Book home tests and download certified reports"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tabs selector */}
          {!isAdmin && (
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-50 border border-slate-100">
              <button
                className={`py-2 text-xs font-bold rounded-xl transition ${
                  activeTab === "login"
                    ? "bg-white text-primary shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                onClick={() => setActiveTab("login")}
              >
                Login
              </button>
              <button
                className={`py-2 text-xs font-bold rounded-xl transition ${
                  activeTab === "register"
                    ? "bg-white text-primary shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                onClick={() => setActiveTab("register")}
              >
                Create Account
              </button>
            </div>
          )}

          {activeTab === "login" ? (
            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="pl-9 rounded-xl"
                    id="email"
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={isAdmin ? "admin@labapp.com" : "patient@example.com"}
                    required
                    type="email"
                    value={email}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="pl-9 rounded-xl"
                    id="password"
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    type="password"
                    value={password}
                  />
                </div>
              </div>

              <Button className="w-full rounded-xl py-5 bg-primary text-white hover:bg-primary/95 shadow-lg shadow-primary/10 font-bold" disabled={loading} type="submit">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleRegisterSubmit}>
              <div className="space-y-2">
                <Label htmlFor="regName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="pl-9 rounded-xl"
                    id="regName"
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                    value={name}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="regEmail">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="pl-9 rounded-xl"
                    id="regEmail"
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    required
                    type="email"
                    value={email}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="regPhone">Phone Number</Label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="pl-9 rounded-xl"
                    id="regPhone"
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    required
                    type="tel"
                    value={phone}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="regPassword">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="pl-9 rounded-xl"
                    id="regPassword"
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    type="password"
                    value={password}
                  />
                </div>
              </div>

              <Button
                className="w-full rounded-xl py-5 bg-primary text-white hover:bg-primary/95 shadow-lg shadow-primary/10 font-bold"
                disabled={registerMutation.isPending}
                type="submit"
              >
                {registerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Register"}
              </Button>
            </form>
          )}

          {/* Toggle admin login */}
          <div className="text-center pt-2 border-t border-slate-100">
            <button
              className="text-xs text-slate-400 hover:text-primary transition font-semibold"
              onClick={() => setIsAdmin(!isAdmin)}
              type="button"
            >
              {isAdmin ? "Switch to Patient Login" : "Are you an Admin? Enter Admin console"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
