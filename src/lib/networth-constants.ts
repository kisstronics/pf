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

export function isNetWorthCategoryKey(key: string): key is NetWorthCategoryKey {
  return (NETWORTH_CATEGORY_KEYS as readonly string[]).includes(key);
}

const ASSET_KEYS: NetWorthCategoryKey[] = [
  "accounts",
  "assets",
  "investments",
  "nps",
  "epf",
];

const LIABILITY_KEYS: NetWorthCategoryKey[] = ["loans", "creditCards", "overdraft"];

export function isAssetCategory(key: NetWorthCategoryKey): boolean {
  return ASSET_KEYS.includes(key);
}

export function isLiabilityCategory(key: NetWorthCategoryKey): boolean {
  return LIABILITY_KEYS.includes(key);
}
