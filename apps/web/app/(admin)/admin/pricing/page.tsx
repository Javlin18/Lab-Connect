"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Coins, Edit2, X } from "lucide-react";
import { useState } from "react";

import { listTests, updateTest } from "@/api/tests";
import { listPackages } from "@/api/packages";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type EditTarget = { id: string; name: string; price: number; discountPrice?: number | null; type: "test" | "package" };

export default function AdminPricingPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");

  const testsQuery = useQuery({
    queryKey: ["admin-tests"],
    queryFn: () => listTests(true)
  });

  const packagesQuery = useQuery({
    queryKey: ["admin-packages"],
    queryFn: () => listPackages(true)
  });

  const tests = testsQuery.data?.data ?? [];
  const packages = packagesQuery.data?.data ?? [];

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { price: number; discountPrice?: number | null } }) =>
      updateTest(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tests"] });
      queryClient.invalidateQueries({ queryKey: ["tests"] });
      toast({ title: "Price updated successfully" });
      setEditing(null);
    },
    onError: (err: any) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    }
  });

  const openEdit = (item: EditTarget) => {
    setEditing(item);
    setPrice(item.price.toString());
    setDiscountPrice(item.discountPrice ? item.discountPrice.toString() : "");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !price) return;
    updateMutation.mutate({
      id: editing.id,
      payload: {
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null
      }
    });
  };

  const savings = (price: number, discountPrice?: number | null) => {
    if (!discountPrice) return null;
    const pct = Math.round(((price - discountPrice) / price) * 100);
    return pct;
  };

  return (
    <div className="space-y-8">
      <PageHeader
        description="Manage prices and discount offers for tests and packages."
        title="Pricing"
      />

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <Card className="w-full max-w-sm rounded-3xl border-slate-100 shadow-2xl bg-white">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Edit Price</h3>
              <Button className="rounded-full p-0 h-8 w-8 text-slate-400" onClick={() => setEditing(null)} variant="ghost">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form className="p-6 space-y-4" onSubmit={handleSave}>
              <p className="text-sm font-semibold text-slate-700">{editing.name}</p>
              <div className="space-y-1.5">
                <Label htmlFor="editPrice">Original Price (₹)</Label>
                <Input
                  id="editPrice"
                  min="0"
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  step="0.01"
                  type="number"
                  value={price}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editDiscount">Discounted Price (₹ — optional)</Label>
                <Input
                  id="editDiscount"
                  min="0"
                  onChange={(e) => setDiscountPrice(e.target.value)}
                  placeholder="Leave blank to remove discount"
                  step="0.01"
                  type="number"
                  value={discountPrice}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <Button onClick={() => setEditing(null)} type="button" variant="outline">Cancel</Button>
                <Button className="bg-primary text-white hover:bg-primary/95" disabled={updateMutation.isPending} type="submit">
                  Save Price
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Tests Pricing */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-slate-700 flex items-center gap-2">
          <Coins className="h-4 w-4 text-primary" /> Tests
        </h2>
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-slate-700">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    <th className="px-6 py-4">Test Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">MRP (₹)</th>
                    <th className="px-6 py-4">Offer Price (₹)</th>
                    <th className="px-6 py-4">Discount</th>
                    <th className="px-6 py-4 text-right">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {tests.length === 0 ? (
                    <tr>
                      <td className="px-6 py-10 text-center text-slate-400" colSpan={6}>No tests found.</td>
                    </tr>
                  ) : (
                    tests.map((t: any) => {
                      const pct = savings(t.price, t.discountPrice);
                      return (
                        <tr className="hover:bg-slate-50/40" key={t.id}>
                          <td className="px-6 py-4 font-semibold text-slate-800">{t.name}</td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-semibold px-2 py-0.5 bg-red-50 text-primary rounded-full">{t.category}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-500">₹{t.price}</td>
                          <td className="px-6 py-4 font-bold text-slate-800">
                            {t.discountPrice ? `₹${t.discountPrice}` : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-6 py-4">
                            {pct ? (
                              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{pct}% off</span>
                            ) : (
                              <span className="text-slate-300 text-xs">No discount</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button
                              className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-0"
                              onClick={() => openEdit({ id: t.id, name: t.name, price: t.price, discountPrice: t.discountPrice, type: "test" })}
                              variant="ghost"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Packages Pricing */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-slate-700 flex items-center gap-2">
          <Coins className="h-4 w-4 text-primary" /> Health Packages
        </h2>
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-slate-700">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    <th className="px-6 py-4">Package Name</th>
                    <th className="px-6 py-4">Tests Included</th>
                    <th className="px-6 py-4">MRP (₹)</th>
                    <th className="px-6 py-4">Offer Price (₹)</th>
                    <th className="px-6 py-4">Discount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {packages.length === 0 ? (
                    <tr>
                      <td className="px-6 py-10 text-center text-slate-400" colSpan={5}>No packages found.</td>
                    </tr>
                  ) : (
                    packages.map((p: any) => {
                      const pct = savings(p.price, p.discountPrice);
                      return (
                        <tr className="hover:bg-slate-50/40" key={p.id}>
                          <td className="px-6 py-4 font-semibold text-slate-800">{p.name}</td>
                          <td className="px-6 py-4 text-slate-500">{p.tests?.length ?? 0} tests</td>
                          <td className="px-6 py-4 text-slate-500">₹{p.price}</td>
                          <td className="px-6 py-4 font-bold text-slate-800">
                            {p.discountPrice ? `₹${p.discountPrice}` : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-6 py-4">
                            {pct ? (
                              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{pct}% off</span>
                            ) : (
                              <span className="text-slate-300 text-xs">No discount</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
