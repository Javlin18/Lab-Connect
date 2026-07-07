"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Coins, FileText, Plus, Receipt, Settings, Trash2 } from "lucide-react";
import { useState } from "react";

import { createExpense, deleteExpense, getExpenses, getPayrollSummary, updateEmployeePayConfig, getGlobalPayConfig } from "@/api/payroll";
import { listEmployees } from "@/api/employees";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { money } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function PayrollPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const now = new Date();
  const currentMonthStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 7);
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr = new Date(lastMonthDate.getTime() - lastMonthDate.getTimezoneOffset() * 60000).toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(lastMonthStr);
  const [activeTab, setActiveTab] = useState("summary");

  const { data: summaryResponse, isLoading: summaryLoading } = useQuery({
    queryKey: ["payroll-summary", selectedMonth],
    queryFn: () => getPayrollSummary(selectedMonth)
  });
  const summaryData = summaryResponse?.data ?? [];

  const { data: expensesResponse } = useQuery({
    queryKey: ["expenses", selectedMonth],
    queryFn: () => getExpenses(selectedMonth)
  });
  const expenses = expensesResponse?.data ?? [];

  const { data: employeesResponse } = useQuery({ queryKey: ["employees"], queryFn: listEmployees });
  const employees = employeesResponse?.data ?? [];

  // Pay Config Modal state
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedConfigEmployeeId, setSelectedConfigEmployeeId] = useState<string>("global");
  const [configForm, setConfigForm] = useState({
    incentivePerSample: 25,
    cancellationDeduction: 100,
    absentDeduction: 300,
    lateArrivalDeduction: 100,
    starBonus40: 400,
    starBonus80: 900,
    starBonus120: 1500,
    referralBonus: 750
  });

  const { data: globalConfigResponse } = useQuery({
    queryKey: ["global-pay-config"],
    queryFn: () => getGlobalPayConfig()
  });

  // Expense Modal state
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    employeeId: "",
    type: "bonus" as "bonus" | "deduction" | "reimbursement",
    amount: "",
    description: "",
    month: currentMonthStr
  });

  const updateConfigMutation = useMutation({
    mutationFn: (data: any) => updateEmployeePayConfig(selectedConfigEmployeeId, data),
    onSuccess: () => {
      toast({ title: "Pay configuration updated" });
      setConfigModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["payroll-summary"] });
      queryClient.invalidateQueries({ queryKey: ["global-pay-config"] });
    },
    onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" })
  });

  const addExpenseMutation = useMutation({
    mutationFn: (data: any) => createExpense(data),
    onSuccess: () => {
      toast({ title: "Expense record added" });
      setExpenseModalOpen(false);
      setExpenseForm({ ...expenseForm, amount: "", description: "" });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-summary"] });
    },
    onError: (e: Error) => toast({ title: "Failed to add expense", description: e.message, variant: "destructive" })
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => {
      toast({ title: "Expense record removed" });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-summary"] });
    }
  });

  const handleConfigSubmit = () => {
    updateConfigMutation.mutate(configForm);
  };

  const handleExpenseSubmit = () => {
    addExpenseMutation.mutate({
      ...expenseForm,
      amount: Number(expenseForm.amount)
    });
  };

  const openGlobalConfig = () => {
    const gc = globalConfigResponse?.data;
    if (gc) {
      setConfigForm({
        incentivePerSample: gc.incentivePerSample,
        cancellationDeduction: gc.cancellationDeduction,
        absentDeduction: gc.absentDeduction,
        lateArrivalDeduction: gc.lateArrivalDeduction,
        starBonus40: gc.starBonus40,
        starBonus80: gc.starBonus80,
        starBonus120: gc.starBonus120,
        referralBonus: gc.referralBonus
      });
    }
    setSelectedConfigEmployeeId("global");
    setConfigModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        action={
          <div className="flex gap-2">
            <Button
              className="h-9 rounded-xl bg-slate-800 px-4 text-xs font-bold text-white hover:bg-slate-700"
              onClick={openGlobalConfig}
            >
              <Settings className="mr-1.5 h-3.5 w-3.5" /> Global Rules
            </Button>
            <Button
              className="h-9 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700"
              onClick={() => setExpenseModalOpen(true)}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Expense
            </Button>
          </div>
        }
        description="Manage employee compensation, track incentives, and add manual bonuses or deductions."
        title="Payroll & Expenses"
      />

      <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
        <div className="flex gap-1 rounded-xl bg-slate-100/50 p-1">
          <button
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${activeTab === "summary" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            onClick={() => setActiveTab("summary")}
          >
            <FileText className="h-4 w-4" /> Monthly Summary
          </button>
          <button
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${activeTab === "expenses" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            onClick={() => setActiveTab("expenses")}
          >
            <Receipt className="h-4 w-4" /> Expense Records
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Label className="text-xs font-bold text-slate-500">Month</Label>
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-9 w-40 rounded-xl"
          />
        </div>
      </div>

      {activeTab === "summary" && (
        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold text-slate-700">Employee</TableHead>
                  <TableHead className="font-bold text-slate-700 text-right">Incentives</TableHead>
                  <TableHead className="font-bold text-slate-700 text-right">Bonuses</TableHead>
                  <TableHead className="font-bold text-rose-600 text-right">Deductions</TableHead>
                  <TableHead className="font-black text-slate-900 text-right">Net Pay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaryLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <div className="flex justify-center"><Skeleton className="h-4 w-32" /></div>
                    </TableCell>
                  </TableRow>
                ) : summaryData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-sm font-medium text-slate-500">
                      No payroll data for this month.
                    </TableCell>
                  </TableRow>
                ) : (
                  summaryData.map((row) => (
                    <TableRow key={row.employeeId}>
                      <TableCell>
                        <div className="font-bold text-slate-900">{row.employeeName}</div>
                        <div className="text-xs text-slate-500">{row.employeeZone}</div>
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium text-blue-600">
                        +{money(row.incentives)} <span className="text-xs text-slate-400">({row.completedSamples})</span>
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium text-emerald-600">
                        +{money(row.starBonus + row.referralBonus + row.manualBonuses + row.manualReimbursements)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium text-rose-600">
                        -{money(row.cancellationDeductions + row.absentDeductions + row.lateArrivalDeductions + row.manualDeductions)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-black text-slate-900">
                        {money(row.netPay)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === "expenses" && (
        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold text-slate-700">Date</TableHead>
                  <TableHead className="font-bold text-slate-700">Employee</TableHead>
                  <TableHead className="font-bold text-slate-700">Type</TableHead>
                  <TableHead className="font-bold text-slate-700">Description</TableHead>
                  <TableHead className="font-bold text-slate-700 text-right">Amount</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-sm font-medium text-slate-500">
                      No manual expense records found for this month.
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="text-sm font-medium text-slate-600">
                        {new Date(expense.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm font-bold text-slate-900">
                        {(expense as any).employee?.user?.name || expense.employeeId}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          expense.type === 'bonus' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          expense.type === 'deduction' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                          'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                          {expense.type.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {expense.description}
                      </TableCell>
                      <TableCell className={`text-right text-sm font-bold ${
                        expense.type === 'deduction' ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {expense.type === 'deduction' ? '-' : '+'}{money(expense.amount)}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-rose-600"
                          onClick={() => deleteExpenseMutation.mutate(expense.id)}
                          disabled={deleteExpenseMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pay Config Modal */}
      <Dialog open={configModalOpen}>
        <DialogContent className="sm:max-w-[600px] gap-0 p-0 overflow-hidden rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2 text-xl font-black text-slate-800">
                <Coins className="h-5 w-5 text-indigo-600" />
                Global Pay Configuration
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600">Incentive per Sample (₹)</Label>
                <Input type="number" value={configForm.incentivePerSample} onChange={(e) => setConfigForm({...configForm, incentivePerSample: Number(e.target.value)})} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600">Cancellation Deduction (₹)</Label>
                <Input type="number" value={configForm.cancellationDeduction} onChange={(e) => setConfigForm({...configForm, cancellationDeduction: Number(e.target.value)})} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600">Absent Deduction (₹)</Label>
                <Input type="number" value={configForm.absentDeduction} onChange={(e) => setConfigForm({...configForm, absentDeduction: Number(e.target.value)})} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600">Late Arrival Deduction (₹)</Label>
                <Input type="number" value={configForm.lateArrivalDeduction} onChange={(e) => setConfigForm({...configForm, lateArrivalDeduction: Number(e.target.value)})} />
              </div>
            </div>
            
            <h4 className="mt-6 mb-3 text-sm font-bold text-slate-800">Performance Bonuses</h4>
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600">≥40 Samples (₹)</Label>
                <Input type="number" value={configForm.starBonus40} onChange={(e) => setConfigForm({...configForm, starBonus40: Number(e.target.value)})} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600">≥80 Samples (₹)</Label>
                <Input type="number" value={configForm.starBonus80} onChange={(e) => setConfigForm({...configForm, starBonus80: Number(e.target.value)})} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600">≥120 Samples (₹)</Label>
                <Input type="number" value={configForm.starBonus120} onChange={(e) => setConfigForm({...configForm, starBonus120: Number(e.target.value)})} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600">Referral Bonus (≥100) (₹)</Label>
                <Input type="number" value={configForm.referralBonus} onChange={(e) => setConfigForm({...configForm, referralBonus: Number(e.target.value)})} />
              </div>
            </div>
          </div>
          <div className="border-t border-slate-100 p-4 flex justify-end gap-2 bg-slate-50">
            <Button variant="outline" onClick={() => setConfigModalOpen(false)}>Cancel</Button>
            <Button onClick={handleConfigSubmit} disabled={updateConfigMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">Save Rules</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expense Modal */}
      <Dialog open={expenseModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Manual Expense / Bonus</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Employee</Label>
              <select
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={expenseForm.employeeId}
                onChange={(e) => setExpenseForm({...expenseForm, employeeId: e.target.value})}
              >
                <option value="">Select an employee</option>
                {employees.map((emp) => (
                  <option key={emp.employee.id} value={emp.employee.id}>
                    {emp.user.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <Label>Type</Label>
              <select
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={expenseForm.type}
                onChange={(e) => setExpenseForm({...expenseForm, type: e.target.value as any})}
              >
                <option value="bonus">Bonus (+)</option>
                <option value="reimbursement">Reimbursement (+)</option>
                <option value="deduction">Deduction (-)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Amount (₹)</Label>
              <Input 
                type="number" 
                value={expenseForm.amount} 
                onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                placeholder="e.g. 500"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input 
                value={expenseForm.description} 
                onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                placeholder="e.g. Festival Bonus, Broken Equipment"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setExpenseModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleExpenseSubmit} 
              disabled={addExpenseMutation.isPending || !expenseForm.employeeId || !expenseForm.amount || !expenseForm.description}
            >
              Add Record
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
