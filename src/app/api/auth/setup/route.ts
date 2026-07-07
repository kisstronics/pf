import { NextResponse } from "next/server";
import { generateTotpSetup, isSetupComplete } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const setupComplete = await isSetupComplete();
  if (setupComplete) {
    return NextResponse.json({ error: "Setup already complete" }, { status: 400 });
  }

  const existing = await prisma.user.findFirst();
  const { secret, qrCode } = await generateTotpSetup();

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { totpSecret: secret, totpEnabled: false },
    });
  } else {
    await prisma.user.create({
      data: { totpSecret: secret, totpEnabled: false },
    });
  }

  return NextResponse.json({ qrCode, secret });
}
