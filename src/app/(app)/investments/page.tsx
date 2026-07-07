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
import { formatCurrency } from "@/lib/utils";
import { Pencil, Trash2, Plus } from "lucide-react";

interface Investment {
  id: string;
  type: "stock" | "mutual_fund";
  name: string;
  symbol: string | null;
  units: number;
  investedAmount: number;
  currentValue: number;
  platform: string | null;
  note: string | null;
}

export default function InvestmentsPage() {
  const [filter, setFilter] = useState<"all" | "stock" | "mutual_fund">("all");
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);
  const [form, setForm] = useState({
    type: "stock" as "stock" | "mutual_fund",
    name: "",
    symbol: "",
    units: "",
    investedAmount: "",
    currentValue: "",
    platform: "",
    note: "",
  });

  function load() {
    const url = filter === "all" ? "/api/investments" : `/api/investments?type=${filter}`;
    fetch(url).then((r) => r.json()).then(setInvestments);
  }

  useEffect(() => { load(); }, [filter]);

  function resetForm() {
    setForm({
      type: "stock",
      name: "",
      symbol: "",
      units: "",
      investedAmount: "",
      currentValue: "",
      platform: "",
      note: "",
    });
    setEditing(null);
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      type: form.type,
      name: form.name,
      symbol: form.symbol || undefined,
      units: parseFloat(form.units) || 0,
      investedAmount: parseFloat(form.investedAmount) || 0,
      currentValue: parseFloat(form.currentValue) || 0,
      platform: form.platform || undefined,
      note: form.note || undefined,
    };
    if (editing) {
      await fetch(`/api/investments/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    resetForm();
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this investment?")) return;
    await fetch(`/api/investments/${id}`, { method: "DELETE" });
    load();
  }

  function startEdit(inv: Investment) {
    setEditing(inv);
    setForm({
      type: inv.type,
      name: inv.name,
      symbol: inv.symbol || "",
      units: String(inv.units),
      investedAmount: String(inv.investedAmount),
      currentValue: String(inv.currentValue),
      platform: inv.platform || "",
      note: inv.note || "",
    });
    setShowForm(true);
  }

  const totalValue = investments.reduce((s, i) => s + i.currentValue, 0);
  const totalInvested = investments.reduce((s, i) => s + i.investedAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Investments</h1>
          <p className="text-muted-foreground">Stocks and mutual funds</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Investment
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm">Current Value</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatCurrency(totalValue)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Invested</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatCurrency(totalInvested)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Gain / Loss</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totalValue - totalInvested >= 0 ? "text-green-600" : "text-destructive"}`}>
              {formatCurrency(totalValue - totalInvested)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="stock">Stocks</TabsTrigger>
          <TabsTrigger value="mutual_fund">Mutual Funds</TabsTrigger>
        </TabsList>
      </Tabs>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Edit Investment" : "New Investment"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "stock" | "mutual_fund" })}>
                  <option value="stock">Stock</option>
                  <option value="mutual_fund">Mutual Fund</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{form.type === "stock" ? "Ticker Symbol" : "Folio Number"}</Label>
                <Input value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Platform / Broker / AMC</Label>
                <Input value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Units</Label>
                <Input type="number" step="0.0001" value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Invested Amount (₹)</Label>
                <Input type="number" step="0.01" value={form.investedAmount} onChange={(e) => setForm({ ...form, investedAmount: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Current Value (₹)</Label>
                <Input type="number" step="0.01" required value={form.currentValue} onChange={(e) => setForm({ ...form, currentValue: e.target.value })} />
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
          {investments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No investments yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Symbol/Folio</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead className="text-right">Invested</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {investments.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="capitalize">{inv.type.replace("_", " ")}</TableCell>
                    <TableCell className="font-medium">{inv.name}</TableCell>
                    <TableCell>{inv.symbol || "—"}</TableCell>
                    <TableCell>{inv.units}</TableCell>
                    <TableCell className="text-right">{formatCurrency(inv.investedAmount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(inv.currentValue)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(inv)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(inv.id)}>
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
