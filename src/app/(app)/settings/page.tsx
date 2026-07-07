"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import {
  NETWORTH_CATEGORY_LABELS,
  type NetWorthCategoryKey,
} from "@/lib/networth-settings";

interface ConfigItem {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  isActive: boolean;
}

function ConfigTable({
  items,
  onDelete,
  extraColumn,
}: {
  items: ConfigItem[];
  onDelete: (id: string) => void;
  extraColumn?: { header: string; render: (item: ConfigItem) => React.ReactNode };
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          {extraColumn && <TableHead>{extraColumn.header}</TableHead>}
          <TableHead>Active</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.name}</TableCell>
            {extraColumn && <TableCell>{extraColumn.render(item)}</TableCell>}
            <TableCell>{item.isActive ? "Yes" : "No"}</TableCell>
            <TableCell>
              <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState("account-types");
  const [accountTypes, setAccountTypes] = useState<ConfigItem[]>([]);
  const [categories, setCategories] = useState<ConfigItem[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<ConfigItem[]>([]);
  const [assetTypes, setAssetTypes] = useState<ConfigItem[]>([]);
  const [newAccountType, setNewAccountType] = useState({ name: "", icon: "wallet" });
  const [newCategory, setNewCategory] = useState({ name: "", color: "#6366f1" });
  const [newIncomeCategory, setNewIncomeCategory] = useState({ name: "", color: "#22c55e" });
  const [newAssetType, setNewAssetType] = useState({ name: "" });
  const [networthExclusions, setNetworthExclusions] = useState<NetWorthCategoryKey[]>([]);
  const [savingNetworth, setSavingNetworth] = useState(false);
  const [resetting, setResetting] = useState<null | "transactions_accounts" | "factory">(null);

  function loadAll() {
    fetch("/api/settings/account-types").then((r) => r.json()).then(setAccountTypes);
    fetch("/api/settings/expense-categories").then((r) => r.json()).then(setCategories);
    fetch("/api/settings/income-categories").then((r) => r.json()).then(setIncomeCategories);
    fetch("/api/settings/asset-types").then((r) => r.json()).then(setAssetTypes);
    fetch("/api/settings/networth")
      .then((r) => r.json())
      .then((data) => setNetworthExclusions(data.exclusions ?? []));
  }

  useEffect(() => { loadAll(); }, []);

  async function addAccountType(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/settings/account-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAccountType),
    });
    setNewAccountType({ name: "", icon: "wallet" });
    loadAll();
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/settings/expense-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCategory),
    });
    setNewCategory({ name: "", color: "#6366f1" });
    loadAll();
  }

  async function addIncomeCategory(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/settings/income-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newIncomeCategory),
    });
    setNewIncomeCategory({ name: "", color: "#22c55e" });
    loadAll();
  }

  async function addAssetType(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/settings/asset-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAssetType),
    });
    setNewAssetType({ name: "" });
    loadAll();
  }

  async function deleteItem(endpoint: string, id: string) {
    if (!confirm("Delete this item?")) return;
    await fetch(`${endpoint}?id=${id}`, { method: "DELETE" });
    loadAll();
  }

  function toggleNetworthExclusion(key: NetWorthCategoryKey) {
    setNetworthExclusions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  async function saveNetworthExclusions() {
    setSavingNetworth(true);
    try {
      await fetch("/api/settings/networth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exclusions: networthExclusions }),
      });
    } finally {
      setSavingNetworth(false);
    }
  }

  async function runReset(scope: "transactions_accounts" | "factory") {
    const message =
      scope === "transactions_accounts"
        ? "Delete ALL transactions and accounts? This cannot be undone."
        : "Factory reset will delete ALL data (transactions, accounts, assets, investments, loans, cards, insurance, retirement) and restore default settings. This cannot be undone. Continue?";
    if (!confirm(message)) return;
    if (scope === "factory" && !confirm("Are you absolutely sure? This wipes everything.")) return;

    setResetting(scope);
    try {
      await fetch("/api/settings/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope }),
      });
      loadAll();
      alert(scope === "factory" ? "Factory reset complete." : "Transactions and accounts cleared.");
    } finally {
      setResetting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure categories, types, and net worth calculation</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="account-types">Account Types</TabsTrigger>
          <TabsTrigger value="categories">Expense Categories</TabsTrigger>
          <TabsTrigger value="income-categories">Income Categories</TabsTrigger>
          <TabsTrigger value="asset-types">Asset Types</TabsTrigger>
          <TabsTrigger value="networth">Net Worth</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="account-types">
          <Card>
            <CardHeader>
              <CardTitle>Account Types</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={addAccountType} className="flex flex-wrap gap-2">
                <Input
                  placeholder="Name"
                  required
                  value={newAccountType.name}
                  onChange={(e) => setNewAccountType({ ...newAccountType, name: e.target.value })}
                  className="max-w-xs"
                />
                <Input
                  placeholder="Icon name"
                  value={newAccountType.icon}
                  onChange={(e) => setNewAccountType({ ...newAccountType, icon: e.target.value })}
                  className="max-w-xs"
                />
                <Button type="submit">Add</Button>
              </form>
              <ConfigTable
                items={accountTypes}
                onDelete={(id) => deleteItem("/api/settings/account-types", id)}
                extraColumn={{
                  header: "Icon",
                  render: (item) => item.icon || "—",
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Expense Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={addCategory} className="flex flex-wrap gap-2">
                <Input
                  placeholder="Name"
                  required
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="max-w-xs"
                />
                <div className="flex items-center gap-2">
                  <Label>Color</Label>
                  <Input
                    type="color"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    className="h-10 w-14"
                  />
                </div>
                <Button type="submit">Add</Button>
              </form>
              <ConfigTable
                items={categories}
                onDelete={(id) => deleteItem("/api/settings/expense-categories", id)}
                extraColumn={{
                  header: "Color",
                  render: (item) => (
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-4 w-4 rounded"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.color}
                    </span>
                  ),
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income-categories">
          <Card>
            <CardHeader>
              <CardTitle>Income Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={addIncomeCategory} className="flex flex-wrap gap-2">
                <Input
                  placeholder="Name"
                  required
                  value={newIncomeCategory.name}
                  onChange={(e) => setNewIncomeCategory({ ...newIncomeCategory, name: e.target.value })}
                  className="max-w-xs"
                />
                <div className="flex items-center gap-2">
                  <Label>Color</Label>
                  <Input
                    type="color"
                    value={newIncomeCategory.color}
                    onChange={(e) => setNewIncomeCategory({ ...newIncomeCategory, color: e.target.value })}
                    className="h-10 w-14"
                  />
                </div>
                <Button type="submit">Add</Button>
              </form>
              <ConfigTable
                items={incomeCategories}
                onDelete={(id) => deleteItem("/api/settings/income-categories", id)}
                extraColumn={{
                  header: "Color",
                  render: (item) => (
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-4 w-4 rounded"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.color}
                    </span>
                  ),
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="asset-types">
          <Card>
            <CardHeader>
              <CardTitle>Asset Types</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={addAssetType} className="flex flex-wrap gap-2">
                <Input
                  placeholder="Name"
                  required
                  value={newAssetType.name}
                  onChange={(e) => setNewAssetType({ name: e.target.value })}
                  className="max-w-xs"
                />
                <Button type="submit">Add</Button>
              </form>
              <ConfigTable
                items={assetTypes}
                onDelete={(id) => deleteItem("/api/settings/asset-types", id)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="networth">
          <Card>
            <CardHeader>
              <CardTitle>Net Worth Exclusions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Toggle categories to exclude from net worth calculation. Excluded items still appear
                in the breakdown but are marked and not counted toward your total.
              </p>
              <div className="space-y-3">
                <p className="text-sm font-medium">Assets</p>
                {(["accounts", "assets", "investments", "nps", "epf"] as NetWorthCategoryKey[]).map(
                  (key) => (
                    <label
                      key={key}
                      className="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-border px-4 py-3"
                    >
                      <span className="font-medium">{NETWORTH_CATEGORY_LABELS[key]}</span>
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Exclude</span>
                        <input
                          type="checkbox"
                          checked={networthExclusions.includes(key)}
                          onChange={() => toggleNetworthExclusion(key)}
                        />
                      </span>
                    </label>
                  )
                )}
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium">Liabilities</p>
                {(["loans", "creditCards", "overdraft"] as NetWorthCategoryKey[]).map((key) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-border px-4 py-3"
                  >
                    <span className="font-medium">{NETWORTH_CATEGORY_LABELS[key]}</span>
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Exclude</span>
                      <input
                        type="checkbox"
                        checked={networthExclusions.includes(key)}
                        onChange={() => toggleNetworthExclusion(key)}
                      />
                    </span>
                  </label>
                ))}
              </div>
              <Button onClick={saveNetworthExclusions} disabled={savingNetworth}>
                {savingNetworth ? "Saving..." : "Save Net Worth Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-3 rounded-md border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">Clear transactions & accounts</p>
                  <p className="text-sm text-muted-foreground">
                    Deletes every transaction and account. Categories, assets, and other data are kept.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  disabled={resetting !== null}
                  onClick={() => runReset("transactions_accounts")}
                >
                  {resetting === "transactions_accounts" ? "Clearing..." : "Clear"}
                </Button>
              </div>

              <div className="flex flex-col gap-3 rounded-md border border-destructive/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">Factory reset</p>
                  <p className="text-sm text-muted-foreground">
                    Deletes ALL data and restores default categories, account types, and asset types.
                    Your login (authenticator) is preserved.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  disabled={resetting !== null}
                  onClick={() => runReset("factory")}
                >
                  {resetting === "factory" ? "Resetting..." : "Factory Reset"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
