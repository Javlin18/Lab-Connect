"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { deleteUser, listUsers, updateUser } from "@/api/users";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: session } = useSession();
  const employeesQuery = useQuery({
    queryKey: ["users", "employees"],
    queryFn: () => listUsers("employee")
  });
  const [name, setName] = useState(session?.user?.name ?? "");
  const [email, setEmail] = useState(session?.user?.email ?? "");
  const [phone, setPhone] = useState(session?.user?.phone ?? "");

  useEffect(() => {
    setName(session?.user?.name ?? "");
    setEmail(session?.user?.email ?? "");
    setPhone(session?.user?.phone ?? "");
  }, [session?.user?.email, session?.user?.name, session?.user?.phone]);

  const updateProfileMutation = useMutation({
    mutationFn: () =>
      updateUser(session?.user.id ?? "", {
        email,
        name,
        phone
      }),
    onSuccess: () => {
      toast({ title: "Profile updated", description: "Chief data changed." });
    },
    onError: (error: Error) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      toast({ title: "Employee removed", description: "Account gone." });
      queryClient.invalidateQueries({ queryKey: ["users", "employees"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (error: Error) => {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader description="Edit chief profile. Manage worker accounts." title="Settings" />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Admin Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <Button disabled={updateProfileMutation.isPending} onClick={() => updateProfileMutation.mutate()} type="button">
              Save Profile
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employee Accounts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {employeesQuery.isLoading ? (
              <div className="space-y-3 p-6">
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
                      <TableHead>Zone</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(employeesQuery.data?.data ?? []).map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>{employee.name}</TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>{employee.phone}</TableCell>
                        <TableCell>{employee.employee?.zone ?? "-"}</TableCell>
                        <TableCell>
                          <Button
                            disabled={deleteMutation.isPending}
                            onClick={() => deleteMutation.mutate(employee.id)}
                            size="sm"
                            variant="destructive"
                          >
                            Remove
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
      </div>
    </div>
  );
}
