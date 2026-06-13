"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

import { assignAppointment, getAppointmentById } from "@/api/appointments";
import { listEmployees } from "@/api/employees";
import { getReport } from "@/api/reports";
import { listUsers } from "@/api/users";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const timeline = ["pending", "assigned", "accepted", "en_route", "collected", "processing", "completed"] as const;

export default function AppointmentDetailPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [employeeId, setEmployeeId] = useState("");

  const appointmentQuery = useQuery({
    queryKey: ["appointments", params.id],
    queryFn: () => getAppointmentById(params.id)
  });
  const employeesQuery = useQuery({
    queryKey: ["employees", "records"],
    queryFn: () => listEmployees()
  });
  const patientsQuery = useQuery({
    queryKey: ["users", "patients"],
    queryFn: () => listUsers("patient")
  });

  const assignMutation = useMutation({
    mutationFn: () => assignAppointment(params.id, employeeId),
    onSuccess: () => {
      toast({ title: "Assigned", description: "Worker joined cave run." });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (error: Error) => {
      toast({ title: "Assign failed", description: error.message, variant: "destructive" });
    }
  });

  const reportQuery = useQuery({
    queryKey: ["reports", params.id],
    queryFn: () => getReport(params.id),
    retry: false
  });

  const appointment = appointmentQuery.data?.data;
  const patientName = useMemo(
    () => patientsQuery.data?.data.find((item) => item.id === appointment?.patientId)?.name ?? "Unknown patient",
    [appointment?.patientId, patientsQuery.data?.data]
  );

  if (appointmentQuery.isLoading || !appointment) {
    return <Skeleton className="h-[420px]" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader description="Full cave card, assign worker, send report." title={`Appointment ${appointment.id.slice(0, 8)}`} />

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Patient</p>
              <p className="font-medium">{patientName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <StatusBadge status={appointment.status} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tests</p>
              <p>{appointment.testTypes.join(", ")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Slot</p>
              <p>{appointment.slot}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">Address</p>
              <p>{appointment.address}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">Notes</p>
              <p>{appointment.notes || "No notes"}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assign Employee</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select onChange={(event) => setEmployeeId(event.target.value)} value={employeeId}>
                <option value="">Choose available worker</option>
                {(employeesQuery.data?.data ?? [])
                  .filter((item) => item.employee.isAvailable)
                  .map((item) => (
                    <option key={item.employee.id} value={item.user.id}>
                      {item.user.name} · {item.employee.zone}
                    </option>
                  ))}
              </Select>
              <Button disabled={!employeeId || assignMutation.isPending} onClick={() => assignMutation.mutate()} type="button">
                Assign
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Report Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reportQuery.data?.data.downloadUrl ? (
                <div className="space-y-2">
                  <p className="text-sm text-green-700 font-medium">Report uploaded</p>
                  <a
                    className="text-sm text-primary underline"
                    href={reportQuery.data.data.downloadUrl}
                    target="_blank"
                  >
                    Download report PDF
                  </a>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Report will be uploaded by the field collector via the mobile app.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timeline.map((step, index) => {
              const currentIndex = timeline.indexOf(appointment.status);
              const active = index <= currentIndex;

              return (
                <div className="flex gap-4" key={step}>
                  <div className={`mt-1 h-3 w-3 rounded-full ${active ? "bg-primary" : "bg-muted"}`} />
                  <div>
                    <p className={`font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{step.replace("_", " ")}</p>
                    <p className="text-sm text-muted-foreground">
                      {active ? (index === currentIndex ? "Current stage" : "Reached") : "Not yet"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
