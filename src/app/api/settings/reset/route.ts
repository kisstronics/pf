import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seedDefaults } from "@/lib/seed";

type ResetScope = "transactions_accounts" | "factory";

// Clears transactions then accounts (transactions reference accounts).
async function clearTransactionsAndAccounts() {
  await prisma.transaction.deleteMany();
  await prisma.account.deleteMany();
}

// Wipes all financial data + settings, then reseeds defaults.
// The User (TOTP credentials) is intentionally preserved so the user stays
// logged in and doesn't have to re-run authenticator setup.
async function factoryReset() {
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
  const body = await request.json().catch(() => ({}));
  const scope = (body as { scope?: ResetScope }).scope;

  if (scope !== "transactions_accounts" && scope !== "factory") {
    return NextResponse.json(
      { error: "scope must be 'transactions_accounts' or 'factory'" },
      { status: 400 }
    );
  }

  if (scope === "transactions_accounts") {
    await clearTransactionsAndAccounts();
    return NextResponse.json({ success: true, scope });
  }

  await factoryReset();
  return NextResponse.json({ success: true, scope });
}
