import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  name: z.string().optional(),
  bank: z.string().optional(),
  limit: z.number().optional(),
  utilizedAmount: z.number().optional(),
  interestRate: z.number().optional(),
  note: z.string().optional().nullable(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = await getDb();
  const { id } = await params;
  const account = await prisma.overdraftAccount.findUnique({ where: { id } });
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(account);
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
  const account = await prisma.overdraftAccount.update({ where: { id }, data: parsed.data });
  return NextResponse.json(account);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = await getDb();
  const { id } = await params;
  await prisma.overdraftAccount.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
