"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Boxes, Plus, X } from "lucide-react";
import { useState } from "react";

import { listTests } from "@/api/tests";
import { listPackages, createPackage } from "@/api/packages";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/app/page-header";
import { useToast } from "@/hooks/use-toast";

export default function AdminPackagesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);

  // Fetch Tests and Packages
  const testsQuery = useQuery({
    queryKey: ["admin-tests"],
    queryFn: () => listTests(true)
  });

  const packagesQuery = useQuery({
    queryKey: ["admin-packages"],
    queryFn: () => listPackages(true)
  });

  const tests = testsQuery.data?.data || [];
  const packages = packagesQuery.data?.data || [];

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => createPackage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-packages"] });
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      toast({ title: "Health package created successfully" });
      closeForm();
    },
    onError: (err: any) => {
      toast({ title: "Error creating package", description: err.message, variant: "destructive" });
    }
  });

  const closeForm = () => {
    setIsOpen(false);
    setName("");
    setSlug("");
    setDescription("");
    setPrice("");
    setDiscountPrice("");
    setSelectedTestIds([]);
  };

  const handleTestToggle = (testId: string) => {
    setSelectedTestIds((prev) =>
      prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug || !price) {
      toast({ title: "Validation Error", description: "Name, slug, and price are required", variant: "destructive" });
      return;
    }
    if (selectedTestIds.length === 0) {
      toast({ title: "Validation Error", description: "Please select at least one test to bundle", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      name,
      slug,
      description,
      price: parseFloat(price),
      discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
      testIds: selectedTestIds
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        action={
          <Button className="rounded-xl flex items-center gap-1.5 bg-primary text-white hover:bg-primary/95" onClick={() => setIsOpen(true)}>
            <Plus className="h-4 w-4" /> Create Health Package
          </Button>
        }
        description="Bundle multiple diagnostic blood tests into comprehensive health checkups."
        title="Packages Builder"
      />

      {/* Package Creation Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-slate-100 shadow-2xl bg-white">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Build Diagnostic Package</h3>
              <Button className="rounded-full p-0 h-8 w-8 text-slate-400 hover:text-slate-700" onClick={closeForm} variant="ghost">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form className="p-6 space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pkgName">Package Name</Label>
                  <Input id="pkgName" onChange={(e) => setName(e.target.value)} required value={name} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pkgSlug">Slug (URL friendly)</Label>
                  <Input id="pkgSlug" onChange={(e) => setSlug(e.target.value)} placeholder="e.g. full-body-care" required value={slug} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="pkgDesc">Description / Inclusions Summary</Label>
                  <Input id="pkgDesc" onChange={(e) => setDescription(e.target.value)} value={description} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pkgPrice">Original Package Price (₹)</Label>
                  <Input id="pkgPrice" onChange={(e) => setPrice(e.target.value)} required type="number" value={price} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pkgDiscount">Discounted Price (₹ - Optional)</Label>
                  <Input id="pkgDiscount" onChange={(e) => setDiscountPrice(e.target.value)} type="number" value={discountPrice} />
                </div>

                {/* Test Multi-select list */}
                <div className="sm:col-span-2 space-y-2">
                  <Label>Bundle Diagnostic Tests (Select tests to include)</Label>
                  <div className="border border-slate-150 rounded-2xl p-4 max-h-48 overflow-y-auto space-y-2 bg-slate-50/50">
                    {tests.length === 0 ? (
                      <p className="text-xs text-slate-400">No tests available. Create tests first.</p>
                    ) : (
                      tests.map((t: any) => (
                        <label className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold cursor-pointer" key={t.id}>
                          <input
                            checked={selectedTestIds.includes(t.id)}
                            onChange={() => handleTestToggle(t.id)}
                            type="checkbox"
                          />
                          <span>{t.name} (₹{t.discountPrice || t.price})</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button className="rounded-xl" onClick={closeForm} type="button" variant="outline">Cancel</Button>
                <Button className="rounded-xl bg-primary text-white hover:bg-primary/95" type="submit">
                  Create Package
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.length === 0 ? (
          <Card className="md:col-span-3 text-center py-16 bg-white border border-slate-100 rounded-3xl">
            <CardContent>
              <Boxes className="h-10 w-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">No health packages built yet.</p>
            </CardContent>
          </Card>
        ) : (
          packages.map((p: any) => (
            <Card className="rounded-3xl border-slate-100 shadow-sm bg-white overflow-hidden flex flex-col justify-between" key={p.id}>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Package Inclusions
                  </span>
                  <span className={`text-[10px] font-bold ${p.isActive ? "text-emerald-600 bg-emerald-50" : "text-slate-400 bg-slate-50"} px-2 py-0.5 rounded-full`}>
                    {p.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{p.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{p.description}</p>
                </div>

                <div className="space-y-1.5 pt-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bundled Tests:</p>
                  <ul className="text-xs text-slate-500 list-disc list-inside space-y-0.5">
                    {p.tests?.map((t: any) => (
                      <li key={t.id}>{t.name}</li>
                    )) || <li>No tests linked</li>}
                  </ul>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400">Package Price</p>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-black text-slate-800">₹{p.discountPrice || p.price}</span>
                    {p.discountPrice && (
                      <span className="text-xs text-slate-400 line-through">₹{p.price}</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
