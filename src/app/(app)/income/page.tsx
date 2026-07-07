"use client";

import { useEffect, useState } from "react";
import { PeriodFilter } from "@/components/period-filter";
import { Period } from "@/lib/period";
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
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Trash2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Account {
  id: string;
  name: string;
}

interface Income {
  id: string;
  amount: number;
  date: string;
  note: string | null;
  category: Category;
  account: Account;
}

interface Summary {
  total: number;
  count: number;
  categories: { categoryId: string; name: string; color: string; total: number }[];
}

export default function IncomePage() {
  const today = new Date().toISOString().split("T")[0];
  const [period, setPeriod] = useState<Period>("month");
  const [date, setDate] = useState(today);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [form, setForm] = useState({
    amount: "",
    date: today,
    categoryId: "",
    accountId: "",
    note: "",
  });

  function loadData() {
    const params = `period=${period}&date=${date}`;
    fetch(`/api/income?${params}`).then((r) => r.json()).then(setIncomes);
    fetch(`/api/income/summary?${params}`).then((r) => r.json()).then(setSummary);
  }

  useEffect(() => {
    fetch("/api/settings/income-categories").then((r) => r.json()).then(setCategories);
    fetch("/api/accounts").then((r) => r.json()).then(setAccounts);
  }, []);

  useEffect(() => {
    loadData();
  }, [period, date]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/income", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parseFloat(form.amount),
        date: form.date,
        categoryId: form.categoryId,
        accountId: form.accountId,
        note: form.note || undefined,
      }),
    });
    if (res.ok) {
      setForm({ amount: "", date: today, categoryId: "", accountId: "", note: "" });
      loadData();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this income entry?")) return;
    await fetch(`/api/income/${id}`, { method: "DELETE" });
    loadData();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Income</h1>
        <p className="text-muted-foreground">Track salary, freelance, and other income</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Add Income</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  required
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Deposit to Account</Label>
                <Select
                  required
                  value={form.accountId}
                  onChange={(e) => setForm({ ...form, accountId: e.target.value })}
                >
                  <option value="">Select account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Note</Label>
                <Textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">Add Income</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <PeriodFilter
            period={period}
            date={date}
            onPeriodChange={setPeriod}
            onDateChange={setDate}
          />

          {summary && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(summary.total)}</p>
                  <p className="text-sm text-muted-foreground">{summary.count} entries</p>
                </CardContent>
              </Card>
              {summary.categories.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>By Category</CardTitle>
                  </CardHeader>
                  <CardContent className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={summary.categories}
                          dataKey="total"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                        >
                          {summary.categories.map((c) => (
                            <Cell key={c.categoryId} fill={c.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Income List</CardTitle>
            </CardHeader>
            <CardContent>
              {incomes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No income for this period.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomes.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell>{formatDate(i.date)}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-2">
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{ backgroundColor: i.category.color }}
                            />
                            {i.category.name}
                          </span>
                        </TableCell>
                        <TableCell>{i.account.name}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{i.note || "—"}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(i.amount)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(i.id)}>
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
      </div>
    </div>
  );
}
