import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  amount: z.number().positive().optional(),
  date: z.string().optional(),
  categoryId: z.string().optional(),
  accountId: z.string().optional(),
  note: z.string().optional().nullable(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const income = await prisma.income.findUnique({
    where: { id },
    include: { category: true, account: true },
  });
  if (!income) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(income);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.income.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const income = await prisma.$transaction(async (tx) => {
    if (parsed.data.amount !== undefined && parsed.data.amount !== existing.amount) {
      const diff = parsed.data.amount - existing.amount;
      await tx.account.update({
        where: { id: existing.accountId },
        data: { balance: { increment: diff } },
      });
    }

    return tx.income.update({
      where: { id },
      data: {
        ...parsed.data,
        date: parsed.data.date ? new Date(parsed.data.date) : undefined,
      },
      include: { category: true, account: true },
    });
  });

  return NextResponse.json(income);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await prisma.income.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.account.update({
      where: { id: existing.accountId },
      data: { balance: { decrement: existing.amount } },
    });
    await tx.income.delete({ where: { id } });
  });

  return NextResponse.json({ success: true });
}
