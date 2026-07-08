import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getDb } from "@/lib/db";
import { getDateRange, Period } from "@/lib/period";
import { generateOccurrenceDates, MAX_OCCURRENCES, Frequency } from "@/lib/recurring";
import { z } from "zod";

const createSchema = z
  .object({
    type: z.enum(["income", "expense"]),
    amount: z.number().positive(),
    date: z.string(),
    categoryId: z.string().min(1),
    accountId: z.string().min(1),
    note: z.string().optional(),
    isRecurring: z.boolean().optional(),
    frequency: z.enum(["daily", "weekly", "monthly", "yearly"]).optional(),
    endDate: z.string().optional(),
  })
  .refine((d) => !d.isRecurring || !!d.frequency, {
    message: "Recurring entries require a frequency",
    path: ["frequency"],
  })
  .refine((d) => !d.isRecurring || !!d.endDate, {
    message: "Recurring entries require an end date",
    path: ["endDate"],
  })
  .refine((d) => !d.endDate || new Date(d.endDate) >= new Date(d.date), {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

export async function GET(request: NextRequest) {
  const prisma = await getDb();
  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") || "month") as Period;
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const type = searchParams.get("type"); // "income" | "expense" | null (both)
  const recurring = searchParams.get("recurring"); // "true" | "false" | null
  const limit = searchParams.get("limit");

  const { start, end } = getDateRange(period, date);

  const transactions = await prisma.transaction.findMany({
    where: {
      date: { gte: start, lte: end },
      ...(type === "income" || type === "expense" ? { type } : {}),
      ...(recurring === "true" ? { isRecurring: true } : {}),
      ...(recurring === "false" ? { isRecurring: false } : {}),
    },
    include: { category: true, account: { include: { type: true } } },
    orderBy: { date: "desc" },
    ...(limit ? { take: parseInt(limit) } : {}),
  });

  return NextResponse.json(transactions);
}

export async function POST(request: NextRequest) {
  const prisma = await getDb();
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { type, amount, date, categoryId, accountId, note, isRecurring, frequency, endDate } =
    parsed.data;

  // One-off entry: single row, single balance impact.
  if (!isRecurring || !frequency || !endDate) {
    const transaction = await prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          type,
          amount,
          date: new Date(date),
          categoryId,
          accountId,
          note,
          isRecurring: false,
          frequency: null,
        },
        include: { category: true, account: true },
      });

      await tx.account.update({
        where: { id: accountId },
        data: { balance: type === "income" ? { increment: amount } : { decrement: amount } },
      });

      return created;
    });

    return NextResponse.json(transaction, { status: 201 });
  }

  // Recurring entry: materialize one occurrence per date up to the end date.
  const start = new Date(date);
  const end = new Date(endDate);
  const occurrences = generateOccurrenceDates(start, end, frequency as Frequency);

  if (occurrences.length === 0) {
    return NextResponse.json({ error: "No occurrences in the selected range" }, { status: 400 });
  }
  if (occurrences.length >= MAX_OCCURRENCES) {
    return NextResponse.json(
      { error: `Too many occurrences (max ${MAX_OCCURRENCES}). Shorten the range or use a wider frequency.` },
      { status: 400 }
    );
  }

  const recurringGroupId = randomUUID();

  const result = await prisma.$transaction(async (tx) => {
    await tx.transaction.createMany({
      data: occurrences.map((occDate) => ({
        type,
        amount,
        date: occDate,
        categoryId,
        accountId,
        note,
        isRecurring: true,
        frequency,
        endDate: end,
        recurringGroupId,
      })),
    });

    const totalImpact = amount * occurrences.length;
    await tx.account.update({
      where: { id: accountId },
      data: {
        balance: type === "income" ? { increment: totalImpact } : { decrement: totalImpact },
      },
    });

    return tx.transaction.findFirst({
      where: { recurringGroupId },
      orderBy: { date: "asc" },
      include: { category: true, account: true },
    });
  });

  return NextResponse.json(
    { ...result, occurrencesCreated: occurrences.length, recurringGroupId },
    { status: 201 }
  );
}
