import {
  addMonths,
  differenceInCalendarMonths,
  format,
  parseISO,
  isAfter,
} from "date-fns";
import "server-only";

import { getDb } from "./db";
import { calculateNetWorth } from "./networth";
import { getNetWorthExclusions } from "./networth-settings";
import { getExcludeDebtInterest } from "./projection-settings";
import { getFixedFlows } from "./recurring";

const MAX_SIM_MONTHS = 1200; // 100-year cap for zero-date search

// Projection uses the same fixed monthly income/expenses shown on the
// dashboard (derived from recurring transactions) so both stay in sync.
export async function getMonthlyIncome(): Promise<number> {
  const flows = await getFixedFlows();
  return flows.income.monthlyTotal;
}

export async function getMonthlyExpenses(): Promise<number> {
  const flows = await getFixedFlows();
  return flows.expense.monthlyTotal;
}

export interface DebtProfile {
  totalDebt: number;
  // Weighted average monthly interest rate across all interest-bearing debt.
  weightedMonthlyRate: number;
  // Interest accruing this month at the current outstanding balance.
  monthlyInterest: number;
}

// Aggregates outstanding debt and its interest, honoring net worth exclusions
// so the projection matches what the net worth figure actually counts.
export async function getDebtProfile(): Promise<DebtProfile> {
  const prisma = await getDb();
  const exclusions = new Set(await getNetWorthExclusions());

  const [loans, overdraftAccounts, creditCards] = await Promise.all([
    prisma.loan.findMany(),
    prisma.overdraftAccount.findMany(),
    prisma.creditCard.findMany(),
  ]);

  let totalDebt = 0;
  let weightedMonthlyRateSum = 0; // sum of balance * monthlyRate

  if (!exclusions.has("loans")) {
    for (const l of loans) {
      totalDebt += l.outstandingBalance;
      weightedMonthlyRateSum += l.outstandingBalance * (l.interestRate / 100 / 12);
    }
  }
  if (!exclusions.has("overdraft")) {
    for (const o of overdraftAccounts) {
      totalDebt += o.utilizedAmount;
      weightedMonthlyRateSum += o.utilizedAmount * (o.interestRate / 100 / 12);
    }
  }
  // Credit cards have no stored interest rate, so they contribute principal
  // but no modeled interest.
  if (!exclusions.has("creditCards")) {
    for (const c of creditCards) {
      totalDebt += c.outstandingBalance;
    }
  }

  const weightedMonthlyRate = totalDebt > 0 ? weightedMonthlyRateSum / totalDebt : 0;

  return {
    totalDebt,
    weightedMonthlyRate,
    monthlyInterest: weightedMonthlyRateSum,
  };
}

interface SimState {
  assets: number;
  debt: number;
}

// Advances one month: debt accrues interest, then the monthly surplus is
// applied against debt first (any leftover grows assets). A deficit draws
// down assets.
function stepMonth(state: SimState, monthlyRate: number, surplus: number): SimState {
  let { assets, debt } = state;

  debt += debt * monthlyRate;

  if (surplus >= 0) {
    if (surplus <= debt) {
      debt -= surplus;
    } else {
      assets += surplus - debt;
      debt = 0;
    }
  } else {
    assets += surplus;
  }

  return { assets, debt };
}

export interface ProjectionResult {
  projectedNetWorth: number;
  months: number;
  monthlyNetFlow: number;
  timeline: { date: string; netWorth: number }[];
}

// Simulates net worth forward, paying down interest-bearing debt with the
// monthly surplus, and samples a timeline for charting.
export function projectNetWorth(
  assets: number,
  debt: number,
  weightedMonthlyRate: number,
  monthlyIncome: number,
  monthlyExpenses: number,
  targetDate: Date,
  fromDate: Date = new Date()
): ProjectionResult {
  const surplus = monthlyIncome - monthlyExpenses;
  const months = Math.max(0, differenceInCalendarMonths(targetDate, fromDate));

  const timeline: { date: string; netWorth: number }[] = [
    { date: format(fromDate, "yyyy-MM-dd"), netWorth: assets - debt },
  ];

  const sampleEvery = Math.max(1, Math.ceil(months / 24));
  let state: SimState = { assets, debt };

  for (let m = 1; m <= months; m++) {
    state = stepMonth(state, weightedMonthlyRate, surplus);
    if (m % sampleEvery === 0 || m === months) {
      timeline.push({
        date: format(addMonths(fromDate, m), "yyyy-MM-dd"),
        netWorth: state.assets - state.debt,
      });
    }
  }

  return {
    projectedNetWorth: state.assets - state.debt,
    months,
    monthlyNetFlow: surplus,
    timeline,
  };
}

