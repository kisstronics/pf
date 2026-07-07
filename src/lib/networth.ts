import { prisma } from "./prisma";

export interface NetWorthSnapshot {
  total: number;
  assets: number;
  liabilities: number;
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

  const accountsTotal = accounts.reduce((sum, a) => sum + a.balance, 0);
  const assetsTotal = assets.reduce((sum, a) => sum + a.currentValue, 0);
  const npsTotal = npsAccounts.reduce((sum, a) => sum + a.balance, 0);
  const epfTotal = epfAccounts.reduce(
    (sum, a) => sum + a.employeeBalance + a.employerBalance,
    0
  );
  const investmentsTotal = investments.reduce((sum, i) => sum + i.currentValue, 0);
  const loansTotal = loans.reduce((sum, l) => sum + l.outstandingBalance, 0);
  const creditCardsTotal = creditCards.reduce((sum, c) => sum + c.outstandingBalance, 0);
  const overdraftTotal = overdraftAccounts.reduce((sum, o) => sum + o.utilizedAmount, 0);
  const liabilitiesTotal = loansTotal + creditCardsTotal + overdraftTotal;
  const assetsGrandTotal =
    accountsTotal + assetsTotal + npsTotal + epfTotal + investmentsTotal;

  return {
    total: assetsGrandTotal - liabilitiesTotal,
    assets: assetsGrandTotal,
    liabilities: liabilitiesTotal,
    breakdown: {
      accounts: accountsTotal,
      assets: assetsTotal,
      nps: npsTotal,
      epf: epfTotal,
      investments: investmentsTotal,
      loans: loansTotal,
      creditCards: creditCardsTotal,
      overdraft: overdraftTotal,
    },
  };
}
