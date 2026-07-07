import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  bank: z.string().min(1),
  lastFourDigits: z.string().optional(),
  creditLimit: z.number().default(0),
  outstandingBalance: z.number().default(0),
  statementDay: z.number().optional(),
  dueDay: z.number().optional(),
  note: z.string().optional(),
});

export async function GET() {
  const cards = await prisma.creditCard.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(cards);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const card = await prisma.creditCard.create({ data: parsed.data });
  return NextResponse.json(card, { status: 201 });
}
