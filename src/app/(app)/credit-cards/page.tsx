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

interface CreditCard {
  id: string;
  name: string;
  bank: string;
  lastFourDigits: string | null;
  creditLimit: number;
  outstandingBalance: number;
  statementDay: number | null;
  dueDay: number | null;
  note: string | null;
}

export default function CreditCardsPage() {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CreditCard | null>(null);
  const [form, setForm] = useState({
    name: "",
    bank: "",
    lastFourDigits: "",
    creditLimit: "",
    outstandingBalance: "",
    statementDay: "",
    dueDay: "",
    note: "",
  });

  function load() {
    fetch("/api/credit-cards").then((r) => r.json()).then(setCards);
  }

  useEffect(() => { load(); }, []);

  function resetForm() {
    setForm({
      name: "",
      bank: "",
      lastFourDigits: "",
      creditLimit: "",
      outstandingBalance: "",
      statementDay: "",
      dueDay: "",
      note: "",
    });
    setEditing(null);
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      bank: form.bank,
      lastFourDigits: form.lastFourDigits || undefined,
      creditLimit: parseFloat(form.creditLimit) || 0,
      outstandingBalance: parseFloat(form.outstandingBalance) || 0,
      statementDay: form.statementDay ? parseInt(form.statementDay) : undefined,
      dueDay: form.dueDay ? parseInt(form.dueDay) : undefined,
      note: form.note || undefined,
    };
    if (editing) {
      await fetch(`/api/credit-cards/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/credit-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    resetForm();
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this credit card?")) return;
    await fetch(`/api/credit-cards/${id}`, { method: "DELETE" });
    load();
  }

  function startEdit(card: CreditCard) {
    setEditing(card);
    setForm({
      name: card.name,
      bank: card.bank,
      lastFourDigits: card.lastFourDigits || "",
      creditLimit: String(card.creditLimit),
      outstandingBalance: String(card.outstandingBalance),
      statementDay: card.statementDay ? String(card.statementDay) : "",
      dueDay: card.dueDay ? String(card.dueDay) : "",
      note: card.note || "",
    });
    setShowForm(true);
  }

  const totalOutstanding = cards.reduce((s, c) => s + c.outstandingBalance, 0);
  const totalLimit = cards.reduce((s, c) => s + c.creditLimit, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Credit Cards</h1>
          <p className="text-muted-foreground">Track limits, balances, and due dates</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Card
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Total Outstanding</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-destructive">{formatCurrency(totalOutstanding)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Total Credit Limit</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatCurrency(totalLimit)}</p></CardContent>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Edit Credit Card" : "New Credit Card"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Card Name</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. HDFC Regalia" />
              </div>
              <div className="space-y-2">
                <Label>Bank</Label>
                <Input required value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Last 4 Digits</Label>
                <Input maxLength={4} value={form.lastFourDigits} onChange={(e) => setForm({ ...form, lastFourDigits: e.target.value.replace(/\D/g, "") })} />
              </div>
              <div className="space-y-2">
                <Label>Credit Limit (₹)</Label>
                <Input type="number" step="0.01" value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Outstanding Balance (₹)</Label>
                <Input type="number" step="0.01" required value={form.outstandingBalance} onChange={(e) => setForm({ ...form, outstandingBalance: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Statement Day (1-31)</Label>
                <Input type="number" min={1} max={31} value={form.statementDay} onChange={(e) => setForm({ ...form, statementDay: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Due Day (1-31)</Label>
                <Input type="number" min={1} max={31} value={form.dueDay} onChange={(e) => setForm({ ...form, dueDay: e.target.value })} />
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
          {cards.length === 0 ? (
            <p className="text-sm text-muted-foreground">No credit cards yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Card</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Last 4</TableHead>
                  <TableHead className="text-right">Limit</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Due Day</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {cards.map((card) => (
                  <TableRow key={card.id}>
                    <TableCell className="font-medium">{card.name}</TableCell>
                    <TableCell>{card.bank}</TableCell>
                    <TableCell>{card.lastFourDigits ? `****${card.lastFourDigits}` : "—"}</TableCell>
                    <TableCell className="text-right">{formatCurrency(card.creditLimit)}</TableCell>
                    <TableCell className="text-right text-destructive">{formatCurrency(card.outstandingBalance)}</TableCell>
                    <TableCell>{card.dueDay ? `${card.dueDay}th` : "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(card)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(card.id)}>
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
