import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  type: z.enum(["income", "expense"]).optional(),
  amount: z.number().positive().optional(),
  date: z.string().optional(),
  categoryId: z.string().optional(),
  accountId: z.string().optional(),
  note: z.string().optional().nullable(),
  isRecurring: z.boolean().optional(),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]).nullable().optional(),
});

// Signed impact of a transaction on its account balance.
function signedAmount(type: string, amount: number) {
  return type === "income" ? amount : -amount;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { category: true, account: true },
  });
  if (!transaction) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(transaction);
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

  const existing = await prisma.transaction.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newType = parsed.data.type ?? existing.type;
  const newAmount = parsed.data.amount ?? existing.amount;
  const newAccountId = parsed.data.accountId ?? existing.accountId;
  const newIsRecurring = parsed.data.isRecurring ?? existing.isRecurring;

  const transaction = await prisma.$transaction(async (tx) => {
    // Reverse the previous balance impact, then apply the new one.
    await tx.account.update({
      where: { id: existing.accountId },
      data: { balance: { decrement: signedAmount(existing.type, existing.amount) } },
    });
    await tx.account.update({
      where: { id: newAccountId },
      data: { balance: { increment: signedAmount(newType, newAmount) } },
    });

    return tx.transaction.update({
      where: { id },
      data: {
        type: newType,
        amount: newAmount,
        date: parsed.data.date ? new Date(parsed.data.date) : undefined,
        categoryId: parsed.data.categoryId,
        accountId: newAccountId,
        note: parsed.data.note,
        isRecurring: newIsRecurring,
        frequency: newIsRecurring
          ? parsed.data.frequency ?? existing.frequency
          : null,
      },
      include: { category: true, account: true },
    });
  });

  return NextResponse.json(transaction);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope"); // "group" deletes the whole recurring series

  const existing = await prisma.transaction.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete the entire recurring series and reverse every occurrence's balance impact.
  if (scope === "group" && existing.recurringGroupId) {
    const siblings = await prisma.transaction.findMany({
      where: { recurringGroupId: existing.recurringGroupId },
    });

    await prisma.$transaction(async (tx) => {
      const perAccount = new Map<string, number>();
      for (const s of siblings) {
        perAccount.set(
          s.accountId,
          (perAccount.get(s.accountId) ?? 0) + signedAmount(s.type, s.amount)
        );
      }
      for (const [accountId, delta] of perAccount) {
        await tx.account.update({
          where: { id: accountId },
          data: { balance: { decrement: delta } },
        });
      }
      await tx.transaction.deleteMany({
        where: { recurringGroupId: existing.recurringGroupId },
      });
    });

    return NextResponse.json({ success: true, deleted: siblings.length });
  }

  await prisma.$transaction(async (tx) => {
    await tx.account.update({
      where: { id: existing.accountId },
      data: { balance: { decrement: signedAmount(existing.type, existing.amount) } },
    });
    await tx.transaction.delete({ where: { id } });
  });

  return NextResponse.json({ success: true });
}
