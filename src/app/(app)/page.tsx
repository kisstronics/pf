"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NetWorthCard } from "@/components/networth-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Receipt, Landmark, Building2, ArrowDownRight, ArrowUpRight, Repeat } from "lucide-react";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  date: string;
  note: string | null;
  category: { name: string; color: string };
  account: { name: string };
}

interface RecurringItem {
  id: string;
  amount: number;
  frequency: string | null;
  monthlyAmount: number;
  note: string | null;
  category: { name: string; color: string };
  account: { name: string };
}

interface FixedFlows {
  income: { monthlyTotal: number; items: RecurringItem[] };
  expense: { monthlyTotal: number; items: RecurringItem[] };
  monthlyNet: number;
}

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fixed, setFixed] = useState<FixedFlows | null>(null);

  useEffect(() => {
    fetch("/api/transactions?period=month&limit=5")
      .then((r) => r.json())
      .then(setTransactions)
      .catch(console.error);
    fetch("/api/transactions/recurring")
      .then((r) => r.json())
      .then(setFixed)
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your finances</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <NetWorthCard />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Fixed Income</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(fixed?.income.monthlyTotal ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground">per month · from recurring income</p>
            {fixed && fixed.income.items.length > 0 && (
              <div className="mt-3 space-y-1">
                {fixed.income.items.slice(0, 3).map((i) => (
                  <FixedRow key={i.id} item={i} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Fixed Expenses</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(fixed?.expense.monthlyTotal ?? 0)}</p>
            <p className="text-xs text-muted-foreground">per month · from recurring expenses</p>
            {fixed && fixed.expense.items.length > 0 && (
              <div className="mt-3 space-y-1">
                {fixed.expense.items.slice(0, 3).map((i) => (
                  <FixedRow key={i.id} item={i} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Fixed Monthly Net</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                "text-2xl font-bold",
                (fixed?.monthlyNet ?? 0) >= 0 ? "text-green-600" : "text-destructive"
              )}
            >
              {formatCurrency(fixed?.monthlyNet ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground">fixed income − fixed expenses</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-3">
            <Link href="/transactions" className="inline-flex h-10 items-center justify-start rounded-md border border-border px-4 text-sm hover:bg-accent">
              <Receipt className="mr-2 h-4 w-4" />
              Add Entry
            </Link>
            <Link href="/accounts" className="inline-flex h-10 items-center justify-start rounded-md border border-border px-4 text-sm hover:bg-accent">
              <Landmark className="mr-2 h-4 w-4" />
              Manage Accounts
            </Link>
            <Link href="/assets" className="inline-flex h-10 items-center justify-start rounded-md border border-border px-4 text-sm hover:bg-accent">
              <Building2 className="mr-2 h-4 w-4" />
              Manage Assets
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Link href="/transactions" className="text-sm text-muted-foreground hover:text-foreground">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions this month yet.</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: t.category.color }}
                    />
                    <div>
                      <p className="flex items-center gap-2 font-medium">
                        {t.category.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(t.date)} · {t.account.name}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "font-medium",
                      t.type === "income" ? "text-green-600" : ""
                    )}
                  >
                    {t.type === "income" ? "+" : "−"}
                    {formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FixedRow({ item }: { item: RecurringItem }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: item.category.color }} />
        {item.category.name}
        <span className="inline-flex items-center gap-0.5">
          <Repeat className="h-3 w-3" />
          {item.frequency}
        </span>
      </span>
      <span className="font-medium">{formatCurrency(item.monthlyAmount)}</span>
    </div>
  );
}
