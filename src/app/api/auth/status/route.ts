import { NextResponse } from "next/server";
import { hasAnyUser } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { registryPrisma } from "@/lib/registry-prisma";

export async function GET() {
  const hasUsers = await hasAnyUser();
  const session = await getSession();

  let user = null;
  if (session.userId) {
    user = await registryPrisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, username: true, email: true, phone: true, totpEnabled: true },
    });
  }

  return NextResponse.json({
    hasUsers,
    isLoggedIn: session.isLoggedIn ?? false,
    user,
  });
}
