import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const items = await prisma.category.findMany({
    where: { type: "income" },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const item = await prisma.category.create({
    data: {
      name: parsed.data.name,
      type: "income",
      color: parsed.data.color || "#22c55e",
      isActive: parsed.data.isActive ?? true,
    },
  });
  return NextResponse.json(item, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...rest } = body as { id: string; name?: string; color?: string; isActive?: boolean };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const item = await prisma.category.update({ where: { id }, data: rest });
  return NextResponse.json(item);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
