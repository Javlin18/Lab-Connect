"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarClock, MapPin, Plus, Stethoscope, User2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createAppointment } from "@/api/appointments";
import { listTests } from "@/api/tests";
import { listUsers } from "@/api/users";
import { PageHeader } from "@/components/app/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

// Predefined time slots
const TIME_SLOTS = [
  "07:00 AM – 08:00 AM",
  "08:00 AM – 09:00 AM",
  "09:00 AM – 10:00 AM",
  "10:00 AM – 11:00 AM",
  "11:00 AM – 12:00 PM",
  "12:00 PM – 01:00 PM",
  "01:00 PM – 02:00 PM",
  "02:00 PM – 03:00 PM",
  "03:00 PM – 04:00 PM",
  "04:00 PM – 05:00 PM",
  "05:00 PM – 06:00 PM",
];

export default function NewAppointmentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Form state
  const [patientId, setPatientId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);

  // Queries
  const patientsQuery = useQuery({
    queryKey: ["users", "patients"],
    queryFn: () => listUsers("patient"),
  });

  const employeesQuery = useQuery({
    queryKey: ["users", "employees"],
    queryFn: () => listUsers("employee"),
  });

  const testsQuery = useQuery({
    queryKey: ["admin-tests"],
    queryFn: () => listTests(true),
  });

  const patients = patientsQuery.data?.data ?? [];
  const employees = employeesQuery.data?.data ?? [];
  const tests = testsQuery.data?.data ?? [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: () =>
      createAppointment({
        patientId,
        employeeId: employeeId || undefined,
        address,
        slot: date && slot ? `${date} ${slot}` : slot,
        testTypes: selectedTestIds.map(
          (id) => tests.find((t: any) => t.id === id)?.name ?? id
        ),
        notes: notes || undefined,
      }),
    onSuccess: () => {
      toast({ title: "Appointment created", description: "New appointment has been scheduled." });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      router.push("/admin/appointments");
    },
    onError: (err: any) => {
      toast({
        title: "Failed to create appointment",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const toggleTest = (id: string) => {
    setSelectedTestIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientId) {
      toast({ title: "Select a patient", variant: "destructive" });
      return;
    }
    if (!address.trim()) {
      toast({ title: "Enter collection address", variant: "destructive" });
      return;
    }
    if (!date) {
      toast({ title: "Select appointment date", variant: "destructive" });
      return;
    }
    if (!slot) {
      toast({ title: "Select a time slot", variant: "destructive" });
      return;
    }
    if (selectedTestIds.length === 0) {
      toast({ title: "Select at least one test", variant: "destructive" });
      return;
    }

    createMutation.mutate();
  };

  const selectedPatient = patients.find((p) => p.id === patientId);
  const selectedEmployee = employees.find((e) => e.id === employeeId);

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        action={
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/admin/appointments"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
          </Link>
        }
        description="Schedule a new home sample collection appointment."
        title="New Appointment"
      />

      <form className="space-y-6" onSubmit={handleSubmit}>

        {/* Patient Selection */}
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-white">
          <div className="flex items-center gap-2 px-6 pt-5 pb-3 border-b border-slate-50">
            <User2 className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-slate-800 text-sm">Patient</h3>
          </div>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="patientId">Select Patient *</Label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
                id="patientId"
                onChange={(e) => setPatientId(e.target.value)}
                required
                value={patientId}
              >
                <option value="">— Choose patient —</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.phone})
                  </option>
                ))}
              </select>
            </div>

            {selectedPatient && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {selectedPatient.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{selectedPatient.name}</p>
                  <p className="text-xs text-slate-400">{selectedPatient.email} · {selectedPatient.phone}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tests Selection */}
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-white">
          <div className="flex items-center gap-2 px-6 pt-5 pb-3 border-b border-slate-50">
            <Stethoscope className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-slate-800 text-sm">Tests *</h3>
            {selectedTestIds.length > 0 && (
              <span className="ml-auto text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {selectedTestIds.length} selected
              </span>
            )}
          </div>
          <CardContent className="p-6">
            {testsQuery.isLoading ? (
              <p className="text-sm text-slate-400">Loading tests...</p>
            ) : tests.length === 0 ? (
              <p className="text-sm text-slate-400">No active tests found. Create tests first.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {tests.map((t: any) => {
                  const selected = selectedTestIds.includes(t.id);
                  return (
                    <button
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition cursor-pointer ${
                        selected
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-slate-100 bg-slate-50 text-slate-700 hover:border-slate-200"
                      }`}
                      key={t.id}
                      onClick={() => toggleTest(t.id)}
                      type="button"
                    >
                      <span className="font-medium">{t.name}</span>
                      <span className="text-xs font-bold">
                        ₹{t.discountPrice ?? t.price}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-white">
          <div className="flex items-center gap-2 px-6 pt-5 pb-3 border-b border-slate-50">
            <CalendarClock className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-slate-800 text-sm">Schedule *</h3>
          </div>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  type="date"
                  value={date}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slot">Time Slot *</Label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  id="slot"
                  onChange={(e) => setSlot(e.target.value)}
                  required
                  value={slot}
                >
                  <option value="">— Choose slot —</option>
                  {TIME_SLOTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Collection Address */}
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-white">
          <div className="flex items-center gap-2 px-6 pt-5 pb-3 border-b border-slate-50">
            <MapPin className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-slate-800 text-sm">Collection Address *</h3>
          </div>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="address">Full Address</Label>
              <textarea
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                id="address"
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House No., Street, Locality, City, Pincode"
                required
                rows={3}
                value={address}
              />
            </div>
          </CardContent>
        </Card>

        {/* Assign Employee (Optional) */}
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-white">
          <div className="flex items-center gap-2 px-6 pt-5 pb-3 border-b border-slate-50">
            <User2 className="h-4 w-4 text-slate-400" />
            <h3 className="font-semibold text-slate-800 text-sm">Assign Employee</h3>
            <span className="ml-auto text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Optional</span>
          </div>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="employeeId">Employee</Label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
                id="employeeId"
                onChange={(e) => setEmployeeId(e.target.value)}
                value={employeeId}
              >
                <option value="">— Assign later —</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} {emp.employee?.isAvailable ? "— Available" : "— Busy"}
                  </option>
                ))}
              </select>
            </div>
            {selectedEmployee && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                  {selectedEmployee.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{selectedEmployee.name}</p>
                  <p className="text-xs text-slate-400">
                    {selectedEmployee.employee?.zone ?? "No zone"} ·{" "}
                    <span className={selectedEmployee.employee?.isAvailable ? "text-emerald-600" : "text-amber-500"}>
                      {selectedEmployee.employee?.isAvailable ? "Available" : "Busy"}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-white">
          <CardContent className="p-6 space-y-1.5">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <textarea
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              id="notes"
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions or patient notes..."
              rows={2}
              value={notes}
            />
          </CardContent>
        </Card>

        {/* Summary + Submit */}
        {selectedTestIds.length > 0 && date && slot && (
          <Card className="rounded-3xl border-primary/20 bg-primary/5 shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Summary</p>
              <div className="space-y-1.5 text-sm text-slate-700">
                {selectedPatient && (
                  <p><span className="text-slate-400">Patient:</span> {selectedPatient.name}</p>
                )}
                <p>
                  <span className="text-slate-400">Tests:</span>{" "}
                  {selectedTestIds
                    .map((id) => tests.find((t: any) => t.id === id)?.name)
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <p><span className="text-slate-400">Slot:</span> {date} · {slot}</p>
                {address && <p><span className="text-slate-400">Address:</span> {address}</p>}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3 pb-8">
          <Button
            className="rounded-xl bg-primary text-white hover:bg-primary/95 flex items-center gap-1.5"
            disabled={createMutation.isPending}
            type="submit"
          >
            <Plus className="h-4 w-4" />
            {createMutation.isPending ? "Creating..." : "Create Appointment"}
          </Button>
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/admin/appointments"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
