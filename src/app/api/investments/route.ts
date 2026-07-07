import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  type: z.enum(["stock", "mutual_fund"]),
  name: z.string().min(1),
  symbol: z.string().optional(),
  units: z.number().default(0),
  investedAmount: z.number().default(0),
  currentValue: z.number().default(0),
  platform: z.string().optional(),
  note: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const investments = await prisma.investment.findMany({
    where: type ? { type } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(investments);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const investment = await prisma.investment.create({ data: parsed.data });
  return NextResponse.json(investment, { status: 201 });
}
