"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";

import { listAppointments } from "@/api/appointments";
import { countEmployeeTasksForDate, listEmployees } from "@/api/employees";
import { createEmployee } from "@/api/users";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

const day = format(new Date(), "yyyy-MM-dd");

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [zone, setZone] = useState("");
  const [password, setPassword] = useState("");

  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: () => listEmployees()
  });
  const appointmentsQuery = useQuery({
    queryKey: ["appointments", "employee-counts"],
    queryFn: () => listAppointments()
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createEmployee({
        email,
        name,
        password,
        phone,
        zone
      }),
    onSuccess: () => {
      toast({ title: "Employee created", description: "New runner added." });
      setOpen(false);
      setName("");
      setEmail("");
      setPhone("");
      setZone("");
      setPassword("");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: Error) => {
      toast({ title: "Create failed", description: error.message, variant: "destructive" });
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader
        action={<Button onClick={() => setOpen(true)}>Add Employee</Button>}
        description="Track crew, zones, work count."
        title="Employees"
      />

      <Card>
        <CardContent className="p-0">
          {employeesQuery.isLoading || appointmentsQuery.isLoading ? (
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
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead>Today's Task Count</TableHead>
                    <TableHead>Assigned Appointments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(employeesQuery.data?.data ?? []).map((record) => (
                    <TableRow key={record.employee.id}>
                      <TableCell className="font-medium">{record.user.name}</TableCell>
                      <TableCell>{record.user.phone}</TableCell>
                      <TableCell>{record.employee.zone}</TableCell>
                      <TableCell>{record.employee.isAvailable ? "Available" : "Busy"}</TableCell>
                      <TableCell>
                        {countEmployeeTasksForDate(
                          appointmentsQuery.data?.data ?? [],
                          record.user.id,
                          day
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {(appointmentsQuery.data?.data ?? [])
                            .filter((item) => item.employeeId === record.user.id)
                            .slice(0, 3)
                            .map((item) => item.id.slice(0, 8))
                            .join(", ") || "No tasks"}
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

      <Dialog open={open}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Employee</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input onChange={(event) => setName(event.target.value)} value={name} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input onChange={(event) => setPhone(event.target.value)} value={phone} />
            </div>
            <div className="space-y-2">
              <Label>Zone</Label>
              <Input onChange={(event) => setZone(event.target.value)} value={zone} />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input onChange={(event) => setPassword(event.target.value)} type="password" value={password} />
            </div>
            <div className="flex gap-2">
              <Button disabled={createMutation.isPending} onClick={() => createMutation.mutate()} type="button">
                Save
              </Button>
              <Button onClick={() => setOpen(false)} type="button" variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
