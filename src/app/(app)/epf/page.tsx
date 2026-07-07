"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import { Pencil, Trash2, Plus } from "lucide-react";

interface EpfAccount {
  id: string;
  uan: string;
  employeeBalance: number;
  employerBalance: number;
  note: string | null;
}

export default function EpfPage() {
  const [accounts, setAccounts] = useState<EpfAccount[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EpfAccount | null>(null);
  const [form, setForm] = useState({
    uan: "",
    employeeBalance: "",
    employerBalance: "",
    note: "",
  });

  function load() {
    fetch("/api/epf").then((r) => r.json()).then(setAccounts);
  }

  useEffect(() => { load(); }, []);

  function resetForm() {
    setForm({ uan: "", employeeBalance: "", employerBalance: "", note: "" });
    setEditing(null);
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      uan: form.uan,
      employeeBalance: parseFloat(form.employeeBalance) || 0,
      employerBalance: parseFloat(form.employerBalance) || 0,
      note: form.note || undefined,
    };
    if (editing) {
      await fetch(`/api/epf/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/epf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    resetForm();
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this EPF account?")) return;
    await fetch(`/api/epf/${id}`, { method: "DELETE" });
    load();
  }

  function startEdit(account: EpfAccount) {
    setEditing(account);
    setForm({
      uan: account.uan,
      employeeBalance: String(account.employeeBalance),
      employerBalance: String(account.employerBalance),
      note: account.note || "",
    });
    setShowForm(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">EPF Accounts</h1>
          <p className="text-muted-foreground">Employee Provident Fund holdings</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add EPF
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Edit EPF Account" : "New EPF Account"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>UAN</Label>
                <Input required value={form.uan} onChange={(e) => setForm({ ...form, uan: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Employee Balance (₹)</Label>
                <Input type="number" step="0.01" required value={form.employeeBalance} onChange={(e) => setForm({ ...form, employeeBalance: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Employer Balance (₹)</Label>
                <Input type="number" step="0.01" required value={form.employerBalance} onChange={(e) => setForm({ ...form, employerBalance: e.target.value })} />
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No EPF accounts yet.</p>
        ) : (
          accounts.map((a) => (
            <Card key={a.id}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-base">UAN: {a.uan}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(a)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <p>Employee: {formatCurrency(a.employeeBalance)}</p>
                  <p>Employer: {formatCurrency(a.employerBalance)}</p>
                </div>
                <p className="mt-3 text-2xl font-bold">
                  {formatCurrency(a.employeeBalance + a.employerBalance)}
                </p>
                {a.note && <p className="mt-2 text-sm text-muted-foreground">{a.note}</p>}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
