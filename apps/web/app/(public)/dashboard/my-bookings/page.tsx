"use client";

import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { listMyOrders } from "@/api/orders";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Order } from "@lab-app/shared";

const tabs = ["All", "Upcoming", "Completed", "Cancelled"] as const;

function statusLabel(order: Order) {
  const status = order.appointment?.status;
  if (order.paymentStatus !== "paid") return "Payment Pending";
  if (status === "completed") return "Report Ready";
  if (status === "collected") return "Sample Collected";
  if (status === "assigned") return "Employee Assigned";
  return "Confirmed";
}

export default function MyBookingsPage() {
  const { status } = useSession();
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");

  const ordersQ = useQuery({
    queryKey: ["orders", "mine"],
    queryFn: listMyOrders,
  });

  const all = ordersQ.data?.data ?? [];
  const orders = all.filter((order) => {
    if (tab === "Completed") return order.appointment?.status === "completed";
    if (tab === "Upcoming") return order.appointment?.status !== "completed";
    if (tab === "Cancelled") return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">My Bookings</h1>
        <p className="text-sm text-slate-500 mt-1">All your lab test collection bookings</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((item) => (
          <button
            className={`h-8 px-4 rounded-xl text-xs font-semibold transition border ${
              tab === item
                ? "bg-red-600 text-white border-red-600 shadow-sm"
                : "bg-white text-slate-500 border-slate-200 hover:border-red-300 hover:text-red-600"
            }`}
            key={item}
            onClick={() => setTab(item)}
            type="button"
          >
            {item}{item === "All" ? ` (${all.length})` : ""}
          </button>
        ))}
      </div>

      {ordersQ.isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Could not load bookings. Refresh the page.
        </div>
      ) : status === "loading" || ordersQ.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton className="h-36 rounded-2xl" key={i} />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border border-slate-100">
          <ClipboardList className="h-12 w-12 text-slate-300 mb-4" />
          <p className="font-bold text-slate-700">No bookings yet</p>
          <Link className="mt-3 text-xs text-red-600 font-semibold hover:underline" href="/tests">
            Book your first test →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const meta = order.items as { testTypes?: string[]; slot?: string };
            return (
              <Card className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden" key={order.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="font-black text-slate-900">#{order.id.slice(0, 8)}</span>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                      {statusLabel(order)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">{meta.testTypes?.slice(0, 2).join(", ") ?? "Health tests"}</p>
                  <p className="text-xs text-slate-400 mt-1">{meta.slot ?? order.createdAt}</p>
                  <Link
                    className="mt-4 flex h-10 items-center justify-center rounded-xl border border-red-600 text-sm font-bold text-red-600 hover:bg-red-50 transition"
                    href={`/dashboard/order/${order.id}`}
                  >
                    View Details
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
