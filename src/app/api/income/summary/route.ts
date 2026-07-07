import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDateRange, Period } from "@/lib/period";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") || "month") as Period;
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  const { start, end } = getDateRange(period, date);

  const incomes = await prisma.income.findMany({
    where: { date: { gte: start, lte: end } },
    include: { category: true },
  });

  const total = incomes.reduce((sum, i) => sum + i.amount, 0);

  const byCategory = incomes.reduce(
    (acc, i) => {
      const key = i.categoryId;
      if (!acc[key]) {
        acc[key] = { categoryId: key, name: i.category.name, color: i.category.color, total: 0 };
      }
      acc[key].total += i.amount;
      return acc;
    },
    {} as Record<string, { categoryId: string; name: string; color: string; total: number }>
  );

  const categories = Object.values(byCategory).sort((a, b) => b.total - a.total);

  return NextResponse.json({ total, count: incomes.length, categories, period, date });
}
