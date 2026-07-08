import { NextResponse } from "next/server";
import { hasAnyUser } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { getRegistryPrisma } from "@/lib/registry-prisma";

export async function GET() {
  try {
    const hasUsers = await hasAnyUser();
    const session = await getSession();

    let user = null;
    if (session.userId) {
      const registryPrisma = await getRegistryPrisma();
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
  } catch (err) {
    console.error("auth/status error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server configuration error" },
      { status: 500 }
    );
  }
}
