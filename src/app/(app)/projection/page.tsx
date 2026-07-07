"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { addMonths, format } from "date-fns";
import { Target, TrendingUp, AlertTriangle } from "lucide-react";

interface ProjectionData {
  currentNetWorth: number;
  targetDate: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  computedMonthlyIncome: number;
  computedMonthlyExpenses: number;
  monthlyNetFlow: number;
  projectedNetWorth: number;
  monthsToTarget: number;
  timeline: { date: string; netWorth: number }[];
  zeroDate: string | null;
  monthsToZero: number | null;
  zeroDateMessage: string;
  isNegative: boolean;
}

export default function ProjectionPage() {
  const defaultTarget = format(addMonths(new Date(), 12), "yyyy-MM-dd");
  const [targetDate, setTargetDate] = useState(defaultTarget);
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [monthlyExpenses, setMonthlyExpenses] = useState("");
  const [useOverrides, setUseOverrides] = useState(false);
  const [data, setData] = useState<ProjectionData | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadProjection() {
    setLoading(true);
    const params = new URLSearchParams({ targetDate });
    if (useOverrides && monthlyIncome) params.set("monthlyIncome", monthlyIncome);
    if (useOverrides && monthlyExpenses) params.set("monthlyExpenses", monthlyExpenses);

    try {
      const res = await fetch(`/api/projection?${params}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
        if (!useOverrides) {
          setMonthlyIncome(String(Math.round(json.computedMonthlyIncome)));
          setMonthlyExpenses(String(Math.round(json.computedMonthlyExpenses)));
        }
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjection();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Net Worth Projection</h1>
        <p className="text-muted-foreground">
          Forecast net worth based on monthly income and expenses
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projection Settings</CardTitle>
          <CardDescription>
            Monthly averages are computed from the last 3 months of income and expense data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="target-date">Target Date</Label>
              <Input
                id="target-date"
                type="date"
                value={targetDate}
                min={format(new Date(), "yyyy-MM-dd")}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly-income">Monthly Income (₹)</Label>
              <Input
                id="monthly-income"
                type="number"
                value={monthlyIncome}
                disabled={!useOverrides}
                onChange={(e) => setMonthlyIncome(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly-expenses">Monthly Expenses (₹)</Label>
              <Input
                id="monthly-expenses"
                type="number"
                value={monthlyExpenses}
                disabled={!useOverrides}
                onChange={(e) => setMonthlyExpenses(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useOverrides}
                onChange={(e) => setUseOverrides(e.target.checked)}
              />
              Override monthly income & expenses
            </label>
            <Button onClick={loadProjection} disabled={loading}>
              {loading ? "Calculating..." : "Calculate Projection"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Current Net Worth</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${data.currentNetWorth < 0 ? "text-destructive" : ""}`}>
                  {formatCurrency(data.currentNetWorth)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Projected Net Worth</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${data.projectedNetWorth < 0 ? "text-destructive" : "text-green-600"}`}>
                  {formatCurrency(data.projectedNetWorth)}
                </p>
                <p className="text-xs text-muted-foreground">by {formatDate(data.targetDate)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Monthly Net Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${data.monthlyNetFlow >= 0 ? "text-green-600" : "text-destructive"}`}>
                  {formatCurrency(data.monthlyNetFlow)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(data.monthlyIncome)} in − {formatCurrency(data.monthlyExpenses)} out
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  Zero Net Worth Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.zeroDate ? (
                  <>
                    <p className="text-2xl font-bold">{formatDate(data.zeroDate)}</p>
                    <p className="text-xs text-muted-foreground">
                      ~{data.monthsToZero} months from now
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Not applicable</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className={data.isNegative ? "border-destructive/50" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {data.isNegative ? (
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                ) : (
                  <TrendingUp className="h-5 w-5" />
                )}
                Zero Date Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{data.zeroDateMessage}</p>
              {data.isNegative && data.zeroDate && (
                <p className="mt-2 text-sm text-muted-foreground">
                  With a monthly surplus of {formatCurrency(data.monthlyNetFlow)}, your net worth
                  is projected to recover from {formatCurrency(data.currentNetWorth)} to ₹0 by{" "}
                  <strong>{formatDate(data.zeroDate)}</strong>.
                </p>
              )}
              {data.isNegative && !data.zeroDate && (
                <p className="mt-2 text-sm text-destructive">
                  Your expenses exceed or equal your income. Net worth will continue declining.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Projection Timeline</CardTitle>
              <CardDescription>
                Net worth trajectory over {data.monthsToTarget} months
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.timeline}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => formatDate(v)}
                    className="text-xs"
                  />
                  <YAxis
                    tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
                    className="text-xs"
                  />
                  <Tooltip
                    formatter={(v) => formatCurrency(Number(v))}
                    labelFormatter={(l) => formatDate(String(l))}
                  />
                  <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
                  <Line
                    type="monotone"
                    dataKey="netWorth"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                    name="Net Worth"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
