"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

interface NetWorthData {
  total: number;
  assets: number;
  liabilities: number;
  breakdown: {
    accounts: number;
    assets: number;
    nps: number;
    epf: number;
    investments: number;
    loans: number;
    creditCards: number;
    overdraft: number;
  };
}

export function NetWorthCard() {
  const [data, setData] = useState<NetWorthData | null>(null);

  useEffect(() => {
    fetch("/api/networth")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Net Worth</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Net Worth</CardTitle>
        <TrendingUp className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{formatCurrency(data.total)}</p>
        <div className="mt-2 flex gap-4 text-sm">
          <span className="text-green-600">Assets: {formatCurrency(data.assets)}</span>
          <span className="text-destructive">Liabilities: {formatCurrency(data.liabilities)}</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <span>Accounts: {formatCurrency(data.breakdown.accounts)}</span>
          <span>Assets: {formatCurrency(data.breakdown.assets)}</span>
          <span>Investments: {formatCurrency(data.breakdown.investments)}</span>
          <span>NPS: {formatCurrency(data.breakdown.nps)}</span>
          <span>EPF: {formatCurrency(data.breakdown.epf)}</span>
          <span>Loans: −{formatCurrency(data.breakdown.loans)}</span>
          <span>Credit Cards: −{formatCurrency(data.breakdown.creditCards)}</span>
          <span>Overdraft: −{formatCurrency(data.breakdown.overdraft)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
