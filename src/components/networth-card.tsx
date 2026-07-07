"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, cn } from "@/lib/utils";
import { NETWORTH_CATEGORY_LABELS, type NetWorthCategoryKey } from "@/lib/networth-settings";
import { TrendingUp } from "lucide-react";

interface NetWorthData {
  total: number;
  assets: number;
  liabilities: number;
  excluded: NetWorthCategoryKey[];
  breakdown: Record<NetWorthCategoryKey, number>;
}

const BREAKDOWN_ORDER: NetWorthCategoryKey[] = [
  "accounts",
  "assets",
  "investments",
  "nps",
  "epf",
  "loans",
  "creditCards",
  "overdraft",
];

const LIABILITY_KEYS = new Set<NetWorthCategoryKey>(["loans", "creditCards", "overdraft"]);

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

  const excludedSet = new Set(data.excluded);

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
          {BREAKDOWN_ORDER.map((key) => {
            const isExcluded = excludedSet.has(key);
            const isLiability = LIABILITY_KEYS.has(key);
            const value = data.breakdown[key];
            return (
              <span
                key={key}
                className={cn(isExcluded && "line-through opacity-50")}
              >
                {NETWORTH_CATEGORY_LABELS[key]}
                {isExcluded ? " (excluded)" : ""}:{" "}
                {isLiability ? "−" : ""}
                {formatCurrency(value)}
              </span>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
