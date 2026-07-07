import { prisma } from "./prisma";
import { getNetWorthExclusions, type NetWorthCategoryKey } from "./networth-settings";

export interface NetWorthSnapshot {
  total: number;
  assets: number;
  liabilities: number;
  excluded: NetWorthCategoryKey[];
  breakdown: {
    accounts: number;
    assets: number;
    nps: number;
    epf: number;
    investments: number;
    loans: number;
    creditCards: number;
    overdraft: number;
  };
}

export async function calculateNetWorth(): Promise<NetWorthSnapshot> {
  const exclusions = await getNetWorthExclusions();
  const excluded = new Set(exclusions);

  const [
    accounts,
    assets,
    npsAccounts,
    epfAccounts,
    investments,
    loans,
    creditCards,
    overdraftAccounts,
  ] = await Promise.all([
    prisma.account.findMany(),
    prisma.asset.findMany(),
    prisma.npsAccount.findMany(),
    prisma.epfAccount.findMany(),
    prisma.investment.findMany(),
    prisma.loan.findMany(),
    prisma.creditCard.findMany(),
    prisma.overdraftAccount.findMany(),
  ]);

  const breakdown = {
    accounts: accounts.reduce((sum, a) => sum + a.balance, 0),
    assets: assets.reduce((sum, a) => sum + a.currentValue, 0),
    nps: npsAccounts.reduce((sum, a) => sum + a.balance, 0),
    epf: epfAccounts.reduce(
      (sum, a) => sum + a.employeeBalance + a.employerBalance,
      0
    ),
    investments: investments.reduce((sum, i) => sum + i.currentValue, 0),
    loans: loans.reduce((sum, l) => sum + l.outstandingBalance, 0),
    creditCards: creditCards.reduce((sum, c) => sum + c.outstandingBalance, 0),
    overdraft: overdraftAccounts.reduce((sum, o) => sum + o.utilizedAmount, 0),
  };

  const assetsGrandTotal =
    (excluded.has("accounts") ? 0 : breakdown.accounts) +
    (excluded.has("assets") ? 0 : breakdown.assets) +
    (excluded.has("nps") ? 0 : breakdown.nps) +
    (excluded.has("epf") ? 0 : breakdown.epf) +
    (excluded.has("investments") ? 0 : breakdown.investments);

  const liabilitiesTotal =
    (excluded.has("loans") ? 0 : breakdown.loans) +
    (excluded.has("creditCards") ? 0 : breakdown.creditCards) +
    (excluded.has("overdraft") ? 0 : breakdown.overdraft);

  return {
    total: assetsGrandTotal - liabilitiesTotal,
    assets: assetsGrandTotal,
    liabilities: liabilitiesTotal,
    excluded: exclusions,
    breakdown,
  };
}
