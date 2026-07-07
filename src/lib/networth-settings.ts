import { prisma } from "./prisma";

export const NETWORTH_CATEGORY_KEYS = [
  "accounts",
  "assets",
  "investments",
  "nps",
  "epf",
  "loans",
  "creditCards",
  "overdraft",
] as const;

export type NetWorthCategoryKey = (typeof NETWORTH_CATEGORY_KEYS)[number];

export const NETWORTH_CATEGORY_LABELS: Record<NetWorthCategoryKey, string> = {
  accounts: "Bank Accounts",
  assets: "Physical Assets",
  investments: "Investments",
  nps: "NPS",
  epf: "EPF",
  loans: "Loans",
  creditCards: "Credit Cards",
  overdraft: "Overdraft",
};

export const NETWORTH_SETTING_KEY = "networth_exclusions";

const ASSET_KEYS: NetWorthCategoryKey[] = [
  "accounts",
  "assets",
  "investments",
  "nps",
  "epf",
];

const LIABILITY_KEYS: NetWorthCategoryKey[] = ["loans", "creditCards", "overdraft"];

export function isNetWorthCategoryKey(key: string): key is NetWorthCategoryKey {
  return (NETWORTH_CATEGORY_KEYS as readonly string[]).includes(key);
}

export async function getNetWorthExclusions(): Promise<NetWorthCategoryKey[]> {
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
  const valid = exclusions.filter(isNetWorthCategoryKey);
  await prisma.appSetting.upsert({
    where: { key: NETWORTH_SETTING_KEY },
    create: { key: NETWORTH_SETTING_KEY, value: JSON.stringify(valid) },
    update: { value: JSON.stringify(valid) },
  });
}

export function isAssetCategory(key: NetWorthCategoryKey): boolean {
  return ASSET_KEYS.includes(key);
}

export function isLiabilityCategory(key: NetWorthCategoryKey): boolean {
  return LIABILITY_KEYS.includes(key);
}
