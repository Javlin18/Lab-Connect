"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, Clock3, FlaskConical, Plus, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { listAppointments } from "@/api/appointments";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function StatCard({
  icon: Icon,
  label,
  value
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-slate-500" />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const appointmentsQuery = useQuery({
    queryKey: ["appointments", "dashboard"],
    queryFn: () => listAppointments()
  });

  const appointments = appointmentsQuery.data?.data ?? [];
  const recentAppointments = [...appointments].slice(0, 10);
  const pendingAppointments = appointments.filter((item) => item.status === "pending");
  const assignedAppointments = appointments.filter((item) => item.status === "assigned");
  const completedAppointments = appointments.filter((item) => item.status === "completed");

  return (
    <div className="space-y-6">
      <PageHeader
        action={
          <Link className={buttonVariants({ className: "gap-2" })} href="/appointments/new">
            <Plus className="h-4 w-4" />
            New Appointment
          </Link>
        }
        description="Quick cave view of today and fresh activity."
        title="Dashboard"
      />

      {appointmentsQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton className="h-32" key={index} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={CalendarDays} label="Total Appointments" value={appointments.length} />
          <StatCard
            icon={Clock3}
            label="Pending Appointments"
            value={pendingAppointments.length}
          />
          <StatCard
            icon={FlaskConical}
            label="Assigned Appointments"
            value={assignedAppointments.length}
          />
          <StatCard
            icon={CheckCircle2}
            label="Completed Appointments"
            value={completedAppointments.length}
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {appointmentsQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton className="h-10" key={index} />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Tests</TableHead>
                    <TableHead>Slot</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium">{appointment.id.slice(0, 8)}</TableCell>
                      <TableCell>{appointment.testTypes.join(", ")}</TableCell>
                      <TableCell>{appointment.slot}</TableCell>
                      <TableCell>
                        <StatusBadge status={appointment.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
