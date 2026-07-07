import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDateRange, Period } from "@/lib/period";

interface CategoryTotal {
  categoryId: string;
  name: string;
  color: string;
  total: number;
}

function byCategory(items: { categoryId: string; amount: number; category: { name: string; color: string } }[]) {
  const map = items.reduce(
    (acc, t) => {
      if (!acc[t.categoryId]) {
        acc[t.categoryId] = {
          categoryId: t.categoryId,
          name: t.category.name,
          color: t.category.color,
          total: 0,
        };
      }
      acc[t.categoryId].total += t.amount;
      return acc;
    },
    {} as Record<string, CategoryTotal>
  );
  return Object.values(map).sort((a, b) => b.total - a.total);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") || "month") as Period;
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  const { start, end } = getDateRange(period, date);

  const transactions = await prisma.transaction.findMany({
    where: { date: { gte: start, lte: end } },
    include: { category: true },
  });

  const income = transactions.filter((t) => t.type === "income");
  const expense = transactions.filter((t) => t.type === "expense");

  const incomeTotal = income.reduce((sum, t) => sum + t.amount, 0);
  const expenseTotal = expense.reduce((sum, t) => sum + t.amount, 0);

  return NextResponse.json({
    period,
    date,
    income: {
      total: incomeTotal,
      count: income.length,
      categories: byCategory(income),
    },
    expense: {
      total: expenseTotal,
      count: expense.length,
      categories: byCategory(expense),
    },
    // "Total budget" for the selected filter = income left over after expenses.
    budget: incomeTotal - expenseTotal,
  });
}
