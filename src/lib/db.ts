import "server-only";

import { PrismaClient } from "@prisma/client";
import { getSession } from "./session";
import { ensureUserDatabase, getUserPrisma } from "./user-db";

export async function getDb(): Promise<PrismaClient> {
  const session = await getSession();
  if (!session.userId) {
    throw new Error("Unauthorized");
  }
  await ensureUserDatabase(session.userId);
  return getUserPrisma(session.userId);
}

export async function getDbForUser(userId: string): Promise<PrismaClient> {
  await ensureUserDatabase(userId);
  return getUserPrisma(userId);
}
