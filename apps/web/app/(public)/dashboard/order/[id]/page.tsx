"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Circle, Clock, FlaskConical, MapPin, Phone, ShieldCheck, User } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { listMyOrders } from "@/api/orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const STEPS = [
  { key: "pending", label: "Booking Confirmed", desc: "Order details received by lab" },
  { key: "assigned", label: "Phlebotomist Assigned", desc: "Lab technician scheduled for visit" },
  { key: "en_route", label: "En Route", desc: "Technician traveling to your location" },
  { key: "collected", label: "Sample Collected", desc: "Sample safely packed & labeled" },
  { key: "processing", label: "Lab Processing", desc: "Sample undergoing NABL diagnostics" },
  { key: "completed", label: "Report Completed", desc: "Smart reports generated and ready" }
];

export default function OrderTrackerPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const ordersQuery = useQuery({
    queryKey: ["orders", "mine"],
    queryFn: () => listMyOrders()
  });

  const orders = ordersQuery.data?.data || [];
  const order = orders.find((o) => o.id === id);

  if (ordersQuery.isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20 mx-auto max-w-md">
        <ShieldCheck className="h-12 w-12 text-slate-300 mx-auto" />
        <h3 className="font-bold text-slate-800 mt-4 text-lg">Order Not Found</h3>
        <p className="text-xs text-slate-400 mt-1">We couldn't retrieve the specified order.</p>
        <Link href="/dashboard">
          <Button className="mt-6 rounded-xl" variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const meta = order.items as any;
  const currentStatus = order.appointment?.status || "pending";

  // Determine current active step index
  let activeIndex = 0;
  if (currentStatus === "assigned" || currentStatus === "accepted") {
    activeIndex = 1;
  } else if (currentStatus === "en_route") {
    activeIndex = 2;
  } else if (currentStatus === "collected") {
    activeIndex = 3;
  } else if (currentStatus === "processing") {
    activeIndex = 4;
  } else if (currentStatus === "completed") {
    activeIndex = 5;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Link className="flex items-center gap-1 text-xs text-slate-500 hover:text-primary transition" href="/dashboard">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-1.5">
              <FlaskConical className="h-5 w-5 text-primary" /> Appointment Tracker
            </h2>

            {/* Timeline Flow */}
            <div className="relative pl-6 space-y-8 border-l border-slate-100 ml-3">
              {STEPS.map((step, idx) => {
                const isDone = idx <= activeIndex;
                const isCurrent = idx === activeIndex;

                return (
                  <div className="relative" key={step.key}>
                    {/* Circle icon */}
                    <div
                      className={`absolute -left-9 top-1 flex h-6 w-6 items-center justify-center rounded-full border transition ${
                        isDone
                          ? "bg-primary border-primary text-white"
                          : "bg-white border-slate-200 text-slate-300"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Circle className="h-2 w-2 fill-current" />
                      )}
                    </div>

                    <div>
                      <h4
                        className={`text-sm font-bold transition ${
                          isCurrent ? "text-primary text-base" : isDone ? "text-slate-800" : "text-slate-400"
                        }`}
                      >
                        {step.label}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Info sidebar */}
        <div className="space-y-6">
          {/* Order Details card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Booking Info</h3>

            <div className="text-xs text-slate-500 space-y-3 pt-2">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Patient</span>
                <p className="font-semibold text-slate-700 mt-0.5">
                  {meta.patientName} ({meta.patientAge}y, {meta.patientGender})
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Booked Slot</span>
                <p className="font-semibold text-slate-700 mt-0.5">{meta.slot}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Address</span>
                <p className="font-semibold text-slate-700 mt-0.5">{meta.address}, {meta.pincode}</p>
              </div>
            </div>
          </div>

          {/* Phlebotomist Card if assigned */}
          {order.appointment?.employee && (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">Phlebotomist Details</h3>
              <div className="flex items-center gap-4 pt-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-700">{order.appointment.employee.name}</h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Phone className="h-3.5 w-3.5" /> {order.appointment.employee.phone}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Price details */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Pricing Details</h3>
            <div className="text-xs text-slate-500 space-y-2 border-t border-slate-50 pt-3">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{meta.breakdown?.subtotal || order.totalAmount}</span>
              </div>
              {meta.breakdown?.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span>-₹{meta.breakdown.discount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Collection Charges:</span>
                <span>₹{meta.breakdown?.homeCollectionCharges || 0}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-3 font-bold text-slate-800 text-sm">
                <span>Total Paid:</span>
                <span>₹{order.totalAmount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
