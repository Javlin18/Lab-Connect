"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { listAppointments } from "@/api/appointments";
import { getReport } from "@/api/reports";
import { listUsers } from "@/api/users";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const patientsQuery = useQuery({
    queryKey: ["users", "patients"],
    queryFn: () => listUsers("patient")
  });
  const appointmentsQuery = useQuery({
    queryKey: ["appointments", "patient-history"],
    queryFn: () => listAppointments()
  });

  const patients = useMemo(
    () =>
      (patientsQuery.data?.data ?? []).filter((patient) =>
        [patient.name, patient.email, patient.phone].some((field) =>
          field.toLowerCase().includes(search.toLowerCase())
        )
      ),
    [patientsQuery.data?.data, search]
  );

  const history = (appointmentsQuery.data?.data ?? []).filter((item) => item.patientId === selectedPatientId);

  return (
    <div className="space-y-6">
      <PageHeader description="Find patients, inspect history, open reports." title="Patients" />
      <Card>
        <CardContent className="space-y-4 p-6">
          <Input onChange={(event) => setSearch(event.target.value)} placeholder="Search patient..." value={search} />
          {patientsQuery.isLoading ? (
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
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>History</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">{patient.name}</TableCell>
                      <TableCell>{patient.email}</TableCell>
                      <TableCell>{patient.phone}</TableCell>
                      <TableCell>
                        <Button onClick={() => setSelectedPatientId(patient.id)} size="sm" variant="outline">
                          View History
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedPatientId)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Appointment History</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Tests</TableHead>
                  <TableHead>Slot</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Report</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>{appointment.id.slice(0, 8)}</TableCell>
                    <TableCell>{appointment.testTypes.join(", ")}</TableCell>
                    <TableCell>{appointment.slot}</TableCell>
                    <TableCell>{appointment.status}</TableCell>
                    <TableCell>
                      <Button
                        onClick={async () => {
                          const report = await getReport(appointment.id);
                          window.open(report.data.downloadUrl, "_blank", "noopener,noreferrer");
                        }}
                        size="sm"
                        variant="secondary"
                      >
                        Open Report
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button onClick={() => setSelectedPatientId(null)} variant="outline">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
