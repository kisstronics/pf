import "server-only";

import { PrismaClient } from "@/generated/registry";
import { getRegistryDbUrl } from "./data-dir";
import { ensureRegistryDatabase } from "./registry-db";

const globalForRegistry = globalThis as unknown as { registryPrisma?: PrismaClient };

export async function getRegistryPrisma(): Promise<PrismaClient> {
  await ensureRegistryDatabase();

  if (!globalForRegistry.registryPrisma) {
    globalForRegistry.registryPrisma = new PrismaClient({
      datasources: { db: { url: getRegistryDbUrl() } },
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

  return globalForRegistry.registryPrisma;
}
