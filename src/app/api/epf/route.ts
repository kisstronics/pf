import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  uan: z.string().min(1),
  employeeBalance: z.number().default(0),
  employerBalance: z.number().default(0),
  note: z.string().optional(),
});

export async function GET() {
  const accounts = await prisma.epfAccount.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(accounts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const account = await prisma.epfAccount.create({ data: parsed.data });
  return NextResponse.json(account, { status: 201 });
}
