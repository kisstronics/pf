"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Pencil, Trash2, Plus } from "lucide-react";

interface OverdraftAccount {
  id: string;
  name: string;
  bank: string;
  limit: number;
  utilizedAmount: number;
  interestRate: number;
  note: string | null;
}

export default function OverdraftPage() {
  const [accounts, setAccounts] = useState<OverdraftAccount[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<OverdraftAccount | null>(null);
  const [form, setForm] = useState({
    name: "",
    bank: "",
    limit: "",
    utilizedAmount: "",
    interestRate: "",
    note: "",
  });

  function load() {
    fetch("/api/overdraft").then((r) => r.json()).then(setAccounts);
  }

  useEffect(() => { load(); }, []);

  function resetForm() {
    setForm({ name: "", bank: "", limit: "", utilizedAmount: "", interestRate: "", note: "" });
    setEditing(null);
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      bank: form.bank,
      limit: parseFloat(form.limit) || 0,
      utilizedAmount: parseFloat(form.utilizedAmount) || 0,
      interestRate: parseFloat(form.interestRate) || 0,
      note: form.note || undefined,
    };
    if (editing) {
      await fetch(`/api/overdraft/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/overdraft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    resetForm();
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this overdraft account?")) return;
    await fetch(`/api/overdraft/${id}`, { method: "DELETE" });
    load();
  }

  function startEdit(account: OverdraftAccount) {
    setEditing(account);
    setForm({
      name: account.name,
      bank: account.bank,
      limit: String(account.limit),
      utilizedAmount: String(account.utilizedAmount),
      interestRate: String(account.interestRate),
      note: account.note || "",
    });
    setShowForm(true);
  }

  const totalUtilized = accounts.reduce((s, a) => s + a.utilizedAmount, 0);
  const totalLimit = accounts.reduce((s, a) => s + a.limit, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Overdraft Accounts</h1>
          <p className="text-muted-foreground">Track overdraft limits and utilization</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Overdraft
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Total Utilized</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-destructive">{formatCurrency(totalUtilized)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Total Limit</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatCurrency(totalLimit)}</p></CardContent>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Edit Overdraft" : "New Overdraft Account"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Account Name</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Bank</Label>
                <Input required value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Overdraft Limit (₹)</Label>
                <Input type="number" step="0.01" required value={form.limit} onChange={(e) => setForm({ ...form, limit: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Utilized Amount (₹)</Label>
                <Input type="number" step="0.01" required value={form.utilizedAmount} onChange={(e) => setForm({ ...form, utilizedAmount: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Interest Rate (%)</Label>
                <Input type="number" step="0.01" value={form.interestRate} onChange={(e) => setForm({ ...form, interestRate: e.target.value })} />
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
          {accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No overdraft accounts yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead className="text-right">Limit</TableHead>
                  <TableHead className="text-right">Utilized</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>{a.bank}</TableCell>
                    <TableCell className="text-right">{formatCurrency(a.limit)}</TableCell>
                    <TableCell className="text-right text-destructive">{formatCurrency(a.utilizedAmount)}</TableCell>
                    <TableCell>{formatCurrency(a.limit - a.utilizedAmount)}</TableCell>
                    <TableCell>{a.interestRate}%</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(a)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)}>
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
