import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  name: z.string().optional(),
  bank: z.string().optional(),
  lastFourDigits: z.string().optional().nullable(),
  creditLimit: z.number().optional(),
  outstandingBalance: z.number().optional(),
  statementDay: z.number().optional().nullable(),
  dueDay: z.number().optional().nullable(),
  note: z.string().optional().nullable(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = await getDb();
  const { id } = await params;
  const card = await prisma.creditCard.findUnique({ where: { id } });
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(card);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = await getDb();
  const { id } = await params;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const card = await prisma.creditCard.update({ where: { id }, data: parsed.data });
  return NextResponse.json(card);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = await getDb();
  const { id } = await params;
  await prisma.creditCard.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
