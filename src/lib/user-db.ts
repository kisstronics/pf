import "server-only";

import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { getDataDir, getTemplatePath, getUsersDir } from "./data-dir";
import { seedDefaults } from "./seed";

const verifiedUsers = new Set<string>();
const clientCache = new Map<string, PrismaClient>();

export function getUserDbPath(userId: string): string {
  return path.join(getUsersDir(), `${userId}.db`);
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
  fs.mkdirSync(getUsersDir(), { recursive: true });

  const dbPath = getUserDbPath(userId);
  disconnectUserPrisma(userId);
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  const template = getTemplatePath("user");
  if (!fs.existsSync(template)) {
    throw new Error(
      "User database template is missing. Redeploy the app so build templates are generated."
    );
  }

  fs.copyFileSync(template, dbPath);

  const prisma = getUserPrisma(userId);
  verifiedUsers.add(userId);
}

export async function ensureUserDatabase(userId: string): Promise<void> {
  if (verifiedUsers.has(userId)) return;

  fs.mkdirSync(getDataDir(), { recursive: true });
  fs.mkdirSync(getUsersDir(), { recursive: true });

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
