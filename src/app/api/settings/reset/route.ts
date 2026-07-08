import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getDb } from "@/lib/db";
import { seedDefaults } from "@/lib/seed";

type ResetScope = "transactions_accounts" | "factory";

async function clearTransactionsAndAccounts(prisma: PrismaClient) {
  await prisma.transaction.deleteMany();
  await prisma.account.deleteMany();
}

async function factoryReset(prisma: PrismaClient) {
  await prisma.transaction.deleteMany();
  await prisma.account.deleteMany();
  await prisma.category.deleteMany();
  await prisma.accountType.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.assetType.deleteMany();
  await prisma.npsAccount.deleteMany();
  await prisma.epfAccount.deleteMany();
  await prisma.insurancePolicy.deleteMany();
  await prisma.termPolicy.deleteMany();
  await prisma.investment.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.creditCard.deleteMany();
  await prisma.overdraftAccount.deleteMany();
  await prisma.appSetting.deleteMany();

  await seedDefaults(prisma);
}

export async function POST(request: NextRequest) {
  const prisma = await getDb();
  const body = await request.json().catch(() => ({}));
  const scope = (body as { scope?: ResetScope }).scope;

  if (scope !== "transactions_accounts" && scope !== "factory") {
    return NextResponse.json(
      { error: "scope must be 'transactions_accounts' or 'factory'" },
      { status: 400 }
    );
  }

  if (scope === "transactions_accounts") {
    await clearTransactionsAndAccounts(prisma);
    return NextResponse.json({ success: true, scope });
  }

  await factoryReset(prisma);
  return NextResponse.json({ success: true, scope });
}
