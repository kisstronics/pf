import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  typeId: z.string().min(1),
  currentValue: z.number(),
  valuedAt: z.string().optional(),
  location: z.string().optional(),
  note: z.string().optional(),
});

export async function GET() {
  const assets = await prisma.asset.findMany({
    include: { type: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(assets);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const asset = await prisma.asset.create({
    data: {
      ...parsed.data,
      valuedAt: parsed.data.valuedAt ? new Date(parsed.data.valuedAt) : new Date(),
    },
    include: { type: true },
  });
  return NextResponse.json(asset, { status: 201 });
}
