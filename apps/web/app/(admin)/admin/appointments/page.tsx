"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";

import { assignAppointment, completeAppointment, listAppointments } from "@/api/appointments";
import { listUsers } from "@/api/users";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

export default function AppointmentsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [assignEmployeeId, setAssignEmployeeId] = useState("");

  const appointmentsQuery = useQuery({
    queryKey: ["appointments", date, status, employeeId],
    queryFn: () =>
      listAppointments({
        date: date || undefined,
        employeeId: employeeId || undefined,
        status: (status || undefined) as never
      })
  });

  const patientsQuery = useQuery({
    queryKey: ["users", "patients"],
    queryFn: () => listUsers("patient")
  });

  const employeesQuery = useQuery({
    queryKey: ["users", "employees"],
    queryFn: () => listUsers("employee")
  });

  const assignMutation = useMutation({
    mutationFn: ({ appointmentId, workerId }: { appointmentId: string; workerId: string }) =>
      assignAppointment(appointmentId, workerId),
    onSuccess: () => {
      toast({ title: "Assigned", description: "Employee now owns job." });
      setSelectedAppointmentId(null);
      setAssignEmployeeId("");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (error: Error) => {
      toast({ title: "Assign failed", description: error.message, variant: "destructive" });
    }
  });

  const completeMutation = useMutation({
    mutationFn: (appointmentId: string) => completeAppointment(appointmentId, "Marked complete from web"),
    onSuccess: () => {
      toast({ title: "Completed", description: "Appointment closed." });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (error: Error) => {
      toast({ title: "Complete failed", description: error.message, variant: "destructive" });
    }
  });

  const patientMap = useMemo(
    () => new Map((patientsQuery.data?.data ?? []).map((item) => [item.id, item.name])),
    [patientsQuery.data?.data]
  );
  const employeeMap = useMemo(
    () => new Map((employeesQuery.data?.data ?? []).map((item) => [item.id, item.name])),
    [employeesQuery.data?.data]
  );

  const selectedAppointment = (appointmentsQuery.data?.data ?? []).find((item) => item.id === selectedAppointmentId);

  return (
    <div className="space-y-6">
      <PageHeader
        action={
          <Link className={buttonVariants()} href="/appointments/new">
            + New Appointment
          </Link>
        }
        description="Filter, assign, inspect, complete."
        title="Appointments"
      />

      <Card>
        <CardContent className="grid gap-4 p-6 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" onChange={(event) => setDate(event.target.value)} type="date" value={date} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select id="status" onChange={(event) => setStatus(event.target.value)} value={status}>
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="accepted">Accepted</option>
              <option value="en_route">En Route</option>
              <option value="collected">Collected</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="employee">Employee</Label>
            <Select id="employee" onChange={(event) => setEmployeeId(event.target.value)} value={employeeId}>
              <option value="">All</option>
              {(employeesQuery.data?.data ?? []).map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {appointmentsQuery.isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton className="h-10" key={index} />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Patient Name</TableHead>
                    <TableHead>Tests</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Slot</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(appointmentsQuery.data?.data ?? []).map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium">{appointment.id.slice(0, 8)}</TableCell>
                      <TableCell>{patientMap.get(appointment.patientId) ?? appointment.patientId.slice(0, 8)}</TableCell>
                      <TableCell>{appointment.testTypes.join(", ")}</TableCell>
                      <TableCell>{employeeMap.get(appointment.employeeId) ?? "Unassigned"}</TableCell>
                      <TableCell>{appointment.slot}</TableCell>
                      <TableCell>
                        <StatusBadge status={appointment.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            className={buttonVariants({ size: "sm", variant: "outline" })}
                            href={`/appointments/${appointment.id}`}
                          >
                            View
                          </Link>
                          <Button
                            onClick={() => setSelectedAppointmentId(appointment.id)}
                            size="sm"
                            variant="secondary"
                          >
                            Assign Employee
                          </Button>
                          <Button
                            disabled={appointment.status === "completed" || completeMutation.isPending}
                            onClick={() => completeMutation.mutate(appointment.id)}
                            size="sm"
                          >
                            Mark Complete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedAppointmentId)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select onChange={(event) => setAssignEmployeeId(event.target.value)} value={assignEmployeeId}>
              <option value="">Choose worker</option>
              {(employeesQuery.data?.data ?? []).map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </Select>
            <div className="flex gap-2">
              <Button
                disabled={!selectedAppointment || !assignEmployeeId || assignMutation.isPending}
                onClick={() =>
                  selectedAppointment &&
                  assignMutation.mutate({ appointmentId: selectedAppointment.id, workerId: assignEmployeeId })
                }
              >
                Save
              </Button>
              <Button onClick={() => setSelectedAppointmentId(null)} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
