"use client";

import { useQuery } from "@tanstack/react-query";
import { Receipt } from "lucide-react";
import { useMemo, useState } from "react";

import { listAllOrders } from "@/api/orders";
import { listUsers } from "@/api/users";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminOrdersPage() {
  const [search, setSearch] = useState("");

  const ordersQuery = useQuery({
    queryKey: ["admin-orders"],
    queryFn: listAllOrders
  });

  const patientsQuery = useQuery({
    queryKey: ["users", "patients"],
    queryFn: () => listUsers("patient")
  });

  const patientMap = useMemo(
    () => new Map((patientsQuery.data?.data ?? []).map((u) => [u.id, u.name])),
    [patientsQuery.data?.data]
  );

  const orders = useMemo(() => {
    const all = ordersQuery.data?.data ?? [];
    if (!search) return all;
    const q = search.toLowerCase();
    return all.filter((o) => {
      const patientName = patientMap.get(o.patientId) ?? "";
      return (
        o.id.toLowerCase().includes(q) ||
        patientName.toLowerCase().includes(q) ||
        o.paymentStatus.toLowerCase().includes(q)
      );
    });
  }, [ordersQuery.data?.data, search, patientMap]);

  const totalRevenue = useMemo(
    () => (ordersQuery.data?.data ?? []).filter((o) => o.paymentStatus === "paid").reduce((sum, o) => sum + o.totalAmount, 0),
    [ordersQuery.data?.data]
  );

  const statusColor = (status: string) => {
    if (status === "paid") return "text-emerald-600 bg-emerald-50";
    if (status === "pending") return "text-amber-600 bg-amber-50";
    return "text-slate-500 bg-slate-100";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        description="Track all patient orders and payment statuses."
        title="Orders"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-white">
          <CardContent className="p-6">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Orders</p>
            <p className="text-3xl font-black text-slate-800 mt-1">{ordersQuery.data?.data?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-white">
          <CardContent className="p-6">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Paid Orders</p>
            <p className="text-3xl font-black text-emerald-600 mt-1">
              {(ordersQuery.data?.data ?? []).filter((o) => o.paymentStatus === "paid").length}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-white">
          <CardContent className="p-6">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Revenue</p>
            <p className="text-3xl font-black text-slate-800 mt-1">₹{totalRevenue.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card className="rounded-3xl border-slate-100 shadow-sm bg-white overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <Input
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID, patient name, or status..."
            value={search}
          />
        </div>
        <CardContent className="p-0">
          {ordersQuery.isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton className="h-10" key={i} />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-slate-700">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Patient</th>
                    <th className="px-6 py-4">Items</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Payment</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {orders.length === 0 ? (
                    <tr>
                      <td className="px-6 py-12 text-center text-slate-400" colSpan={6}>
                        <Receipt className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                        No orders found.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr className="hover:bg-slate-50/40" key={order.id}>
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{order.id.slice(0, 8)}…</td>
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {patientMap.get(order.patientId) ?? order.patientId.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {Array.isArray(order.items) ? order.items.length : "—"} item(s)
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800">
                          ₹{order.totalAmount.toLocaleString("en-IN")}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColor(order.paymentStatus)}`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-xs">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
