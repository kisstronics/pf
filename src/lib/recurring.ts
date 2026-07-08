import { addDays, addWeeks, addMonths, addYears, isAfter } from "date-fns";
import "server-only";

import { getDb } from "./db";

export type Frequency = "daily" | "weekly" | "monthly" | "yearly";

// Safety cap so an over-eager range (e.g. daily for 30 years) can't create
// an unbounded number of rows in one request.
export const MAX_OCCURRENCES = 600;

function addInterval(date: Date, frequency: Frequency, steps: number): Date {
  switch (frequency) {
    case "daily":
      return addDays(date, steps);
    case "weekly":
      return addWeeks(date, steps);
    case "monthly":
      return addMonths(date, steps);
    case "yearly":
      return addYears(date, steps);
  }
}

// Every occurrence date from `start` through `end` (inclusive) at the given
// frequency, capped at MAX_OCCURRENCES.
export function generateOccurrenceDates(
  start: Date,
  end: Date,
  frequency: Frequency
): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < MAX_OCCURRENCES; i++) {
    const next = addInterval(start, frequency, i);
    if (isAfter(next, end)) break;
    dates.push(next);
  }
  return dates;
}

// Convert a recurring amount at a given frequency into its monthly equivalent
// so that fixed income/expense can be compared on a common (monthly) basis.
const MONTHLY_FACTOR: Record<Frequency, number> = {
  daily: 365 / 12,
  weekly: 52 / 12,
  monthly: 1,
  yearly: 1 / 12,
};

export function monthlyEquivalent(amount: number, frequency: string | null): number {
  const factor = MONTHLY_FACTOR[(frequency as Frequency)] ?? 1;
  return amount * factor;
}

export interface RecurringItem {
  id: string;
  amount: number;
  frequency: string | null;
  monthlyAmount: number;
  note: string | null;
  category: { name: string; color: string };
  account: { name: string };
}

export interface FixedFlow {
  monthlyTotal: number;
  items: RecurringItem[];
}

export interface FixedSummary {
  income: FixedFlow;
  expense: FixedFlow;
  monthlyNet: number;
}

export async function getFixedFlows(): Promise<FixedSummary> {
  const prisma = await getDb();
  const allRecurring = await prisma.transaction.findMany({
    where: { isRecurring: true },
    include: { category: true, account: true },
    orderBy: { amount: "desc" },
  });

  // A recurring series is materialized as many occurrences sharing one
  // recurringGroupId; count each series once toward the monthly commitment.
  const seen = new Set<string>();
  const recurring = allRecurring.filter((t) => {
    const key = t.recurringGroupId ?? t.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const toItem = (t: (typeof recurring)[number]): RecurringItem => ({
    id: t.id,
    amount: t.amount,
    frequency: t.frequency,
    monthlyAmount: monthlyEquivalent(t.amount, t.frequency),
    note: t.note,
    category: { name: t.category.name, color: t.category.color },
    account: { name: t.account.name },
  });

  const income = recurring.filter((t) => t.type === "income").map(toItem);
  const expense = recurring.filter((t) => t.type === "expense").map(toItem);

  const incomeMonthly = income.reduce((sum, i) => sum + i.monthlyAmount, 0);
  const expenseMonthly = expense.reduce((sum, e) => sum + e.monthlyAmount, 0);

  return {
    income: { monthlyTotal: incomeMonthly, items: income },
    expense: { monthlyTotal: expenseMonthly, items: expense },
    monthlyNet: incomeMonthly - expenseMonthly,
  };
}
