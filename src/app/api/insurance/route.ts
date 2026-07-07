import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  provider: z.string().min(1),
  policyNumber: z.string().min(1),
  type: z.string().min(1),
  premium: z.number(),
  frequency: z.string().default("yearly"),
  coverage: z.number(),
  startDate: z.string(),
  endDate: z.string().optional().nullable(),
  note: z.string().optional(),
});

export async function GET() {
  const policies = await prisma.insurancePolicy.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(policies);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const policy = await prisma.insurancePolicy.create({
    data: {
      ...parsed.data,
      startDate: new Date(parsed.data.startDate),
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
    },
  });
  return NextResponse.json(policy, { status: 201 });
}
