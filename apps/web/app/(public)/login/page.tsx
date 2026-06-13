"use client";

import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  Shield,
  Smartphone,
  User
} from "lucide-react";
import { getSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { registerPatient, sendEmailOtp, verifyEmailOtp } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type Tab      = "login" | "register";
type RegStep  = "details" | "otp" | "done";

export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { toast }    = useToast();

  const [activeTab, setActiveTab] = useState<Tab>(
    searchParams.get("tab") === "register" ? "register" : "login"
  );
  const [loginRole, setLoginRole] = useState<"patient" | "admin">(
    searchParams.get("admin") === "true" ? "admin" : "patient"
  );

  // Login fields
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);

  // Register fields
  const [regName,     setRegName]     = useState("");
  const [regEmail,    setRegEmail]    = useState("");
  const [regPhone,    setRegPhone]    = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regStep,     setRegStep]     = useState<RegStep>("details");
  const [otp,         setOtp]         = useState("");

  const isAdmin    = loginRole === "admin";

  // ── Send OTP mutation ────────────────────────────────────────────────────────
  const sendOtpMutation = useMutation({
    mutationFn: () => sendEmailOtp(regEmail),
    onSuccess: () => {
      toast({ title: "OTP sent!", description: `Check ${regEmail} inbox.` });
      setRegStep("otp");
    },
    onError: (err: any) => {
      toast({ title: "Failed to send OTP", description: err.message, variant: "destructive" });
    },
  });

  // ── Verify OTP mutation ──────────────────────────────────────────────────────
  const verifyOtpMutation = useMutation({
    mutationFn: () => verifyEmailOtp(regEmail, otp),
    onSuccess: () => {
      toast({ title: "Email verified", description: "Completing registration…" });
      registerMutation.mutate();
    },
    onError: (err: any) => {
      toast({ title: "Invalid OTP", description: err.message, variant: "destructive" });
    },
  });

  // ── Register mutation ────────────────────────────────────────────────────────
  const registerMutation = useMutation({
    mutationFn: () => registerPatient({ name: regName, email: regEmail, phone: regPhone, password: regPassword }),
    onSuccess: () => {
      setRegStep("done");
      toast({ title: "Account created!", description: "Please login with your credentials." });
      setTimeout(() => {
        setActiveTab("login");
        setEmail(regEmail);
        setRegStep("details");
        setOtp("");
      }, 1500);
    },
    onError: (err: any) => {
      toast({ title: "Registration failed", description: err.message, variant: "destructive" });
      setRegStep("otp"); // go back to OTP step
    },
  });

  // ── Login handler ────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Missing fields", variant: "destructive" }); return;
    }
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (result?.error) {
      toast({ title: "Login failed", description: result.error, variant: "destructive" }); return;
    }

    const session = await getSession();
    if (session?.user?.role === "admin") router.push("/admin/dashboard");
    else router.push("/");
  };

  // ── Step 1: Details form ─────────────────────────────────────────────────────
  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPhone || !regPassword) {
      toast({ title: "Fill all fields", variant: "destructive" }); return;
    }
    if (regPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" }); return;
    }
    sendOtpMutation.mutate();
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center py-12 px-4 bg-slate-50/50">
      <Card className="w-full max-w-md border-slate-100 shadow-xl rounded-3xl bg-white overflow-hidden">

        {/* Header */}
        <CardHeader className="text-center pb-2 pt-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white mx-auto mb-3 shadow-lg shadow-red-200">
            <Shield className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-black text-slate-800">
            {isAdmin ? "Admin Console" : "Lab Connect"}
          </CardTitle>
          <CardDescription className="text-xs">
            {isAdmin ? "Access laboratory admin panel" : "Book home tests and download reports"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 px-6 pb-6">
          {/* Tab switcher — patient only */}
          {!isAdmin && (
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-50 border border-slate-100">
              {(["login", "register"] as Tab[]).map((tab) => (
                <button
                  className={`py-2.5 text-xs font-bold rounded-xl transition ${
                    activeTab === tab ? "bg-white text-red-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                  key={tab}
                  onClick={() => { setActiveTab(tab); setRegStep("details"); setOtp(""); }}
                  type="button"
                >
                  {tab === "login" ? "Login" : "Create Account"}
                </button>
              ))}
            </div>
          )}

          {/* ── LOGIN FORM ──────────────────────────────────────────────────── */}
          {activeTab === "login" && (
            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input className="pl-9 rounded-xl h-11" id="email" onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required type="email" value={email} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input className="pl-9 rounded-xl h-11" id="password" onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required type="password" value={password} />
                </div>
              </div>
              <Button className="w-full rounded-xl h-11 bg-red-600 hover:bg-red-700 text-white font-bold shadow-md shadow-red-200" disabled={loading} type="submit">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
              </Button>

              {/* Google sign-in — only for patients */}
              {!isAdmin && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-slate-100" />
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">or</span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>
                  <button
                    className="w-full h-11 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition flex items-center justify-center gap-3 font-semibold text-sm text-slate-700 shadow-sm"
                    onClick={() => signIn("google", { callbackUrl: "/" })}
                    type="button"
                  >
                    {/* Google SVG icon */}
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </button>
                </>
              )}
            </form>
          )}

          {/* ── REGISTER FLOW ──────────────────────────────────────────────── */}
          {activeTab === "register" && (

            <>
              {/* Progress indicator */}
              <div className="flex items-center justify-between px-2">
                {[
                  { n: 1, label: "Details"  },
                  { n: 2, label: "Verify"   },
                  { n: 3, label: "Done"     },
                ].map((s, idx) => {
                  const stepNum = regStep === "details" ? 1 : regStep === "otp" ? 2 : 3;
                  const done    = stepNum > s.n;
                  const current = stepNum === s.n;
                  return (
                    <div className="flex items-center" key={s.n}>
                      <div className="flex flex-col items-center gap-1">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                          done    ? "bg-emerald-500 text-white" :
                          current ? "bg-red-600 text-white shadow-md shadow-red-200" :
                          "bg-slate-100 text-slate-400"
                        }`}>
                          {done ? <CheckCircle2 className="h-4 w-4" /> : s.n}
                        </div>
                        <span className={`text-[9px] font-semibold ${current ? "text-red-600" : "text-slate-400"}`}>{s.label}</span>
                      </div>
                      {idx < 2 && <div className={`h-px flex-1 mx-2 mb-4 ${done ? "bg-emerald-400" : "bg-slate-200"}`} />}
                    </div>
                  );
                })}
              </div>

              {/* Step 1 — Patient details */}
              {regStep === "details" && (
                <form className="space-y-3" onSubmit={handleDetailsSubmit}>
                  <div className="space-y-1.5">
                    <Label>Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input className="pl-9 rounded-xl h-11" onChange={(e) => setRegName(e.target.value)} placeholder="Rahul Sharma" required value={regName} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input className="pl-9 rounded-xl h-11" onChange={(e) => setRegEmail(e.target.value)} placeholder="you@example.com" required type="email" value={regEmail} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone Number *</Label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input className="pl-9 rounded-xl h-11" onChange={(e) => setRegPhone(e.target.value)} placeholder="+91 9876543210" required type="tel" value={regPhone} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input className="pl-9 rounded-xl h-11" onChange={(e) => setRegPassword(e.target.value)} placeholder="Min 6 characters" required type="password" value={regPassword} />
                    </div>
                  </div>
                  <Button className="w-full rounded-xl h-11 bg-red-600 hover:bg-red-700 text-white font-bold shadow-md shadow-red-200" disabled={sendOtpMutation.isPending} type="submit">
                    {sendOtpMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending OTP…</> : "Send Verification OTP →"}
                  </Button>

                  {/* Quick Google signup */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-slate-100" />
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">or quick signup</span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>
                  <button
                    className="w-full h-11 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition flex items-center justify-center gap-3 font-semibold text-sm text-slate-700 shadow-sm"
                    onClick={() => signIn("google", { callbackUrl: "/" })}
                    type="button"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Sign up with Google
                  </button>
                </form>
              )}

              {/* Step 2 — OTP verification */}
              {regStep === "otp" && (
                <div className="space-y-5">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
                    <Mail className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-800">OTP sent to</p>
                    <p className="text-sm text-emerald-600 font-semibold">{regEmail}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Valid for 10 minutes · Check spam folder too</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Enter 6-digit OTP</Label>
                    <Input
                      className="rounded-xl h-14 text-center text-2xl font-black tracking-[0.5em] border-slate-200 focus:border-red-500"
                      maxLength={6}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="——————"
                      value={otp}
                    />
                  </div>

                  <Button
                    className="w-full rounded-xl h-11 bg-red-600 hover:bg-red-700 text-white font-bold shadow-md shadow-red-200"
                    disabled={otp.length !== 6 || verifyOtpMutation.isPending || registerMutation.isPending}
                    onClick={() => verifyOtpMutation.mutate()}
                    type="button"
                  >
                    {verifyOtpMutation.isPending || registerMutation.isPending
                      ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Verifying…</>
                      : "Verify & Create Account"}
                  </Button>

                  <div className="flex items-center justify-between text-xs">
                    <button
                      className="text-slate-400 hover:text-slate-600 flex items-center gap-1 transition"
                      onClick={() => setRegStep("details")}
                      type="button"
                    >
                      <ArrowLeft className="h-3 w-3" /> Back
                    </button>
                    <button
                      className="text-red-600 font-semibold hover:underline disabled:opacity-40"
                      disabled={sendOtpMutation.isPending}
                      onClick={() => sendOtpMutation.mutate()}
                      type="button"
                    >
                      {sendOtpMutation.isPending ? "Sending…" : "Resend OTP"}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3 — Done */}
              {regStep === "done" && (
                <div className="py-8 text-center space-y-3">
                  <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto animate-bounce">
                    <CheckCircle2 className="h-9 w-9 text-emerald-500" />
                  </div>
                  <p className="font-bold text-slate-800">Account Created!</p>
                  <p className="text-xs text-slate-400">Redirecting to login…</p>
                </div>
              )}
            </>
          )}

          {/* Role switchers */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5 text-center">
            <button
              className="text-xs text-slate-400 hover:text-red-600 transition font-medium w-full"
              onClick={() => { setLoginRole(isAdmin ? "patient" : "admin"); setActiveTab("login"); }}
              type="button"
            >
              {isAdmin ? "← Patient Login" : "Admin Login"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
