import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  bank: z.string().min(1),
  limit: z.number().default(0),
  utilizedAmount: z.number().default(0),
  interestRate: z.number().default(0),
  note: z.string().optional(),
});

export async function GET() {
  const accounts = await prisma.overdraftAccount.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(accounts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const account = await prisma.overdraftAccount.create({ data: parsed.data });
  return NextResponse.json(account, { status: 201 });
}
