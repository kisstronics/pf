import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).optional(),
  typeId: z.string().optional(),
  currentValue: z.number().optional(),
  valuedAt: z.string().optional(),
  location: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const asset = await prisma.asset.findUnique({ where: { id }, include: { type: true } });
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(asset);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const asset = await prisma.asset.update({
    where: { id },
    data: {
      ...parsed.data,
      valuedAt: parsed.data.valuedAt ? new Date(parsed.data.valuedAt) : undefined,
    },
    include: { type: true },
  });
  return NextResponse.json(asset);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.asset.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
