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

interface TermPolicy {
  id: string;
  provider: string;
  policyNumber: string;
  premium: number;
  frequency: string;
  sumAssured: number;
  startDate: string;
  endDate: string | null;
  note: string | null;
}

export default function TermPoliciesPage() {
  const [policies, setPolicies] = useState<TermPolicy[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TermPolicy | null>(null);
  const [form, setForm] = useState({
    provider: "",
    policyNumber: "",
    premium: "",
    frequency: "yearly",
    sumAssured: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    note: "",
  });

  function load() {
    fetch("/api/term-policies").then((r) => r.json()).then(setPolicies);
  }

  useEffect(() => { load(); }, []);

  function resetForm() {
    setForm({
      provider: "",
      policyNumber: "",
      premium: "",
      frequency: "yearly",
      sumAssured: "",
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
      premium: parseFloat(form.premium),
      frequency: form.frequency,
      sumAssured: parseFloat(form.sumAssured),
      startDate: form.startDate,
      endDate: form.endDate || null,
      note: form.note || undefined,
    };
    if (editing) {
      await fetch(`/api/term-policies/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/term-policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    resetForm();
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this term policy?")) return;
    await fetch(`/api/term-policies/${id}`, { method: "DELETE" });
    load();
  }

  function startEdit(policy: TermPolicy) {
    setEditing(policy);
    setForm({
      provider: policy.provider,
      policyNumber: policy.policyNumber,
      premium: String(policy.premium),
      frequency: policy.frequency,
      sumAssured: String(policy.sumAssured),
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
          <h1 className="text-2xl font-bold">Term Policies</h1>
          <p className="text-muted-foreground">Term life insurance policies</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Policy
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Edit Term Policy" : "New Term Policy"}</CardTitle>
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
                <Label>Sum Assured (₹)</Label>
                <Input type="number" step="0.01" required value={form.sumAssured} onChange={(e) => setForm({ ...form, sumAssured: e.target.value })} />
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
            <p className="text-sm text-muted-foreground">No term policies yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Policy #</TableHead>
                  <TableHead>Premium</TableHead>
                  <TableHead>Sum Assured</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.provider}</TableCell>
                    <TableCell>{p.policyNumber}</TableCell>
                    <TableCell>{formatCurrency(p.premium)}/{p.frequency}</TableCell>
                    <TableCell>{formatCurrency(p.sumAssured)}</TableCell>
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
