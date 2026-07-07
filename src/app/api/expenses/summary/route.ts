import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDateRange, Period } from "@/lib/period";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") || "month") as Period;
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  const { start, end } = getDateRange(period, date);

  const expenses = await prisma.expense.findMany({
    where: { date: { gte: start, lte: end } },
    include: { category: true },
  });

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const byCategory = expenses.reduce(
    (acc, e) => {
      const key = e.categoryId;
      if (!acc[key]) {
        acc[key] = { categoryId: key, name: e.category.name, color: e.category.color, total: 0 };
      }
      acc[key].total += e.amount;
      return acc;
    },
    {} as Record<string, { categoryId: string; name: string; color: string; total: number }>
  );

  const categories = Object.values(byCategory).sort((a, b) => b.total - a.total);

  return NextResponse.json({ total, count: expenses.length, categories, period, date });
}
