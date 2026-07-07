import { NextRequest, NextResponse } from "next/server";
import { verifyTotpCode, getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { seedDefaults } from "@/lib/seed";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token, secret, isSetup } = body as {
    token: string;
    secret?: string;
    isSetup?: boolean;
  };

  if (!token || token.length !== 6) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const user = await getUser();

  if (isSetup) {
    if (!secret) {
      return NextResponse.json({ error: "Secret required for setup" }, { status: 400 });
    }
    const valid = await verifyTotpCode(secret, token);
    if (!valid) {
      return NextResponse.json({ error: "Invalid code" }, { status: 401 });
    }

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { totpSecret: secret, totpEnabled: true },
      });
    } else {
      await prisma.user.create({
        data: { totpSecret: secret, totpEnabled: true },
      });
    }

    const accountTypeCount = await prisma.accountType.count();
    if (accountTypeCount === 0) {
      await seedDefaults(prisma);
    }

    const updatedUser = await getUser();
    const session = await getSession();
    session.isLoggedIn = true;
    session.userId = updatedUser?.id;
    await session.save();

    return NextResponse.json({ success: true });
  }

  if (!user?.totpSecret || !user.totpEnabled) {
    return NextResponse.json({ error: "Setup not complete" }, { status: 400 });
  }

  const valid = await verifyTotpCode(user.totpSecret, token);
  if (!valid) {
    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  }

  const session = await getSession();
  session.isLoggedIn = true;
  session.userId = user.id;
  await session.save();

  return NextResponse.json({ success: true });
}
