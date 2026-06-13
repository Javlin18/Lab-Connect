"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CheckCircle2,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  User2,
  Users,
  X,
  Zap,
  Star
} from "lucide-react";
import { useState } from "react";

import { listAppointments } from "@/api/appointments";
import { countEmployeeTasksForDate, listEmployees, updateEmployeeLocation } from "@/api/employees";
import { getFeedbackLeaderboard } from "@/api/feedback";
import { createEmployee } from "@/api/users";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const today = format(new Date(), "yyyy-MM-dd");

function AvailabilityBadge({ available }: { available: boolean }) {
  return available ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
      Free
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Busy
    </span>
  );
}

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [zone, setZone] = useState("");
  const [password, setPassword] = useState("");

  const employeesQ    = useQuery({ queryKey: ["employees"],               queryFn: listEmployees });
  const appointmentsQ = useQuery({ queryKey: ["appointments", "emp-page"],queryFn: listAppointments });
  const leaderQ       = useQuery({ queryKey: ["feedback-leaderboard"],    queryFn: getFeedbackLeaderboard });

  const employees    = employeesQ.data?.data ?? [];
  const appointments = appointmentsQ.data?.data ?? [];
  const leaderMap    = Object.fromEntries(
    (leaderQ.data?.data ?? []).map((e) => [e.employeeId, e])
  );

  const freeCount   = employees.filter((e) => e.employee.isAvailable).length;
  const busyCount   = employees.filter((e) => !e.employee.isAvailable).length;

  const createMutation = useMutation({
    mutationFn: () => createEmployee({ email, name, password, phone, zone }),
    onSuccess: () => {
      toast({ title: "Employee created" });
      setShowModal(false);
      setName(""); setEmail(""); setPhone(""); setZone(""); setPassword("");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: Error) => toast({ title: "Create failed", description: e.message, variant: "destructive" }),
  });

  const toggleAvailability = useMutation({
    mutationFn: ({ empId, isAvailable }: { empId: string; isAvailable: boolean }) =>
      updateEmployeeLocation(empId, { isAvailable, latitude: 0, longitude: 0 }),
    onSuccess: () => {
      toast({ title: "Availability updated" });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const closeModal = () => {
    setShowModal(false);
    setName(""); setEmail(""); setPhone(""); setZone(""); setPassword("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        action={
          <Button
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold gap-1.5 h-9 px-4"
            onClick={() => setShowModal(true)}
          >
            <Plus className="h-3.5 w-3.5" /> Add Employee
          </Button>
        }
        description="Manage field staff, zones, and availability."
        title="Employees"
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Staff",   value: employees.length, icon: Users,         color: "text-blue-600 bg-blue-50" },
          { label: "Available Now", value: freeCount,        icon: CheckCircle2,   color: "text-emerald-600 bg-emerald-50" },
          { label: "Busy / On Job", value: busyCount,        icon: Zap,            color: "text-amber-600 bg-amber-50" },
        ].map((s) => (
          <Card className="rounded-2xl border-slate-200 shadow-sm" key={s.label}>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className="text-2xl font-black text-slate-900">{s.value}</p>
              </div>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Employee cards grid */}
      {employeesQ.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton className="h-48 rounded-2xl" key={i} />)}
        </div>
      ) : employees.length === 0 ? (
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-600">No employees yet</p>
            <p className="text-xs text-slate-400 mt-1">Add your first field collection employee</p>
            <Button className="mt-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold" onClick={() => setShowModal(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Employee
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((record) => {
            const taskCount   = countEmployeeTasksForDate(appointments, record.user.id, today);
            const assigned    = appointments.filter((a) => a.employeeId === record.user.id && a.status !== "completed");
            const initials    = record.user.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

            return (
              <Card
                className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden"
                key={record.employee.id}
              >
                {/* Top strip */}
                <div className={`h-1 ${record.employee.isAvailable ? "bg-emerald-400" : "bg-amber-400"}`} />

                <CardContent className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                        {initials}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{record.user.name}</p>
                        <AvailabilityBadge available={record.employee.isAvailable} />
                      </div>
                    </div>
                    <button
                      className="h-7 w-7 rounded-lg text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition flex items-center justify-center"
                      onClick={() => toggleAvailability.mutate({ empId: record.employee.id, isAvailable: !record.employee.isAvailable })}
                      title="Toggle availability"
                      type="button"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Phone className="h-3.5 w-3.5 text-slate-300" />
                      {record.user.phone}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5 text-slate-300" />
                      {record.employee.zone || "No zone assigned"}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <User2 className="h-3.5 w-3.5 text-slate-300" />
                      {record.user.email}
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50">
                    <div className="bg-slate-50 rounded-xl px-3 py-2">
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Today</p>
                      <p className="text-lg font-black text-slate-800">{taskCount}</p>
                      <p className="text-[9px] text-slate-400">tasks</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl px-3 py-2">
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Active</p>
                      <p className="text-lg font-black text-slate-800">{assigned.length}</p>
                      <p className="text-[9px] text-slate-400">bookings</p>
                    </div>
                  </div>

                  {/* Rating row */}
                  {(() => {
                    const entry = leaderMap[record.employee.id];
                    return entry && entry.totalFeedbackCount > 0 ? (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                        <div className="flex items-center gap-1">
                          <span className="text-amber-400"><Star className="h-4 w-4 fill-amber-400" /></span>
                          <span className="text-sm font-black text-slate-800">{entry.averageRating.toFixed(1)}</span>
                          <span className="text-[10px] text-slate-400">({entry.totalFeedbackCount})</span>
                        </div>
                        <a
                          href={`/admin/employees/${record.employee.id}/feedback`}
                          className="text-[10px] font-bold text-blue-600 hover:underline"
                        >
                          View Feedback →
                        </a>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-slate-50">
                        <span className="text-[10px] text-slate-300">No reviews yet</span>
                      </div>
                    );
                  })()}

                  {/* Active bookings preview */}
                  {assigned.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Active bookings</p>
                      {assigned.slice(0, 2).map((a) => (
                        <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-1.5" key={a.id}>
                          <span className="text-[10px] font-mono text-blue-700">{a.id.slice(0, 10)}…</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            a.status === "en_route" ? "bg-indigo-100 text-indigo-600" :
                            a.status === "collected" ? "bg-cyan-100 text-cyan-600" :
                            "bg-blue-100 text-blue-600"
                          }`}>
                            {a.status}
                          </span>
                        </div>
                      ))}
                      {assigned.length > 2 && (
                        <p className="text-[10px] text-slate-400 text-center">+{assigned.length - 2} more</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add employee modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <Card className="w-full max-w-md rounded-3xl shadow-2xl bg-white">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Plus className="h-4 w-4 text-blue-500" /> Add Employee
              </h3>
              <Button className="h-8 w-8 p-0 rounded-full text-slate-400" onClick={closeModal} variant="ghost">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 grid gap-4">
              {[
                { label: "Full Name",  value: name,     setter: setName,     type: "text",     placeholder: "Rahul Mehra" },
                { label: "Email",      value: email,    setter: setEmail,    type: "email",    placeholder: "rahul@labconnect.com" },
                { label: "Phone",      value: phone,    setter: setPhone,    type: "tel",      placeholder: "+91 9876543210" },
                { label: "Zone / Area",value: zone,     setter: setZone,     type: "text",     placeholder: "e.g. Bhopal North Zone" },
                { label: "Password",   value: password, setter: setPassword, type: "password", placeholder: "••••••••" },
              ].map((field) => (
                <div className="space-y-1.5" key={field.label}>
                  <Label>{field.label}</Label>
                  <Input
                    className="rounded-xl h-10"
                    onChange={(e) => field.setter(e.target.value)}
                    placeholder={field.placeholder}
                    type={field.type}
                    value={field.value}
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  disabled={createMutation.isPending || !name || !email || !phone || !password}
                  onClick={() => createMutation.mutate()}
                >
                  {createMutation.isPending ? "Creating…" : "Create Employee"}
                </Button>
                <Button className="rounded-xl" onClick={closeModal} variant="outline">Cancel</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
