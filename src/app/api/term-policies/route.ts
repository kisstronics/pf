import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  provider: z.string().min(1),
  policyNumber: z.string().min(1),
  premium: z.number(),
  frequency: z.string().default("yearly"),
  sumAssured: z.number(),
  startDate: z.string(),
  endDate: z.string().optional().nullable(),
  note: z.string().optional(),
});

export async function GET() {
  const prisma = await getDb();
  const policies = await prisma.termPolicy.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(policies);
}

export async function POST(request: NextRequest) {
  const prisma = await getDb();
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const policy = await prisma.termPolicy.create({
    data: {
      ...parsed.data,
      startDate: new Date(parsed.data.startDate),
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
    },
  });
  return NextResponse.json(policy, { status: 201 });
}
