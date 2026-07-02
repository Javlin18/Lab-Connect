"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, FlaskConical, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

import { listTests, createTest, updateTest, deleteTest } from "@/api/tests";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/app/page-header";
import { useToast } from "@/hooks/use-toast";

export default function AdminTestsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [category, setCategory] = useState("");
  const [sampleType, setSampleType] = useState("Blood");
  const [preparationInstructions, setPreparationInstructions] = useState("");
  const [parameters, setParameters] = useState("");
  const [turnaroundHours, setTurnaroundHours] = useState("24");
  const [isActive, setIsActive] = useState(true);

  // Fetch Tests (admin mode returns all)
  const testsQuery = useQuery({
    queryKey: ["admin-tests"],
    queryFn: () => listTests(true)
  });

  const tests = testsQuery.data?.data || [];

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => createTest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tests"] });
      queryClient.invalidateQueries({ queryKey: ["tests"] });
      toast({ title: "Test created successfully" });
      closeForm();
    },
    onError: (err: any) => {
      toast({ title: "Error creating test", description: err.message, variant: "destructive" });
    }
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payload: any }) => updateTest(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tests"] });
      queryClient.invalidateQueries({ queryKey: ["tests"] });
      toast({ title: "Test updated successfully" });
      closeForm();
    },
    onError: (err: any) => {
      toast({ title: "Error updating test", description: err.message, variant: "destructive" });
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tests"] });
      queryClient.invalidateQueries({ queryKey: ["tests"] });
      toast({ title: "Test deleted successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Error deleting test", description: err.message, variant: "destructive" });
    }
  });

  const closeForm = () => {
    setIsOpen(false);
    setEditingId(null);
    setName("");
    setSlug("");
    setDescription("");
    setPrice("");
    setDiscountPrice("");
    setCategory("");
    setSampleType("Blood");
    setPreparationInstructions("");
    setParameters("");
    setTurnaroundHours("24");
    setIsActive(true);
  };

  const handleEdit = (test: any) => {
    setEditingId(test.id);
    setName(test.name);
    setSlug(test.slug);
    setDescription(test.description);
    setPrice(test.price.toString());
    setDiscountPrice(test.discountPrice ? test.discountPrice.toString() : "");
    setCategory(test.category);
    setSampleType(test.sampleType);
    setPreparationInstructions(test.preparationInstructions);
    setParameters(test.parameters?.join(", ") || "");
    setTurnaroundHours(test.turnaroundHours.toString());
    setIsActive(test.isActive);
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug || !price || !category) {
      toast({ title: "Validation Error", description: "Name, slug, price, and category are required", variant: "destructive" });
      return;
    }

    const payload = {
      name,
      slug,
      description,
      price: parseFloat(price),
      discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
      category,
      sampleType,
      preparationInstructions,
      parameters: parameters.split(",").map((p) => p.trim()).filter(Boolean),
      turnaroundHours: parseInt(turnaroundHours),
      isActive
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        action={
          <Button className="rounded-xl flex items-center gap-1.5 bg-primary text-white hover:bg-primary/95" onClick={() => setIsOpen(true)}>
            <Plus className="h-4 w-4" /> Add Diagnostic Test
          </Button>
        }
        description="Configure diagnostic tests, samples, preparation guidelines, and parameters."
        title="Tests Management"
      />

      {/* Modal Dialog Form */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-slate-100 shadow-2xl bg-white">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">{editingId ? "Edit Test" : "Create New Diagnostic Test"}</h3>
              <Button className="rounded-full p-0 h-8 w-8 text-slate-400 hover:text-slate-700" onClick={closeForm} variant="ghost">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form className="p-6 space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="testName">Test Name</Label>
                  <Input id="testName" onChange={(e) => setName(e.target.value)} required value={name} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="testSlug">Slug (URL friendly)</Label>
                  <Input id="testSlug" onChange={(e) => setSlug(e.target.value)} placeholder="e.g. cbc" required value={slug} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="testDesc">Description</Label>
                  <Textarea
                    id="testDesc"
                    onChange={(e) => setDescription(e.target.value)}
                    value={description}
                    rows={5}
                    placeholder="Explain what this test measures, why it's important, what results mean, and who should take it..."
                    className="resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="testPrice">Original Price (₹)</Label>
                  <Input id="testPrice" onChange={(e) => setPrice(e.target.value)} required type="number" value={price} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="testDiscount">Discounted Price (₹ - Optional)</Label>
                  <Input id="testDiscount" onChange={(e) => setDiscountPrice(e.target.value)} type="number" value={discountPrice} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="testCategory">Category</Label>
                  <Input id="testCategory" onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Blood Tests" required value={category} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="testSample">Sample Type</Label>
                  <Input id="testSample" onChange={(e) => setSampleType(e.target.value)} required value={sampleType} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="testPrep">Preparation Instructions</Label>
                  <Input id="testPrep" onChange={(e) => setPreparationInstructions(e.target.value)} placeholder="e.g. Fasting required" value={preparationInstructions} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="testParams">Tested Parameters (Comma separated list)</Label>
                  <Input id="testParams" onChange={(e) => setParameters(e.target.value)} placeholder="Hemoglobin, Platelets, WBC..." value={parameters} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="testHours">Turnaround (Hours)</Label>
                  <Input id="testHours" onChange={(e) => setTurnaroundHours(e.target.value)} required type="number" value={turnaroundHours} />
                </div>
                <div className="flex items-center gap-2 pt-8">
                  <input
                    checked={isActive}
                    id="testActive"
                    onChange={(e) => setIsActive(e.target.checked)}
                    type="checkbox"
                  />
                  <Label htmlFor="testActive">Test is Active (Visible on site)</Label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button className="rounded-xl" onClick={closeForm} type="button" variant="outline">Cancel</Button>
                <Button className="rounded-xl bg-primary text-white hover:bg-primary/95" type="submit">
                  {editingId ? "Save Changes" : "Create Test"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Tests Grid/Table */}
      <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-slate-700">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  <th className="px-6 py-4">Test Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Sample</th>
                  <th className="px-6 py-4">Pricing</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {tests.length === 0 ? (
                  <tr>
                    <td className="px-6 py-12 text-center text-slate-400" colSpan={6}>
                      <FlaskConical className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                      No tests configured yet.
                    </td>
                  </tr>
                ) : (
                  tests.map((t: any) => (
                    <tr className="hover:bg-slate-50/40" key={t.id}>
                      <td className="px-6 py-4 font-semibold text-slate-800">{t.name}</td>
                      <td className="px-6 py-4"><span className="text-xs font-semibold px-2 py-0.5 bg-red-50 text-primary rounded-full">{t.category}</span></td>
                      <td className="px-6 py-4 text-slate-500">{t.sampleType}</td>
                      <td className="px-6 py-4">
                        <span className="font-bold">₹{t.discountPrice || t.price}</span>
                        {t.discountPrice && (
                          <span className="text-xs text-slate-400 line-through ml-1.5">₹{t.price}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold ${t.isActive ? "text-emerald-600" : "text-slate-400"}`}>
                          {t.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <Button className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-0" onClick={() => handleEdit(t)} variant="ghost">
                          <Edit2 className="h-4.5 w-4.5" />
                        </Button>
                        <Button
                          className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-red-50 rounded-lg p-0"
                          onClick={() => deleteMutation.mutate(t.id)}
                          variant="ghost"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
