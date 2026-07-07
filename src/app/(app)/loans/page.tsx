"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  LOAN_TYPES,
  LOAN_TYPE_LABELS,
  LOAN_TYPE_TAB_LABELS,
  formatLoanType,
  type LoanType,
} from "@/lib/finance-types";
import { Pencil, Trash2, Plus } from "lucide-react";

interface Loan {
  id: string;
  type: string;
  lender: string;
  principal: number;
  outstandingBalance: number;
  interestRate: number;
  emi: number;
  startDate: string;
  endDate: string | null;
  note: string | null;
}

export default function LoansPage() {
  const [filter, setFilter] = useState<"all" | LoanType>("all");
  const [loans, setLoans] = useState<Loan[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Loan | null>(null);
  const [form, setForm] = useState({
    type: "home" as LoanType,
    lender: "",
    principal: "",
    outstandingBalance: "",
    interestRate: "",
    emi: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    note: "",
  });

  function load() {
    const url = filter === "all" ? "/api/loans" : `/api/loans?type=${filter}`;
    fetch(url).then((r) => r.json()).then(setLoans);
  }

  useEffect(() => { load(); }, [filter]);

  function resetForm() {
    setForm({
      type: "home",
      lender: "",
      principal: "",
      outstandingBalance: "",
      interestRate: "",
      emi: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      note: "",
    });
    setEditing(null);
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      type: form.type,
      lender: form.lender,
      principal: parseFloat(form.principal),
      outstandingBalance: parseFloat(form.outstandingBalance),
      interestRate: parseFloat(form.interestRate) || 0,
      emi: parseFloat(form.emi) || 0,
      startDate: form.startDate,
      endDate: form.endDate || null,
      note: form.note || undefined,
    };
    if (editing) {
      await fetch(`/api/loans/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    resetForm();
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this loan?")) return;
    await fetch(`/api/loans/${id}`, { method: "DELETE" });
    load();
  }

  function startEdit(loan: Loan) {
    setEditing(loan);
    setForm({
      type: loan.type as LoanType,
      lender: loan.lender,
      principal: String(loan.principal),
      outstandingBalance: String(loan.outstandingBalance),
      interestRate: String(loan.interestRate),
      emi: String(loan.emi),
      startDate: loan.startDate.split("T")[0],
      endDate: loan.endDate ? loan.endDate.split("T")[0] : "",
      note: loan.note || "",
    });
    setShowForm(true);
  }

  const totalOutstanding = loans.reduce((s, l) => s + l.outstandingBalance, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Loans</h1>
          <p className="text-muted-foreground">Home loans and other liabilities</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Loan
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Total Outstanding</CardTitle></CardHeader>
        <CardContent><p className="text-2xl font-bold text-destructive">{formatCurrency(totalOutstanding)}</p></CardContent>
      </Card>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {LOAN_TYPES.map((type) => (
            <TabsTrigger key={type} value={type}>
              {LOAN_TYPE_TAB_LABELS[type]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Edit Loan" : "New Loan"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as LoanType })}
                >
                  {LOAN_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {LOAN_TYPE_LABELS[type]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Lender</Label>
                <Input required value={form.lender} onChange={(e) => setForm({ ...form, lender: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Principal (₹)</Label>
                <Input type="number" step="0.01" required value={form.principal} onChange={(e) => setForm({ ...form, principal: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Outstanding Balance (₹)</Label>
                <Input type="number" step="0.01" required value={form.outstandingBalance} onChange={(e) => setForm({ ...form, outstandingBalance: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Interest Rate (%)</Label>
                <Input type="number" step="0.01" value={form.interestRate} onChange={(e) => setForm({ ...form, interestRate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>EMI (₹)</Label>
                <Input type="number" step="0.01" value={form.emi} onChange={(e) => setForm({ ...form, emi: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Note</Label>
                <Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              </div>
              <div className="flex gap-2 md:col-span-2">
                <Button type="submit">{editing ? "Update" : "Create"}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {loans.length === 0 ? (
            <p className="text-sm text-muted-foreground">No loans yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Lender</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead className="text-right">EMI</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell>{formatLoanType(loan.type)}</TableCell>
                    <TableCell className="font-medium">{loan.lender}</TableCell>
                    <TableCell className="text-right">{formatCurrency(loan.outstandingBalance)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(loan.emi)}</TableCell>
                    <TableCell>{loan.interestRate}%</TableCell>
                    <TableCell>
                      {formatDate(loan.startDate)}
                      {loan.endDate ? ` – ${formatDate(loan.endDate)}` : ""}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(loan)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(loan.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
