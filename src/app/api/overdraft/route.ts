import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
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
  const prisma = await getDb();
  const accounts = await prisma.overdraftAccount.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(accounts);
}

export async function POST(request: NextRequest) {
  const prisma = await getDb();
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const account = await prisma.overdraftAccount.create({ data: parsed.data });
  return NextResponse.json(account, { status: 201 });
}
