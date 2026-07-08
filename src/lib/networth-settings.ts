import "server-only";

import { getDb } from "./db";
import {
  isNetWorthCategoryKey,
  type NetWorthCategoryKey,
} from "./networth-constants";

export {
  NETWORTH_CATEGORY_KEYS,
  NETWORTH_CATEGORY_LABELS,
  isNetWorthCategoryKey,
  isAssetCategory,
  isLiabilityCategory,
  type NetWorthCategoryKey,
} from "./networth-constants";

export const NETWORTH_SETTING_KEY = "networth_exclusions";

export async function getNetWorthExclusions(): Promise<NetWorthCategoryKey[]> {
  const prisma = await getDb();
  const setting = await prisma.appSetting.findUnique({
    where: { key: NETWORTH_SETTING_KEY },
  });
  if (!setting?.value) return [];

  try {
    const parsed = JSON.parse(setting.value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isNetWorthCategoryKey);
  } catch {
    return [];
  }
}

export async function setNetWorthExclusions(exclusions: NetWorthCategoryKey[]): Promise<void> {
  const prisma = await getDb();
  const valid = exclusions.filter(isNetWorthCategoryKey);
  await prisma.appSetting.upsert({
    where: { key: NETWORTH_SETTING_KEY },
    create: { key: NETWORTH_SETTING_KEY, value: JSON.stringify(valid) },
    update: { value: JSON.stringify(valid) },
  });
}
