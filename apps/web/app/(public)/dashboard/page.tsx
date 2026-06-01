"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, Calendar, ChevronRight, FileText, FlaskConical, MapPin, User } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

import { listMyOrders } from "@/api/orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PatientDashboardPage() {
  const { data: session } = useSession();

  const ordersQuery = useQuery({
    queryKey: ["orders", "mine"],
    queryFn: () => listMyOrders()
  });

  const orders = ordersQuery.data?.data || [];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              Hello, {session?.user?.name || "Patient"}
            </h1>
            <p className="text-xs text-slate-400 mt-1">Manage your home blood test orders and download medical reports</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/reports">
              <Button className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold" variant="outline">
                <FileText className="h-4 w-4 mr-1.5" /> Download Reports
              </Button>
            </Link>
            <Link href="/tests">
              <Button className="rounded-xl bg-primary text-white hover:bg-primary/95 text-xs font-semibold shadow-sm shadow-primary/10">
                Book New Test
              </Button>
            </Link>
          </div>
        </div>

        {/* Orders Listing */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
            <Activity className="h-5 w-5 text-primary" /> Active & Past Bookings
          </h2>

          {ordersQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton className="h-32 rounded-3xl" key={index} />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20 bg-white border border-slate-100 rounded-3xl">
              <FlaskConical className="h-12 w-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700 mt-4">No Bookings Found</h3>
              <p className="text-xs text-slate-400 mt-1">You haven't booked any diagnostics yet.</p>
              <Link href="/tests">
                <Button className="mt-6 rounded-xl bg-primary text-white">Find Blood Tests</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const meta = order.items as any;
                const statusColor = order.paymentStatus === "paid" ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50";

                return (
                  <div
                    className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                    key={order.id}
                  >
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                          Order Reference: #{order.id.slice(0, 8)}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${statusColor}`}>
                          {order.paymentStatus === "paid" ? "Paid" : "Pending Payment"}
                        </span>
                        {order.appointment && (
                          <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full">
                            Appointment: {order.appointment.status}
                          </span>
                        )}
                      </div>

                      <div className="text-slate-700 font-bold text-sm">
                        {meta.testTypes?.join(", ") || "Health Checkup"}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1.5 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          <span>Patient: {meta.patientName} ({meta.patientAge}y, {meta.patientGender})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>Slot: {meta.slot}</span>
                        </div>
                        <div className="flex items-center gap-1.5 col-span-1 sm:col-span-2 md:col-span-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span className="line-clamp-1">Address: {meta.address}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                      <div>
                        <p className="text-[10px] text-slate-400">Total Price</p>
                        <p className="text-lg font-black text-slate-800">₹{order.totalAmount}</p>
                      </div>
                      <Link href={`/dashboard/order/${order.id}`}>
                        <Button className="rounded-xl flex items-center gap-1 hover:bg-slate-50 text-xs font-semibold border-slate-200 text-slate-600" variant="outline">
                          Track Status <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
