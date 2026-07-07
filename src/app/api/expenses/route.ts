import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDateRange, Period } from "@/lib/period";
import { z } from "zod";

const createSchema = z.object({
  amount: z.number().positive(),
  date: z.string(),
  categoryId: z.string().min(1),
  accountId: z.string().min(1),
  note: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") || "month") as Period;
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const limit = searchParams.get("limit");

  const { start, end } = getDateRange(period, date);

  const expenses = await prisma.expense.findMany({
    where: { date: { gte: start, lte: end } },
    include: { category: true, account: { include: { type: true } } },
    orderBy: { date: "desc" },
    ...(limit ? { take: parseInt(limit) } : {}),
  });

  return NextResponse.json(expenses);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const expense = await prisma.$transaction(async (tx) => {
    const created = await tx.expense.create({
      data: {
        amount: parsed.data.amount,
        date: new Date(parsed.data.date),
        categoryId: parsed.data.categoryId,
        accountId: parsed.data.accountId,
        note: parsed.data.note,
      },
      include: { category: true, account: true },
    });

    await tx.account.update({
      where: { id: parsed.data.accountId },
      data: { balance: { decrement: parsed.data.amount } },
    });

    return created;
  });

  return NextResponse.json(expense, { status: 201 });
}
