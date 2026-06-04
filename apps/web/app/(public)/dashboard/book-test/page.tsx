"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, TestTube2 } from "lucide-react";
import Link from "next/link";

import { listTests } from "@/api/tests";
import { PatientDashboardShell } from "@/components/app/patient-dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function BookTestPage() {
  const testsQuery = useQuery({
    queryKey: ["tests"],
    queryFn: () => listTests()
  });

  const tests = testsQuery.data?.data || [];

  return (
    <PatientDashboardShell>
      <section className="dashboard-card-soft border-blue-100 p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Book Test</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">All diagnostic tests available for home sample collection.</h2>
      </section>

      {testsQuery.isLoading ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton className="h-44 rounded-xl" key={index} />
          ))}
        </section>
      ) : testsQuery.isError ? (
        <Card className="dashboard-card-soft border-red-100">
          <CardContent className="p-6">
            <p className="font-bold text-slate-950">Tests could not be loaded.</p>
            <p className="mt-1 text-sm text-slate-500">Please make sure the API server is running and try again.</p>
          </CardContent>
        </Card>
      ) : tests.length === 0 ? (
        <Card className="dashboard-card-soft">
          <CardContent className="p-6">
            <p className="font-bold text-slate-950">No tests available.</p>
            <p className="mt-1 text-sm text-slate-500">Once tests are added, they will appear here automatically.</p>
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tests.map((test) => (
            <Card className="dashboard-card-accent group" key={test.id}>
              <CardHeader className="p-5 pt-6">
                <div className="dashboard-icon mb-3 h-11 w-11 transition group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
                  <TestTube2 className="h-5 w-5" />
                </div>
                <CardTitle className="text-base leading-snug">{test.name}</CardTitle>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-blue-600">{test.category}</p>
              </CardHeader>
              <CardContent className="space-y-4 p-5 pt-0">
                <p className="line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{test.description}</p>
                <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <div>
                    <p className="text-xs text-slate-500">{test.turnaroundHours}h report</p>
                    <p className="text-lg font-black text-slate-950">Rs. {test.discountPrice || test.price}</p>
                  </div>
                  <Link className="flex items-center rounded-lg bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-600 hover:text-white" href={`/tests/${test.slug}`}>
                    Book <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </PatientDashboardShell>
  );
}
