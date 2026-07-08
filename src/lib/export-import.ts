import "server-only";

import { PrismaClient } from "@prisma/client";
import { getDb, getDbForUser } from "./db";

export const EXPORT_VERSION = 1;

type PrismaLike = PrismaClient;

export async function exportUserData(userId?: string) {
  const prisma = userId ? await getDbForUser(userId) : await getDb();

  const [
    appSettings,
    accountTypes,
    categories,
    assetTypes,
    accounts,
    transactions,
    assets,
    npsAccounts,
    epfAccounts,
    insurancePolicies,
    termPolicies,
    investments,
    loans,
    creditCards,
    overdraftAccounts,
  ] = await Promise.all([
    prisma.appSetting.findMany(),
    prisma.accountType.findMany(),
    prisma.category.findMany(),
    prisma.assetType.findMany(),
    prisma.account.findMany(),
    prisma.transaction.findMany(),
    prisma.asset.findMany(),
    prisma.npsAccount.findMany(),
    prisma.epfAccount.findMany(),
    prisma.insurancePolicy.findMany(),
    prisma.termPolicy.findMany(),
    prisma.investment.findMany(),
    prisma.loan.findMany(),
    prisma.creditCard.findMany(),
    prisma.overdraftAccount.findMany(),
  ]);

  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      appSettings,
      accountTypes,
      categories,
      assetTypes,
      accounts,
      transactions,
      assets,
      npsAccounts,
      epfAccounts,
      insurancePolicies,
      termPolicies,
      investments,
      loans,
      creditCards,
      overdraftAccounts,
    },
  };
}

async function clearUserData(prisma: PrismaLike) {
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
}

export async function importUserData(
  payload: {
    version?: number;
    data?: Record<string, unknown[]>;
  },
  userId?: string
) {
  if (!payload.data) {
    throw new Error("Invalid backup file: missing data");
  }

  const prisma = userId ? await getDbForUser(userId) : await getDb();
  const d = payload.data;

  await clearUserData(prisma);

  if (d.accountTypes?.length) {
    await prisma.accountType.createMany({ data: d.accountTypes as never[] });
  }
  if (d.assetTypes?.length) {
    await prisma.assetType.createMany({ data: d.assetTypes as never[] });
  }
  if (d.categories?.length) {
    await prisma.category.createMany({ data: d.categories as never[] });
  }
  if (d.appSettings?.length) {
    await prisma.appSetting.createMany({ data: d.appSettings as never[] });
  }
  if (d.accounts?.length) {
    await prisma.account.createMany({ data: d.accounts as never[] });
  }
  if (d.transactions?.length) {
    await prisma.transaction.createMany({ data: d.transactions as never[] });
  }
  if (d.assets?.length) {
    await prisma.asset.createMany({ data: d.assets as never[] });
  }
  if (d.npsAccounts?.length) {
    await prisma.npsAccount.createMany({ data: d.npsAccounts as never[] });
  }
  if (d.epfAccounts?.length) {
    await prisma.epfAccount.createMany({ data: d.epfAccounts as never[] });
  }
  if (d.insurancePolicies?.length) {
    await prisma.insurancePolicy.createMany({ data: d.insurancePolicies as never[] });
  }
  if (d.termPolicies?.length) {
    await prisma.termPolicy.createMany({ data: d.termPolicies as never[] });
  }
  if (d.investments?.length) {
    await prisma.investment.createMany({ data: d.investments as never[] });
  }
  if (d.loans?.length) {
    await prisma.loan.createMany({ data: d.loans as never[] });
  }
  if (d.creditCards?.length) {
    await prisma.creditCard.createMany({ data: d.creditCards as never[] });
  }
  if (d.overdraftAccounts?.length) {
    await prisma.overdraftAccount.createMany({ data: d.overdraftAccounts as never[] });
  }

  return { success: true };
}
