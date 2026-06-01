"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, FileText, FlaskConical, AlertCircle } from "lucide-react";
import Link from "next/link";

import { listMyOrders } from "@/api/orders";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsPage() {
  const ordersQuery = useQuery({
    queryKey: ["orders", "mine"],
    queryFn: () => listMyOrders()
  });

  const orders = ordersQuery.data?.data || [];

  // Filter only those bookings that have a report uploaded
  const reports = orders
    .filter((order) => order.appointment?.testResult)
    .map((order) => ({
      orderId: order.id,
      testNames: (order.items as any).testTypes || ["Health Diagnostics"],
      patientName: (order.items as any).patientName,
      date: order.appointment?.testResult?.uploadedAt
        ? new Date(order.appointment.testResult.uploadedAt).toLocaleDateString()
        : new Date(order.createdAt).toLocaleDateString(),
      reportUrl: order.appointment?.testResult?.reportUrl || "#",
      id: order.appointment?.testResult?.id
    }));

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Link className="flex items-center gap-1 text-xs text-slate-500 hover:text-primary transition" href="/dashboard">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Your Diagnostic Reports</h1>
          <p className="text-xs text-slate-400 mt-1">Download certified smart reports for your completed laboratory tests</p>
        </div>

        {ordersQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, idx) => (
              <Skeleton className="h-20 rounded-2xl" key={idx} />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-100 rounded-3xl">
            <FileText className="h-12 w-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 mt-4">No Reports Ready</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Reports appear here once your samples are collected, processed in the lab, and certified.
            </p>
            <Link href="/dashboard">
              <Button className="mt-6 rounded-xl" variant="outline">Track Active Orders</Button>
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-3xl divide-y divide-slate-100 shadow-sm overflow-hidden">
            {reports.map((report) => (
              <div className="p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-slate-50/30 transition" key={report.id}>
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-primary flex-shrink-0">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm leading-tight">
                      {report.testNames.join(", ")}
                    </h4>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5">
                      <span>Patient: <span className="font-semibold text-slate-600">{report.patientName}</span></span>
                      <span>Uploaded: {report.date}</span>
                      <span>Ref: #{report.orderId.slice(0, 8)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <a href={report.reportUrl} target="_blank" rel="noreferrer">
                    <Button className="rounded-xl flex items-center gap-1.5 bg-primary hover:bg-primary/95 text-white text-xs font-bold shadow-sm shadow-primary/10">
                      <Download className="h-4 w-4" /> Download PDF
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
