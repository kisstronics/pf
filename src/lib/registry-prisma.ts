import "server-only";

import { PrismaClient } from "@/generated/registry";

const globalForRegistry = globalThis as unknown as { registryPrisma: PrismaClient };

export const registryPrisma =
  globalForRegistry.registryPrisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForRegistry.registryPrisma = registryPrisma;
}
