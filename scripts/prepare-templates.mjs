import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const templatesDir = path.join(root, "prisma", "templates");

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

const DEFAULT_ASSET_TYPES = ["Plot", "Property", "Gold", "Vehicle", "Other"];

const DEFAULT_INCOME_CATEGORIES = [
  { name: "Salary", color: "#22c55e" },
  { name: "Freelance", color: "#3b82f6" },
  { name: "Interest", color: "#8b5cf6" },
  { name: "Dividends", color: "#eab308" },
  { name: "Rental", color: "#f97316" },
  { name: "Other", color: "#6b7280" },
];

async function seedUserTemplate(dbUrl) {
  const prisma = new PrismaClient({
    datasources: { db: { url: dbUrl } },
  });

  try {
    await prisma.accountType.createMany({ data: DEFAULT_ACCOUNT_TYPES });
    await prisma.category.createMany({
      data: [
        ...DEFAULT_EXPENSE_CATEGORIES.map((c) => ({ ...c, type: "expense" })),
        ...DEFAULT_INCOME_CATEGORIES.map((c) => ({ ...c, type: "income" })),
      ],
    });
    await prisma.assetType.createMany({
      data: DEFAULT_ASSET_TYPES.map((name) => ({ name })),
    });
    await prisma.appSetting.upsert({
      where: { key: "currency" },
      create: { key: "currency", value: "INR" },
      update: { value: "INR" },
    });
  } finally {
    await prisma.$disconnect();
  }
}

function pushSchema(schemaPath, databaseUrl, extraEnv = {}) {
  if (fs.existsSync(databaseUrl.replace("file:", ""))) {
    fs.unlinkSync(databaseUrl.replace("file:", ""));
  }

  execSync(`npx prisma db push --schema=${schemaPath} --skip-generate`, {
    env: { ...process.env, DATABASE_URL: databaseUrl, ...extraEnv },
    cwd: root,
    stdio: "inherit",
  });
}

async function main() {
  fs.mkdirSync(templatesDir, { recursive: true });

  const userTemplate = path.join(templatesDir, "user-template.db");
  const registryTemplate = path.join(templatesDir, "registry-template.db");
  const userUrl = `file:${userTemplate}`;
  const registryUrl = `file:${registryTemplate}`;

  console.log("Creating user database template...");
  pushSchema("prisma/schema.prisma", userUrl);
  await seedUserTemplate(userUrl);

  console.log("Creating registry database template...");
  execSync("npx prisma db push --schema=prisma/schema-registry.prisma --skip-generate", {
    env: { ...process.env, REGISTRY_DATABASE_URL: registryUrl },
    cwd: root,
    stdio: "inherit",
  });

  console.log("Database templates ready in prisma/templates/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
