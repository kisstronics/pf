import { NextRequest, NextResponse } from "next/server";
import { buildProjection } from "@/lib/projection";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetDate = searchParams.get("targetDate");
  if (!targetDate) {
    return NextResponse.json({ error: "targetDate is required" }, { status: 400 });
  }

  const monthlyIncomeParam = searchParams.get("monthlyIncome");
  const monthlyExpensesParam = searchParams.get("monthlyExpenses");

  const overrides: { monthlyIncome?: number; monthlyExpenses?: number } = {};
  if (monthlyIncomeParam !== null) overrides.monthlyIncome = parseFloat(monthlyIncomeParam);
  if (monthlyExpensesParam !== null) overrides.monthlyExpenses = parseFloat(monthlyExpensesParam);

  const result = await buildProjection(
    targetDate,
    Object.keys(overrides).length > 0 ? overrides : undefined
  );

  if ("error" in result) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
