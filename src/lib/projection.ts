import {
  addMonths,
  differenceInCalendarMonths,
  startOfMonth,
  subMonths,
  format,
  parseISO,
  isAfter,
} from "date-fns";
import { prisma } from "./prisma";
import { calculateNetWorth } from "./networth";

const DEFAULT_LOOKBACK_MONTHS = 3;

export async function getAverageMonthlyIncome(months = DEFAULT_LOOKBACK_MONTHS): Promise<number> {
  const end = new Date();
  const start = startOfMonth(subMonths(end, months));

  const result = await prisma.transaction.aggregate({
    where: { type: "income", date: { gte: start, lte: end } },
    _sum: { amount: true },
  });

  return (result._sum.amount || 0) / months;
}

export async function getAverageMonthlyExpenses(months = DEFAULT_LOOKBACK_MONTHS): Promise<number> {
  const end = new Date();
  const start = startOfMonth(subMonths(end, months));

  const result = await prisma.transaction.aggregate({
    where: { type: "expense", date: { gte: start, lte: end } },
    _sum: { amount: true },
  });

  return (result._sum.amount || 0) / months;
}

export function projectNetWorth(
  currentNetWorth: number,
  monthlyIncome: number,
  monthlyExpenses: number,
  targetDate: Date,
  fromDate: Date = new Date()
): {
  projectedNetWorth: number;
  months: number;
  monthlyNetFlow: number;
  timeline: { date: string; netWorth: number }[];
} {
  const monthlyNetFlow = monthlyIncome - monthlyExpenses;
  const months = Math.max(0, differenceInCalendarMonths(targetDate, fromDate));
  const projectedNetWorth = currentNetWorth + monthlyNetFlow * months;

  const timeline: { date: string; netWorth: number }[] = [];
  const steps = Math.min(months, 24);
  for (let i = 0; i <= steps; i++) {
    const stepMonths = months === 0 ? 0 : Math.round((i / steps) * months);
    timeline.push({
      date: format(addMonths(fromDate, stepMonths), "yyyy-MM-dd"),
      netWorth: currentNetWorth + monthlyNetFlow * stepMonths,
    });
  }
  if (months > 24) {
    timeline.push({
      date: format(targetDate, "yyyy-MM-dd"),
      netWorth: projectedNetWorth,
    });
  }

  return { projectedNetWorth, months, monthlyNetFlow, timeline };
}

export function calculateZeroDate(
  currentNetWorth: number,
  monthlyIncome: number,
  monthlyExpenses: number,
  fromDate: Date = new Date()
): {
  zeroDate: string | null;
  monthsToZero: number | null;
  recoverable: boolean;
  message: string;
} {
  const monthlyNetFlow = monthlyIncome - monthlyExpenses;

  if (currentNetWorth >= 0) {
    if (monthlyNetFlow < 0) {
      const monthsToZero = Math.ceil(currentNetWorth / Math.abs(monthlyNetFlow));
      return {
        zeroDate: format(addMonths(fromDate, monthsToZero), "yyyy-MM-dd"),
        monthsToZero,
        recoverable: false,
        message: "Net worth is positive but declining. Projected date when it reaches zero.",
      };
    }
    return {
      zeroDate: null,
      monthsToZero: null,
      recoverable: true,
      message: "Net worth is positive and not projected to reach zero.",
    };
  }

  if (monthlyNetFlow <= 0) {
    return {
      zeroDate: null,
      monthsToZero: null,
      recoverable: false,
      message: "Net worth is negative and expenses exceed income. Cannot recover to zero.",
    };
  }

  const monthsToZero = Math.ceil(Math.abs(currentNetWorth) / monthlyNetFlow);
  return {
    zeroDate: format(addMonths(fromDate, monthsToZero), "yyyy-MM-dd"),
    monthsToZero,
    recoverable: true,
    message: "Projected date when net worth recovers from negative to zero.",
  };
}

export async function buildProjection(targetDateStr: string, overrides?: {
  monthlyIncome?: number;
  monthlyExpenses?: number;
}) {
  const targetDate = parseISO(targetDateStr);
  const today = new Date();

  if (!isAfter(targetDate, today) && targetDateStr !== format(today, "yyyy-MM-dd")) {
    return { error: "Target date must be today or in the future" };
  }

  const netWorth = await calculateNetWorth();
  const computedIncome = await getAverageMonthlyIncome();
  const computedExpenses = await getAverageMonthlyExpenses();

  const monthlyIncome = overrides?.monthlyIncome ?? computedIncome;
  const monthlyExpenses = overrides?.monthlyExpenses ?? computedExpenses;

  const projection = projectNetWorth(
    netWorth.total,
    monthlyIncome,
    monthlyExpenses,
    targetDate
  );

  const zeroAnalysis = calculateZeroDate(
    netWorth.total,
    monthlyIncome,
    monthlyExpenses
  );

  return {
    currentNetWorth: netWorth.total,
    targetDate: targetDateStr,
    monthlyIncome,
    monthlyExpenses,
    computedMonthlyIncome: computedIncome,
    computedMonthlyExpenses: computedExpenses,
    monthlyNetFlow: projection.monthlyNetFlow,
    projectedNetWorth: projection.projectedNetWorth,
    monthsToTarget: projection.months,
    timeline: projection.timeline,
    zeroDate: zeroAnalysis.zeroDate,
    monthsToZero: zeroAnalysis.monthsToZero,
    zeroDateMessage: zeroAnalysis.message,
    isNegative: netWorth.total < 0,
  };
}
