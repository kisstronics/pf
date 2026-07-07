import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  typeId: z.string().min(1),
  balance: z.number().default(0),
  currency: z.string().default("INR"),
});

export async function GET() {
  const accounts = await prisma.account.findMany({
    include: { type: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(accounts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const account = await prisma.account.create({ data: parsed.data, include: { type: true } });
  return NextResponse.json(account, { status: 201 });
}
