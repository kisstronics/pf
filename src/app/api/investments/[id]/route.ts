import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { INVESTMENT_TYPES } from "@/lib/finance-types";
import { z } from "zod";

const schema = z.object({
  type: z.enum(INVESTMENT_TYPES).optional(),
  name: z.string().optional(),
  symbol: z.string().optional().nullable(),
  units: z.number().optional(),
  investedAmount: z.number().optional(),
  currentValue: z.number().optional(),
  platform: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const investment = await prisma.investment.findUnique({ where: { id } });
  if (!investment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(investment);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const investment = await prisma.investment.update({ where: { id }, data: parsed.data });
  return NextResponse.json(investment);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.investment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
