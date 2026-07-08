import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  typeId: z.string().min(1),
  balance: z.number().default(0),
  currency: z.string().default("INR"),
});

export async function GET() {
  const prisma = await getDb();
  const accounts = await prisma.account.findMany({
    include: { type: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(accounts);
}

export async function POST(request: NextRequest) {
  const prisma = await getDb();
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const account = await prisma.account.create({ data: parsed.data, include: { type: true } });
  return NextResponse.json(account, { status: 201 });
}
