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

interface AssetType {
  id: string;
  name: string;
}

interface Asset {
  id: string;
  name: string;
  currentValue: number;
  valuedAt: string;
  location: string | null;
  note: string | null;
  type: AssetType;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [types, setTypes] = useState<AssetType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [form, setForm] = useState({
    name: "",
    typeId: "",
    currentValue: "",
    valuedAt: new Date().toISOString().split("T")[0],
    location: "",
    note: "",
  });

  function load() {
    fetch("/api/assets").then((r) => r.json()).then(setAssets);
    fetch("/api/settings/asset-types").then((r) => r.json()).then(setTypes);
  }

  useEffect(() => { load(); }, []);

  function resetForm() {
    setForm({
      name: "",
      typeId: "",
      currentValue: "",
      valuedAt: new Date().toISOString().split("T")[0],
      location: "",
      note: "",
    });
    setEditing(null);
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      typeId: form.typeId,
      currentValue: parseFloat(form.currentValue),
      valuedAt: form.valuedAt,
      location: form.location || undefined,
      note: form.note || undefined,
    };
    if (editing) {
      await fetch(`/api/assets/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    resetForm();
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this asset?")) return;
    await fetch(`/api/assets/${id}`, { method: "DELETE" });
    load();
  }

  function startEdit(asset: Asset) {
    setEditing(asset);
    setForm({
      name: asset.name,
      typeId: asset.type.id,
      currentValue: String(asset.currentValue),
      valuedAt: asset.valuedAt.split("T")[0],
      location: asset.location || "",
      note: asset.note || "",
    });
    setShowForm(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Assets</h1>
          <p className="text-muted-foreground">Plots, properties, gold, and other assets</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Asset
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Edit Asset" : "New Asset"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select required value={form.typeId} onChange={(e) => setForm({ ...form, typeId: e.target.value })}>
                  <option value="">Select type</option>
                  {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Current Value (₹)</Label>
                <Input type="number" step="0.01" required value={form.currentValue} onChange={(e) => setForm({ ...form, currentValue: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Valued At</Label>
                <Input type="date" required value={form.valuedAt} onChange={(e) => setForm({ ...form, valuedAt: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="space-y-2">
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
          {assets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No assets yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Valued At</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>{a.type.name}</TableCell>
                    <TableCell>{a.location || "—"}</TableCell>
                    <TableCell>{formatDate(a.valuedAt)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(a.currentValue)}</TableCell>
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
