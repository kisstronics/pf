import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LOAN_TYPES } from "@/lib/finance-types";
import { z } from "zod";

const schema = z.object({
  type: z.enum(LOAN_TYPES),
  lender: z.string().min(1),
  principal: z.number(),
  outstandingBalance: z.number(),
  interestRate: z.number().default(0),
  emi: z.number().default(0),
  startDate: z.string(),
  endDate: z.string().optional().nullable(),
  note: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const loans = await prisma.loan.findMany({
    where: type ? { type } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(loans);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const loan = await prisma.loan.create({
    data: {
      ...parsed.data,
      startDate: new Date(parsed.data.startDate),
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
    },
  });
  return NextResponse.json(loan, { status: 201 });
}
