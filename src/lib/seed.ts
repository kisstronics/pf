const DEFAULT_ACCOUNT_TYPES = [
  { name: "Bank Account", icon: "landmark" },
  { name: "Cash Wallet", icon: "wallet" },
  { name: "Credit Card", icon: "credit-card" },
  { name: "Savings", icon: "piggy-bank" },
  { name: "Overdraft", icon: "minus-circle" },
];

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Food", color: "#f97316" },
  { name: "Transport", color: "#3b82f6" },
  { name: "Utilities", color: "#8b5cf6" },
  { name: "Shopping", color: "#ec4899" },
  { name: "Health", color: "#22c55e" },
  { name: "Entertainment", color: "#eab308" },
  { name: "Other", color: "#6b7280" },
];

const DEFAULT_ASSET_TYPES = [
  "Plot",
  "Property",
  "Gold",
  "Vehicle",
  "Other",
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: "Salary", color: "#22c55e" },
  { name: "Freelance", color: "#3b82f6" },
  { name: "Interest", color: "#8b5cf6" },
  { name: "Dividends", color: "#eab308" },
  { name: "Rental", color: "#f97316" },
  { name: "Other", color: "#6b7280" },
];

export async function seedDefaults(prisma: {
  accountType: { createMany: (args: { data: { name: string; icon: string }[] }) => Promise<unknown> };
  expenseCategory: { createMany: (args: { data: { name: string; color: string }[] }) => Promise<unknown> };
  incomeCategory: { createMany: (args: { data: { name: string; color: string }[] }) => Promise<unknown> };
  assetType: { createMany: (args: { data: { name: string }[] }) => Promise<unknown> };
  appSetting: { upsert: (args: { where: { key: string }; create: { key: string; value: string }; update: { value: string } }) => Promise<unknown> };
}) {
  await prisma.accountType.createMany({ data: DEFAULT_ACCOUNT_TYPES });
  await prisma.expenseCategory.createMany({ data: DEFAULT_EXPENSE_CATEGORIES });
  await prisma.incomeCategory.createMany({ data: DEFAULT_INCOME_CATEGORIES });
  await prisma.assetType.createMany({
    data: DEFAULT_ASSET_TYPES.map((name) => ({ name })),
  });
  await prisma.appSetting.upsert({
    where: { key: "currency" },
    create: { key: "currency", value: "INR" },
    update: { value: "INR" },
  });
}
