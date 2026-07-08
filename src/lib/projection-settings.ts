import "server-only";

import { getDb } from "./db";

export const PROJECTION_EXCLUDE_DEBT_INTEREST_KEY = "projection_exclude_debt_interest";

export async function getExcludeDebtInterest(): Promise<boolean> {
  const prisma = await getDb();
  const setting = await prisma.appSetting.findUnique({
    where: { key: PROJECTION_EXCLUDE_DEBT_INTEREST_KEY },
  });
  return setting?.value === "true";
}

export async function setExcludeDebtInterest(exclude: boolean): Promise<void> {
  const prisma = await getDb();
  await prisma.appSetting.upsert({
    where: { key: PROJECTION_EXCLUDE_DEBT_INTEREST_KEY },
    create: { key: PROJECTION_EXCLUDE_DEBT_INTEREST_KEY, value: String(exclude) },
    update: { value: String(exclude) },
  });
}
