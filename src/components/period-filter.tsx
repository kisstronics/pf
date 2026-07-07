"use client";

import { Period, PERIOD_LABELS } from "@/lib/period";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PeriodFilterProps {
  period: Period;
  date: string;
  onPeriodChange: (period: Period) => void;
  onDateChange: (date: string) => void;
}

export function PeriodFilter({
  period,
  date,
  onPeriodChange,
  onDateChange,
}: PeriodFilterProps) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <Tabs value={period} onValueChange={(v) => onPeriodChange(v as Period)}>
        <TabsList>
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <TabsTrigger key={p} value={p}>
              {PERIOD_LABELS[p]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="space-y-1">
        <Label htmlFor="filter-date">Reference date</Label>
        <Input
          id="filter-date"
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-auto"
        />
      </div>
    </div>
  );
}
