"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Pencil, Trash2, Plus } from "lucide-react";

interface InsurancePolicy {
  id: string;
  provider: string;
  policyNumber: string;
  type: string;
  premium: number;
  frequency: string;
  coverage: number;
  startDate: string;
  endDate: string | null;
  note: string | null;
}

export default function InsurancePage() {
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<InsurancePolicy | null>(null);
  const [form, setForm] = useState({
    provider: "",
    policyNumber: "",
    type: "Health",
    premium: "",
    frequency: "yearly",
    coverage: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    note: "",
  });

  function load() {
    fetch("/api/insurance").then((r) => r.json()).then(setPolicies);
  }

  useEffect(() => { load(); }, []);

  function resetForm() {
    setForm({
      provider: "",
      policyNumber: "",
      type: "Health",
      premium: "",
      frequency: "yearly",
      coverage: "",
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
      provider: form.provider,
      policyNumber: form.policyNumber,
      type: form.type,
      premium: parseFloat(form.premium),
      frequency: form.frequency,
      coverage: parseFloat(form.coverage),
      startDate: form.startDate,
      endDate: form.endDate || null,
      note: form.note || undefined,
    };
    if (editing) {
      await fetch(`/api/insurance/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/insurance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    resetForm();
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this policy?")) return;
    await fetch(`/api/insurance/${id}`, { method: "DELETE" });
    load();
  }

  function startEdit(policy: InsurancePolicy) {
    setEditing(policy);
    setForm({
      provider: policy.provider,
      policyNumber: policy.policyNumber,
      type: policy.type,
      premium: String(policy.premium),
      frequency: policy.frequency,
      coverage: String(policy.coverage),
      startDate: policy.startDate.split("T")[0],
      endDate: policy.endDate ? policy.endDate.split("T")[0] : "",
      note: policy.note || "",
    });
    setShowForm(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Insurance Policies</h1>
          <p className="text-muted-foreground">Health, life, and other insurance policies</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Policy
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Edit Policy" : "New Policy"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Input required value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Policy Number</Label>
                <Input required value={form.policyNumber} onChange={(e) => setForm({ ...form, policyNumber: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="Health">Health</option>
                  <option value="Life">Life</option>
                  <option value="Motor">Motor</option>
                  <option value="Home">Home</option>
                  <option value="Other">Other</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Premium (₹)</Label>
                <Input type="number" step="0.01" required value={form.premium} onChange={(e) => setForm({ ...form, premium: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Coverage (₹)</Label>
                <Input type="number" step="0.01" required value={form.coverage} onChange={(e) => setForm({ ...form, coverage: e.target.value })} />
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
          {policies.length === 0 ? (
            <p className="text-sm text-muted-foreground">No insurance policies yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Policy #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Premium</TableHead>
                  <TableHead>Coverage</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.provider}</TableCell>
                    <TableCell>{p.policyNumber}</TableCell>
                    <TableCell>{p.type}</TableCell>
                    <TableCell>{formatCurrency(p.premium)}/{p.frequency}</TableCell>
                    <TableCell>{formatCurrency(p.coverage)}</TableCell>
                    <TableCell>
                      {formatDate(p.startDate)}
                      {p.endDate ? ` – ${formatDate(p.endDate)}` : ""}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}>
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
