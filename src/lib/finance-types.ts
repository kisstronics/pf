export const INVESTMENT_TYPES = ["stock", "mutual_fund", "cash"] as const;
export type InvestmentType = (typeof INVESTMENT_TYPES)[number];

export const INVESTMENT_TYPE_LABELS: Record<InvestmentType, string> = {
  stock: "Stock",
  mutual_fund: "Mutual Funds",
  cash: "Cash",
};

export const LOAN_TYPES = ["home", "personal", "car", "gold", "other"] as const;
export type LoanType = (typeof LOAN_TYPES)[number];

export const LOAN_TYPE_LABELS: Record<LoanType, string> = {
  home: "Home Loan",
  personal: "Personal Loan",
  car: "Car Loan",
  gold: "Gold Loan",
  other: "Other",
};

export const LOAN_TYPE_TAB_LABELS: Record<LoanType, string> = {
  home: "Home",
  personal: "Personal",
  car: "Car",
  gold: "Gold",
  other: "Other",
};

export function formatInvestmentType(type: string): string {
  return INVESTMENT_TYPE_LABELS[type as InvestmentType] ?? type;
}

export function formatLoanType(type: string): string {
  return LOAN_TYPE_LABELS[type as LoanType] ?? type;
}
