"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Clock,
  Shield,
  User2
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { deleteUser, listUsers, updateUser } from "@/api/users";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const TIME_SLOTS = ["06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM"];
const CLOSE_SLOTS = ["05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM"];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: session } = useSession();

  // Admin profile
  const [name, setName] = useState(session?.user?.name ?? "");
  const [email, setEmail] = useState(session?.user?.email ?? "");
  const [phone, setPhone] = useState((session?.user as any)?.phone ?? "");

  // Lab details
  const [labName, setLabName] = useState("Lab Connect Diagnostics");
  const [labAddress, setLabAddress] = useState("55/18 dada thanthanpal word no.72, Rivjha green city, Jabalpur 482001");
  const [labPhone, setLabPhone] = useState("+91 7693080021, +91 8602363472");
  const [labEmail, setLabEmail] = useState("labconnect.work@gmail.com");
  const [openTime, setOpenTime] = useState("07:00 AM");
  const [closeTime, setCloseTime] = useState("08:00 PM");



  const employeesQ = useQuery({ queryKey: ["users", "employees"], queryFn: () => listUsers("employee") });

  useEffect(() => {
    setName(session?.user?.name ?? "");
    setEmail(session?.user?.email ?? "");
    setPhone((session?.user as any)?.phone ?? "");
  }, [session]);

  const updateProfileMutation = useMutation({
    mutationFn: () => updateUser(session?.user?.id ?? "", { name, email, phone }),
    onSuccess: () => toast({ title: "Profile updated" }),
    onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      toast({ title: "Employee removed" });
      queryClient.invalidateQueries({ queryKey: ["users", "employees"] });
    },
    onError: (e: Error) => toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });

  const sectionClass = "space-y-4";
  const inputClass = "rounded-xl h-10 border-slate-200 focus:border-blue-500";

  return (
    <div className="space-y-8 max-w-5xl">
      <PageHeader description="Configure lab details, payment gateway, and admin profile." title="Settings" />

      {/* ── Admin Profile ─────────────────────────────────────────────────── */}
      <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="px-6 py-4 border-b border-slate-50">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <User2 className="h-4 w-4 text-blue-500" /> Admin Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className={sectionClass}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input className={inputClass} onChange={(e) => setName(e.target.value)} value={name} />
              </div>
              <div className="space-y-1.5">
                <Label>Email Address</Label>
                <Input className={inputClass} onChange={(e) => setEmail(e.target.value)} type="email" value={email} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone Number</Label>
                <Input className={inputClass} onChange={(e) => setPhone(e.target.value)} value={phone} />
              </div>
            </div>
            <div>
              <Button
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold"
                disabled={updateProfileMutation.isPending}
                onClick={() => updateProfileMutation.mutate()}
              >
                {updateProfileMutation.isPending ? "Saving…" : "Save Profile"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Lab Details ───────────────────────────────────────────────────── */}
      <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="px-6 py-4 border-b border-slate-50">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-500" /> Lab Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Lab Name</Label>
              <Input className={inputClass} onChange={(e) => setLabName(e.target.value)} value={labName} />
            </div>
            <div className="space-y-1.5">
              <Label>Lab Phone</Label>
              <Input className={inputClass} onChange={(e) => setLabPhone(e.target.value)} value={labPhone} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Lab Address</Label>
              <Input className={inputClass} onChange={(e) => setLabAddress(e.target.value)} value={labAddress} />
            </div>
            <div className="space-y-1.5">
              <Label>Lab Email</Label>
              <Input className={inputClass} onChange={(e) => setLabEmail(e.target.value)} type="email" value={labEmail} />
            </div>
          </div>
          <Button
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold"
            onClick={() => toast({ title: "Lab details saved" })}
          >
            Save Lab Details
          </Button>
        </CardContent>
      </Card>

      {/* ── Collection Timing ─────────────────────────────────────────────── */}
      <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="px-6 py-4 border-b border-slate-50">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" /> Collection Timing
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            <div className="space-y-1.5">
              <Label>Opening Time</Label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 h-10 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                onChange={(e) => setOpenTime(e.target.value)}
                value={openTime}
              >
                {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Closing Time</Label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 h-10 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                onChange={(e) => setCloseTime(e.target.value)}
                value={closeTime}
              >
                {CLOSE_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <p className="text-xs text-slate-400">Collection hours: {openTime} – {closeTime}</p>
          <Button
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold"
            onClick={() => toast({ title: "Timing saved" })}
          >
            Save Timing
          </Button>
        </CardContent>
      </Card>



      {/* ── Employee Accounts ─────────────────────────────────────────────── */}
      <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="px-6 py-4 border-b border-slate-50">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-500" /> Employee Accounts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {employeesQ.isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton className="h-10" key={i} />)}
            </div>
          ) : (employeesQ.data?.data ?? []).length === 0 ? (
            <div className="flex items-center justify-center py-10 text-sm text-slate-400">
              No employees yet — add them from the Employees page
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Phone</th>
                    <th className="px-5 py-3">Zone</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {(employeesQ.data?.data ?? []).map((emp) => (
                    <tr className="hover:bg-slate-50/60 transition" key={emp.id}>
                      <td className="px-5 py-3 font-semibold text-slate-800">{emp.name}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{emp.email}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{emp.phone}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{emp.employee?.zone ?? "—"}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${emp.employee?.isAvailable ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                          {emp.employee?.isAvailable ? "Available" : "Busy"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <Button
                          className="h-7 px-3 rounded-lg text-xs"
                          disabled={deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate(emp.id)}
                          variant="destructive"
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
