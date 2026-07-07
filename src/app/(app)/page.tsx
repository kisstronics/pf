"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NetWorthCard } from "@/components/networth-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Receipt, Landmark, Building2 } from "lucide-react";

interface Expense {
  id: string;
  amount: number;
  date: string;
  note: string | null;
  category: { name: string; color: string };
  account: { name: string };
}

export default function DashboardPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    fetch("/api/expenses?period=month&limit=5")
      .then((r) => r.json())
      .then(setExpenses)
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
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link href="/expenses" className="inline-flex h-10 items-center justify-start rounded-md border border-border px-4 text-sm hover:bg-accent">
              <Receipt className="mr-2 h-4 w-4" />
              Add Expense
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
          <CardTitle>Recent Expenses</CardTitle>
          <Link href="/expenses" className="text-sm text-muted-foreground hover:text-foreground">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No expenses this month yet.</p>
          ) : (
            <div className="space-y-3">
              {expenses.map((e) => (
                <div key={e.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: e.category.color }}
                    />
                    <div>
                      <p className="font-medium">{e.category.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(e.date)} · {e.account.name}
                      </p>
                    </div>
                  </div>
                  <span className="font-medium">{formatCurrency(e.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
