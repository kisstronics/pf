import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LOAN_TYPES } from "@/lib/finance-types";
import { z } from "zod";

const schema = z.object({
  type: z.enum(LOAN_TYPES).optional(),
  lender: z.string().optional(),
  principal: z.number().optional(),
  outstandingBalance: z.number().optional(),
  interestRate: z.number().optional(),
  emi: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const loan = await prisma.loan.findUnique({ where: { id } });
  if (!loan) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(loan);
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
  const loan = await prisma.loan.update({
    where: { id },
    data: {
      ...parsed.data,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : parsed.data.endDate === null ? null : undefined,
    },
  });
  return NextResponse.json(loan);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.loan.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
