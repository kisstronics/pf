# Personal Finance Tracker

A local-first personal expense and net worth tracker built with Next.js, SQLite, and TOTP authentication.

## Features

- **TOTP login** — Secure access with Google Authenticator, Authy, or similar apps
- **Expenses** — Add, list, and summarize spending by day, week, month, or year
- **Income** — Track salary, freelance, dividends, and other income
- **Projection** — Forecast net worth and zero-recovery date based on monthly cash flow
- **Accounts** — Bank accounts, cash wallets, credit cards, and more
- **Assets** — Track plots, properties, gold, vehicles, and other assets
- **Investments** — Stocks and mutual funds with gain/loss tracking
- **Loans** — Home, personal, car, and other loans with EMI tracking
- **Credit Cards** — Limits, outstanding balances, and due dates
- **Overdraft** — Overdraft limits and utilization
- **NPS & EPF** — Manage retirement account balances
- **Insurance** — Health, life, motor, and other insurance policies
- **Term Policies** — Term life insurance with sum assured tracking
- **Net Worth** — Dashboard view of total wealth across all holdings
- **Settings** — Configure account types, expense categories, and asset types

## Prerequisites

- Node.js 18+
- npm

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment file and set a secure session secret:

```bash
cp .env.example .env
```

Edit `.env` and set `SESSION_SECRET` to a random string of at least 32 characters.

3. Run database migrations:

```bash
npx prisma migrate dev
```

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

On first visit, you'll be guided through TOTP setup. Scan the QR code with your authenticator app, then enter a code to confirm.

## API Endpoints

| Endpoint | Methods | Description |
|---|---|---|
| `/api/auth/setup` | POST | Generate TOTP secret and QR code |
| `/api/auth/verify` | POST | Verify TOTP and create session |
| `/api/auth/logout` | POST | End session |
| `/api/expenses` | GET, POST | List/create expenses |
| `/api/income` | GET, POST | List/create income |
| `/api/income/summary` | GET | Income totals by category |
| `/api/projection` | GET | Net worth projection (`?targetDate=YYYY-MM-DD`) |
| `/api/expenses/summary` | GET | Expense totals by category |
| `/api/accounts` | GET, POST | List/create accounts |
| `/api/assets` | GET, POST | List/create assets |
| `/api/investments` | GET, POST | Stocks and mutual funds |
| `/api/loans` | GET, POST | Home and other loans |
| `/api/credit-cards` | GET, POST | Credit card accounts |
| `/api/overdraft` | GET, POST | Overdraft accounts |
| `/api/nps` | GET, POST | NPS accounts |
| `/api/epf` | GET, POST | EPF accounts |
| `/api/insurance` | GET, POST | Insurance policies |
| `/api/term-policies` | GET, POST | Term policies |
| `/api/networth` | GET | Net worth snapshot |
| `/api/settings/*` | GET, POST, PUT, DELETE | Configure types and categories |

## Tech Stack

- Next.js 15 (App Router, TypeScript)
- Prisma + SQLite
- TOTP (otplib) + iron-session
- Tailwind CSS
- Recharts

## Scripts

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run db:migrate` — Run Prisma migrations
- `npm run db:studio` — Open Prisma Studio
