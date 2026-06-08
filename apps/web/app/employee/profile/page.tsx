"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Mail, MapPin, Phone, User2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { apiFetch } from "@/api/client";
import { EmployeeShell } from "@/components/app/employee-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Employee } from "@lab-app/shared";

async function getMyProfile() {
  return apiFetch<{ employee: Employee; user: { id: string; name: string; email: string; phone: string } }>("/employees/me");
}

export default function EmployeeProfilePage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const profileQ = useQuery({ queryKey: ["employee", "profile"], queryFn: getMyProfile });
  const profile = profileQ.data?.data;

  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const availability = isAvailable ?? profile?.employee?.isAvailable ?? true;

  const updateAvailabilityMutation = useMutation({
    mutationFn: (avail: boolean) =>
      apiFetch(`/employees/me/location`, {
        method: "PUT",
        body: JSON.stringify({ latitude: 0, longitude: 0, isAvailable: avail }),
      }),
    onSuccess: (_, avail) => {
      setIsAvailable(avail);
      toast({ title: avail ? "You are now Available" : "You are now Busy" });
      queryClient.invalidateQueries({ queryKey: ["employee"] });
    },
    onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const initials = profile?.user?.name?.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() ?? "EM";

  return (
    <EmployeeShell userName={session?.user?.name} isAvailable={availability}>
      <div className="space-y-6 max-w-lg">
        <div>
          <h1 className="text-xl font-black text-slate-900">My Profile</h1>
          <p className="text-xs text-slate-500 mt-0.5">Your employee account details and availability</p>
        </div>

        {/* Avatar + availability */}
        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
          <div className={`h-1.5 ${availability ? "bg-emerald-400" : "bg-amber-400"}`} />
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-2xl font-black text-white">
                {initials}
              </div>
              <div>
                <p className="font-black text-slate-900 text-lg">{profile?.user?.name ?? session?.user?.name}</p>
                <p className="text-xs text-slate-400">Field Collection Employee</p>
                <div className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-bold border ${
                  availability ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                }`}>
                  <span className={`h-2 w-2 rounded-full ${availability ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                  {availability ? "Available" : "Busy"}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3">
              {[
                { icon: Mail,  label: "Email",    val: profile?.user?.email ?? session?.user?.email ?? "—" },
                { icon: Phone, label: "Phone",    val: profile?.user?.phone ?? (session?.user as any)?.phone ?? "—" },
                { icon: MapPin,label: "Zone",     val: profile?.employee?.zone ?? "Not assigned" },
                { icon: User2, label: "Location", val: profile?.employee?.currentLocation || "Not set" },
              ].map((item) => (
                <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3" key={item.label}>
                  <item.icon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{item.label}</p>
                    <p className="text-sm font-semibold text-slate-800">{item.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Availability toggle */}
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="px-5 py-4 border-b border-slate-50">
            <CardTitle className="text-sm font-bold text-slate-800">Availability Status</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <p className="text-xs text-slate-500">
              Set your status so the system knows when you can accept new bookings.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                className={`h-12 rounded-xl font-bold text-sm transition ${
                  availability ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" : "bg-slate-100 text-slate-500"
                }`}
                disabled={updateAvailabilityMutation.isPending}
                onClick={() => updateAvailabilityMutation.mutate(true)}
                variant="ghost"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" /> Available
              </Button>
              <Button
                className={`h-12 rounded-xl font-bold text-sm transition ${
                  !availability ? "bg-amber-500 text-white shadow-md shadow-amber-200" : "bg-slate-100 text-slate-500"
                }`}
                disabled={updateAvailabilityMutation.isPending}
                onClick={() => updateAvailabilityMutation.mutate(false)}
                variant="ghost"
              >
                <span className="mr-2">⏸</span> Busy / Offline
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </EmployeeShell>
  );
}
