"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import { Pencil, Trash2, Plus } from "lucide-react";

interface NpsAccount {
  id: string;
  pran: string;
  tier: string;
  balance: number;
  note: string | null;
}

export default function NpsPage() {
  const [accounts, setAccounts] = useState<NpsAccount[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<NpsAccount | null>(null);
  const [form, setForm] = useState({ pran: "", tier: "Tier I", balance: "", note: "" });

  function load() {
    fetch("/api/nps").then((r) => r.json()).then(setAccounts);
  }

  useEffect(() => { load(); }, []);

  function resetForm() {
    setForm({ pran: "", tier: "Tier I", balance: "", note: "" });
    setEditing(null);
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      pran: form.pran,
      tier: form.tier,
      balance: parseFloat(form.balance) || 0,
      note: form.note || undefined,
    };
    if (editing) {
      await fetch(`/api/nps/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/nps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    resetForm();
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this NPS account?")) return;
    await fetch(`/api/nps/${id}`, { method: "DELETE" });
    load();
  }

  function startEdit(account: NpsAccount) {
    setEditing(account);
    setForm({
      pran: account.pran,
      tier: account.tier,
      balance: String(account.balance),
      note: account.note || "",
    });
    setShowForm(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">NPS Accounts</h1>
          <p className="text-muted-foreground">National Pension System holdings</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add NPS
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Edit NPS Account" : "New NPS Account"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>PRAN</Label>
                <Input required value={form.pran} onChange={(e) => setForm({ ...form, pran: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Tier</Label>
                <Select value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })}>
                  <option value="Tier I">Tier I</option>
                  <option value="Tier II">Tier II</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Balance (₹)</Label>
                <Input type="number" step="0.01" required value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} />
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
          <p className="text-sm text-muted-foreground">No NPS accounts yet.</p>
        ) : (
          accounts.map((a) => (
            <Card key={a.id}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-base">PRAN: {a.pran}</CardTitle>
                  <p className="text-sm text-muted-foreground">{a.tier}</p>
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
                <p className="text-2xl font-bold">{formatCurrency(a.balance)}</p>
                {a.note && <p className="mt-2 text-sm text-muted-foreground">{a.note}</p>}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