export interface ZeroDateResult {
  zeroDate: string | null;
  monthsToZero: number | null;
  recoverable: boolean;
  message: string;
}

// Determines when net worth crosses zero by simulating monthly debt payback
// using the monthly surplus. When excludeInterest is true, weightedMonthlyRate
// should already be 0 (interest not compounded in the simulation).
export function calculateZeroDate(
  assets: number,
  debt: number,
  weightedMonthlyRate: number,
  monthlyIncome: number,
  monthlyExpenses: number,
  fromDate: Date = new Date(),
  excludeInterest = false
): ZeroDateResult {
  const surplus = monthlyIncome - monthlyExpenses;
  const currentNetWorth = assets - debt;

  // Positive net worth: only reaches zero if it's declining.
  if (currentNetWorth >= 0) {
    let state: SimState = { assets, debt };
    for (let m = 1; m <= MAX_SIM_MONTHS; m++) {
      state = stepMonth(state, weightedMonthlyRate, surplus);
      const nw = state.assets - state.debt;
      if (nw <= 0) {
        return {
          zeroDate: format(addMonths(fromDate, m), "yyyy-MM-dd"),
          monthsToZero: m,
          recoverable: false,
          message: "Net worth is positive but declining. Projected date it reaches zero.",
        };
      }
      if (surplus >= 0 && state.debt === 0) break; // debt cleared and growing; never hits zero
    }
    return {
      zeroDate: null,
      monthsToZero: null,
      recoverable: true,
      message: "Net worth is positive and not projected to reach zero.",
    };
  }

  // Negative net worth with no surplus: debt cannot be paid down.
  if (surplus <= 0) {
    return {
      zeroDate: null,
      monthsToZero: null,
      recoverable: false,
      message:
        "Expenses meet or exceed income, so there's nothing to pay down debt. Net worth will not recover.",
    };
  }

  // Negative net worth with a surplus: simulate paying down debt + interest.
  let state: SimState = { assets, debt };
  for (let m = 1; m <= MAX_SIM_MONTHS; m++) {
    state = stepMonth(state, weightedMonthlyRate, surplus);
    const nw = state.assets - state.debt;
    if (nw >= 0) {
      return {
        zeroDate: format(addMonths(fromDate, m), "yyyy-MM-dd"),
        monthsToZero: m,
        recoverable: true,
        message: zeroRecoveryMessage(excludeInterest),
      };
    }
  }

  return {
    zeroDate: null,
    monthsToZero: null,
    recoverable: false,
    message: excludeInterest
      ? "The monthly surplus isn't enough to pay down debt within 100 years."
      : "The monthly surplus isn't enough to outpace debt interest, so net worth doesn't recover to zero within 100 years.",
  };
}

function zeroRecoveryMessage(excludeInterest: boolean): string {
  return excludeInterest
    ? "Projected date net worth recovers to zero, with the monthly surplus paying down debt principal (debt interest excluded — already counted in expenses)."
    : "Projected date net worth recovers to zero, after the monthly surplus pays down debt and its interest.";
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
  const debtProfile = await getDebtProfile();
  const excludeDebtInterest = await getExcludeDebtInterest();
  const effectiveMonthlyRate = excludeDebtInterest ? 0 : debtProfile.weightedMonthlyRate;
  const fixedFlows = await getFixedFlows();
  const computedIncome = fixedFlows.income.monthlyTotal;
  const computedExpenses = fixedFlows.expense.monthlyTotal;

  const monthlyIncome = overrides?.monthlyIncome ?? computedIncome;
  const monthlyExpenses = overrides?.monthlyExpenses ?? computedExpenses;

  const projection = projectNetWorth(
    netWorth.assets,
    netWorth.liabilities,
    effectiveMonthlyRate,
    monthlyIncome,
    monthlyExpenses,
    targetDate
  );

  const zeroAnalysis = calculateZeroDate(
    netWorth.assets,
    netWorth.liabilities,
    effectiveMonthlyRate,
    monthlyIncome,
    monthlyExpenses,
    new Date(),
    excludeDebtInterest
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
    totalDebt: debtProfile.totalDebt,
    monthlyDebtInterest: debtProfile.monthlyInterest,
    weightedAnnualDebtRate: debtProfile.weightedMonthlyRate * 12 * 100,
    excludeDebtInterest,
  };
}
