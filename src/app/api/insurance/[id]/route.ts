import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  provider: z.string().optional(),
  policyNumber: z.string().optional(),
  type: z.string().optional(),
  premium: z.number().optional(),
  frequency: z.string().optional(),
  coverage: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = await getDb();
  const { id } = await params;
  const policy = await prisma.insurancePolicy.findUnique({ where: { id } });
  if (!policy) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(policy);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = await getDb();
  const { id } = await params;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const policy = await prisma.insurancePolicy.update({
    where: { id },
    data: {
      ...parsed.data,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : parsed.data.endDate === null ? null : undefined,
    },
  });
  return NextResponse.json(policy);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = await getDb();
  const { id } = await params;
  await prisma.insurancePolicy.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
