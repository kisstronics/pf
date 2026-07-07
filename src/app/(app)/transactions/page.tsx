"use client";

import { useEffect, useMemo, useState } from "react";
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
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Trash2, Repeat, Pencil } from "lucide-react";

type EntryType = "income" | "expense";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Account {
  id: string;
  name: string;
}

interface Transaction {
  id: string;
  type: EntryType;
  amount: number;
  date: string;
  note: string | null;
  isRecurring: boolean;
  frequency: string | null;
  endDate: string | null;
  recurringGroupId: string | null;
  category: Category;
  account: Account;
}

interface CategorySummary {
  categoryId: string;
  name: string;
  color: string;
  total: number;
}

interface Summary {
  income: { total: number; count: number; categories: CategorySummary[] };
  expense: { total: number; count: number; categories: CategorySummary[] };
  budget: number;
}

const FREQUENCIES = ["monthly", "weekly", "yearly", "daily"] as const;

export default function TransactionsPage() {
  const today = new Date().toISOString().split("T")[0];
  const [period, setPeriod] = useState<Period>("month");
  const [date, setDate] = useState(today);
  const [typeFilter, setTypeFilter] = useState<"all" | EntryType>("all");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [form, setForm] = useState({
    type: "expense" as EntryType,
    amount: "",
    date: today,
    categoryId: "",
    accountId: "",
    note: "",
    isRecurring: false,
    frequency: "monthly" as (typeof FREQUENCIES)[number],
    endDate: "",
  });

  const formCategories = form.type === "income" ? incomeCategories : expenseCategories;

  function loadData() {
    const params = `period=${period}&date=${date}`;
    fetch(`/api/transactions?${params}`).then((r) => r.json()).then(setTransactions);
    fetch(`/api/transactions/summary?${params}`).then((r) => r.json()).then(setSummary);
  }

  useEffect(() => {
    fetch("/api/settings/income-categories").then((r) => r.json()).then(setIncomeCategories);
    fetch("/api/settings/expense-categories").then((r) => r.json()).then(setExpenseCategories);
    fetch("/api/accounts").then((r) => r.json()).then(setAccounts);
  }, []);

  useEffect(() => {
    loadData();
  }, [period, date]);

  function setType(type: EntryType) {
    setForm((f) => ({ ...f, type, categoryId: "" }));
  }

  function resetForm() {
    setForm({
      type: "expense",
      amount: "",
      date: today,
      categoryId: "",
      accountId: "",
      note: "",
      isRecurring: false,
      frequency: "monthly",
      endDate: "",
    });
    setEditing(null);
  }

  function startEdit(transaction: Transaction) {
    setEditing(transaction);
    setForm({
      type: transaction.type,
      amount: String(transaction.amount),
      date: transaction.date.split("T")[0],
      categoryId: transaction.category.id,
      accountId: transaction.account.id,
      note: transaction.note || "",
      isRecurring: transaction.isRecurring,
      frequency: (transaction.frequency as (typeof FREQUENCIES)[number]) || "monthly",
      endDate: transaction.endDate ? transaction.endDate.split("T")[0] : "",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Recurring materialization only applies when creating a new series.
    const recurring = !editing && form.isRecurring;
    const payload = {
      type: form.type,
      amount: parseFloat(form.amount),
      date: form.date,
      categoryId: form.categoryId,
      accountId: form.accountId,
      note: form.note || undefined,
      isRecurring: recurring,
      frequency: recurring ? form.frequency : undefined,
      endDate: recurring ? form.endDate : undefined,
    };

    const res = editing
      ? await fetch(`/api/transactions/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    if (res.ok) {
      resetForm();
      loadData();
    }
  }

  async function handleDelete(t: Transaction) {
    if (t.recurringGroupId) {
      const deleteSeries = confirm(
        "This is a recurring entry.\n\nOK = delete the entire series.\nCancel = delete only this occurrence."
      );
      const url = deleteSeries
        ? `/api/transactions/${t.id}?scope=group`
        : `/api/transactions/${t.id}`;
      await fetch(url, { method: "DELETE" });
      loadData();
      return;
    }
    if (!confirm("Delete this entry?")) return;
    await fetch(`/api/transactions/${t.id}`, { method: "DELETE" });
    loadData();
  }

  const visibleTransactions = useMemo(
    () => (typeFilter === "all" ? transactions : transactions.filter((t) => t.type === typeFilter)),
    [transactions, typeFilter]
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Transactions</h1>
        <p className="text-muted-foreground">Track income and expenses in one place</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{editing ? "Edit Entry" : "Add Entry"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {editing ? (
                <p className="text-sm text-muted-foreground capitalize">
                  Editing {editing.type} entry
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType("expense")}
                    className={cn(
                      "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                      form.type === "expense"
                        ? "border-destructive bg-destructive/10 text-destructive"
                        : "border-border text-muted-foreground hover:bg-accent"
                    )}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("income")}
                    className={cn(
                      "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                      form.type === "income"
                        ? "border-green-600 bg-green-600/10 text-green-600"
                        : "border-border text-muted-foreground hover:bg-accent"
                    )}
                  >
                    Income
                  </button>
                </div>
              )}

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
                  {formCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{form.type === "income" ? "Deposit to Account" : "Account"}</Label>
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

              {!editing && (
                <div className="space-y-3 rounded-md border border-border p-3">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={form.isRecurring}
                      onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
                    />
                    <Repeat className="h-4 w-4" />
                    Recurring {form.type}
                  </label>
                  {form.isRecurring && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Frequency</Label>
                        <Select
                          value={form.frequency}
                          onChange={(e) =>
                            setForm({ ...form, frequency: e.target.value as (typeof FREQUENCIES)[number] })
                          }
                        >
                          {FREQUENCIES.map((f) => (
                            <option key={f} value={f}>
                              {f.charAt(0).toUpperCase() + f.slice(1)}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          required
                          min={form.date}
                          value={form.endDate}
                          onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                          A {form.frequency} entry is created from the start date through the end date.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Note</Label>
                <Textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editing ? "Update Entry" : `Add ${form.type === "income" ? "Income" : "Expense"}`}
                </Button>
                {editing && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
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
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Total Budget</CardTitle>
                </CardHeader>
                <CardContent>
                  <p
                    className={cn(
                      "text-2xl font-bold",
                      summary.budget >= 0 ? "text-green-600" : "text-destructive"
                    )}
                  >
                    {formatCurrency(summary.budget)}
                  </p>
                  <p className="text-xs text-muted-foreground">income − expenses</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Income</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.income.total)}</p>
                  <p className="text-xs text-muted-foreground">{summary.income.count} entries</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(summary.expense.total)}</p>
                  <p className="text-xs text-muted-foreground">{summary.expense.count} entries</p>
                </CardContent>
              </Card>
            </div>
          )}

          {summary && (summary.income.categories.length > 0 || summary.expense.categories.length > 0) && (
            <div className="grid gap-4 md:grid-cols-2">
              {summary.expense.categories.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Expenses by Category</CardTitle>
                  </CardHeader>
                  <CardContent className="h-48">
                    <CategoryPie data={summary.expense.categories} />
                  </CardContent>
                </Card>
              )}
              {summary.income.categories.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Income by Category</CardTitle>
                  </CardHeader>
                  <CardContent className="h-48">
                    <CategoryPie data={summary.income.categories} />
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle>Entries</CardTitle>
              <div className="flex gap-1">
                {(["all", "income", "expense"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setTypeFilter(f)}
                    className={cn(
                      "rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors",
                      typeFilter === f
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {visibleTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No entries for this period.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleTransactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{formatDate(t.date)}</TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                              t.type === "income"
                                ? "bg-green-600/10 text-green-600"
                                : "bg-destructive/10 text-destructive"
                            )}
                          >
                            {t.type}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-2">
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{ backgroundColor: t.category.color }}
                            />
                            {t.category.name}
                            {t.isRecurring && (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <Repeat className="h-3 w-3" />
                                {t.frequency}
                              </span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell>{t.account.name}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{t.note || "—"}</TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-medium",
                            t.type === "income" ? "text-green-600" : ""
                          )}
                        >
                          {t.type === "income" ? "+" : "−"}
                          {formatCurrency(t.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => startEdit(t)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(t)}>
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

function CategoryPie({ data }: { data: CategorySummary[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={60}>
          {data.map((c) => (
            <Cell key={c.categoryId} fill={c.color} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => formatCurrency(Number(v))} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
