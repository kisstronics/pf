import "server-only";

import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import { seedDefaults } from "./seed";

const USERS_DIR = path.join(process.cwd(), "prisma", "users");
const verifiedUsers = new Set<string>();

const clientCache = new Map<string, PrismaClient>();

export function getUserDbPath(userId: string): string {
  return path.join(USERS_DIR, `${userId}.db`);
}

export function getUserDbUrl(userId: string): string {
  return `file:${getUserDbPath(userId)}`;
}

export function getUserPrisma(userId: string): PrismaClient {
  let client = clientCache.get(userId);
  if (!client) {
    client = new PrismaClient({
      datasources: { db: { url: getUserDbUrl(userId) } },
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
    clientCache.set(userId, client);
  }
  return client;
}

export function disconnectUserPrisma(userId: string): void {
  verifiedUsers.delete(userId);
  const client = clientCache.get(userId);
  if (client) {
    client.$disconnect().catch(console.error);
    clientCache.delete(userId);
  }
}

async function hasValidSchema(userId: string): Promise<boolean> {
  const dbPath = getUserDbPath(userId);
  if (!fs.existsSync(dbPath) || fs.statSync(dbPath).size === 0) {
    return false;
  }

  const testClient = new PrismaClient({
    datasources: { db: { url: getUserDbUrl(userId) } },
  });

  try {
    await testClient.$queryRawUnsafe(`SELECT 1 FROM AppSetting LIMIT 1`);
    return true;
  } catch {
    return false;
  } finally {
    await testClient.$disconnect();
  }
}

async function initializeUserDatabase(userId: string): Promise<void> {
  if (!fs.existsSync(USERS_DIR)) {
    fs.mkdirSync(USERS_DIR, { recursive: true });
  }

  const dbPath = getUserDbPath(userId);
  disconnectUserPrisma(userId);
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  execSync("npx prisma db push --schema=prisma/schema.prisma --skip-generate", {
    env: { ...process.env, DATABASE_URL: getUserDbUrl(userId) },
    stdio: "pipe",
    cwd: process.cwd(),
  });

  const prisma = getUserPrisma(userId);
  await seedDefaults(prisma);
  verifiedUsers.add(userId);
}

export async function ensureUserDatabase(userId: string): Promise<void> {
  if (verifiedUsers.has(userId)) return;

  const valid = await hasValidSchema(userId);
  if (!valid) {
    await initializeUserDatabase(userId);
    return;
  }

  const prisma = getUserPrisma(userId);
  const accountTypeCount = await prisma.accountType.count();
  if (accountTypeCount === 0) {
    await seedDefaults(prisma);
  }

  verifiedUsers.add(userId);
}

export async function createUserDatabase(userId: string): Promise<void> {
  await ensureUserDatabase(userId);
}

export async function deleteUserDatabase(userId: string): Promise<void> {
  disconnectUserPrisma(userId);
  const dbPath = getUserDbPath(userId);
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
}

export async function replaceUserDatabase(userId: string, sourceDbPath: string): Promise<void> {
  disconnectUserPrisma(userId);
  fs.copyFileSync(sourceDbPath, getUserDbPath(userId));
  verifiedUsers.add(userId);
}
