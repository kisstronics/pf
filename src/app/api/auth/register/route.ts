import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateTotpSetup, getUserByUsername, verifyTotpCode } from "@/lib/auth";
import { getRegistryPrisma } from "@/lib/registry-prisma";
import { createUserDatabase, ensureUserDatabase } from "@/lib/user-db";
import { getSession } from "@/lib/session";

const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/, "Username may only contain letters, numbers, and underscores"),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
});

export async function POST(request: NextRequest) {
  try {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const username = parsed.data.username.toLowerCase().trim();
  const email = parsed.data.email.toLowerCase().trim();
  const { phone } = parsed.data;

  const existing = await (await getRegistryPrisma()).user.findFirst({
    where: { OR: [{ username }, { email }] },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Username or email is already registered" },
      { status: 409 }
    );
  }

  const { secret, qrCode } = await generateTotpSetup(username);

  const user = await (await getRegistryPrisma()).user.create({
    data: {
      username,
      email,
      phone,
      totpSecret: secret,
      totpEnabled: false,
    },
  });

  await createUserDatabase(user.id);

  return NextResponse.json({
    userId: user.id,
    username: user.username,
    qrCode,
    secret,
  });
  } catch (err) {
    console.error("auth/register POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Registration failed" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { userId, token, secret } = body as {
    userId?: string;
    token?: string;
    secret?: string;
  };

  if (!userId || !token || !secret || token.length !== 6) {
    return NextResponse.json({ error: "Invalid registration data" }, { status: 400 });
  }

  const user = await (await getRegistryPrisma()).user.findUnique({ where: { id: userId } });
  if (!user || user.totpEnabled) {
    return NextResponse.json({ error: "Invalid registration session" }, { status: 400 });
  }

  if (user.totpSecret !== secret) {
    return NextResponse.json({ error: "Invalid registration session" }, { status: 400 });
  }

  const valid = await verifyTotpCode(secret, token);
  if (!valid) {
    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  }

  await (await getRegistryPrisma()).user.update({
    where: { id: userId },
    data: { totpEnabled: true },
  });

  await ensureUserDatabase(userId);

  const session = await getSession();
  session.isLoggedIn = true;
  session.userId = userId;
  await session.save();

  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { username, token } = body as { username?: string; token?: string };

  if (!username || !token || token.length !== 6) {
    return NextResponse.json({ error: "Username and 6-digit code required" }, { status: 400 });
  }

  const user = await getUserByUsername(username);
  if (!user?.totpSecret || !user.totpEnabled) {
    return NextResponse.json({ error: "Account not found or not set up" }, { status: 401 });
  }

  const valid = await verifyTotpCode(user.totpSecret, token);
  if (!valid) {
    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  }

  await ensureUserDatabase(user.id);

  const session = await getSession();
  session.isLoggedIn = true;
  session.userId = user.id;
  await session.save();

  return NextResponse.json({ success: true, username: user.username });
}
