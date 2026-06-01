"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { createAppointment } from "@/api/appointments";
import { listUsers } from "@/api/users";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const testOptions = ["CBC", "Blood Sugar", "Lipid Profile", "Thyroid Panel", "Vitamin D"];

export default function NewAppointmentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const patientsQuery = useQuery({
    queryKey: ["users", "patients"],
    queryFn: () => listUsers("patient")
  });
  const [patientPhone, setPatientPhone] = useState("");
  const [patientId, setPatientId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [tests, setTests] = useState<string[]>([]);

  const matchingPatient = useMemo(
    () => (patientsQuery.data?.data ?? []).find((patient) => patient.phone === patientPhone),
    [patientPhone, patientsQuery.data?.data]
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      let finalPatientId = matchingPatient?.id ?? patientId;

      if (!finalPatientId) {
        if (patientPhone && patientName && patientEmail) {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/auth/register`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              email: patientEmail,
              name: patientName,
              password: patientPhone.slice(-6) || "patient123",
              phone: patientPhone
            })
          });

          const payload = (await response.json()) as {
            data?: {
              id: string;
            };
            message?: string;
            success?: boolean;
          };

          if (!response.ok || !payload.success || !payload.data) {
            throw new Error(payload.message ?? "Patient creation failed");
          }

          finalPatientId = payload.data.id;
          setPatientId(finalPatientId);
          queryClient.invalidateQueries({ queryKey: ["users", "patients"] });
        } else {
          throw new Error("Patient details missing. Please scroll up and select an existing patient or fill in new patient details.");
        }
      }

      return createAppointment({
        address,
        notes,
        patientId: finalPatientId,
        slot: `${date} ${time}`,
        testTypes: tests
      });
    },
    onSuccess: () => {
      toast({ title: "Appointment made", description: "Fresh task added." });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      router.push("/appointments");
    },
    onError: (error: Error) => {
      toast({ title: "Creation failed", description: error.message, variant: "destructive" });
    }
  });

  const createPatientMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: patientEmail,
          name: patientName,
          password: patientPhone.slice(-6) || "patient123",
          phone: patientPhone
        })
      });

      const payload = (await response.json()) as {
        data?: {
          id: string;
        };
        message?: string;
        success?: boolean;
      };

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.message ?? "Patient creation failed");
      }

      return payload.data.id;
    },
    onSuccess: (createdPatientId) => {
      setPatientId(createdPatientId);
      toast({ title: "Patient created", description: "Now make appointment." });
      queryClient.invalidateQueries({ queryKey: ["users", "patients"] });
    },
    onError: (error: Error) => {
      toast({ title: "Patient create failed", description: error.message, variant: "destructive" });
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader description="Find old patient or forge new one, then book the visit." title="New Appointment" />
      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="patientPhone">Patient Phone</Label>
              <Input
                id="patientPhone"
                onChange={(event) => setPatientPhone(event.target.value)}
                placeholder="+91..."
                value={patientPhone}
              />
            </div>
            <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              {matchingPatient
                ? `Found: ${matchingPatient.name} (${matchingPatient.email})`
                : "No patient found yet. Fill new patient fields below."}
            </div>
          </div>

          {!matchingPatient ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="patientName">New Patient Name</Label>
                <Input id="patientName" onChange={(event) => setPatientName(event.target.value)} value={patientName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientEmail">New Patient Email</Label>
                <Input
                  id="patientEmail"
                  onChange={(event) => setPatientEmail(event.target.value)}
                  type="email"
                  value={patientEmail}
                />
              </div>
              <div className="md:col-span-2">
                <Button
                  disabled={!patientPhone || !patientName || !patientEmail || createPatientMutation.isPending}
                  onClick={() => createPatientMutation.mutate()}
                  type="button"
                  variant="outline"
                >
                  Create Patient
                </Button>
              </div>
            </div>
          ) : null}

          <div className="space-y-3">
            <Label>Tests</Label>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {testOptions.map((test) => (
                <label className="flex items-center gap-3 rounded-lg border p-3" key={test}>
                  <Checkbox
                    checked={tests.includes(test)}
                    onChange={(event) =>
                      setTests((current) =>
                        event.target.checked ? [...current, test] : current.filter((item) => item !== test)
                      )
                    }
                  />
                  <span>{test}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" onChange={(event) => setAddress(event.target.value)} value={address} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" onChange={(event) => setDate(event.target.value)} type="date" value={date} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time Slot</Label>
              <Input id="time" onChange={(event) => setTime(event.target.value)} type="time" value={time} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" onChange={(event) => setNotes(event.target.value)} value={notes} />
          </div>

          <Button
            disabled={!address || !date || !time || tests.length === 0 || createMutation.isPending}
            onClick={() => createMutation.mutate()}
            type="button"
          >
            Create Appointment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
