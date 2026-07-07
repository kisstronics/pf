-- Unify Income/Expense (and their categories) into single Transaction/Category models.
PRAGMA foreign_keys=OFF;

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'expense',
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "categoryId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "note" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "frequency" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Migrate existing category data
INSERT INTO "Category" ("id", "name", "type", "color", "isActive")
SELECT "id", "name", 'income', "color", "isActive" FROM "IncomeCategory";

INSERT INTO "Category" ("id", "name", "type", "color", "isActive")
SELECT "id", "name", 'expense', "color", "isActive" FROM "ExpenseCategory";

-- Migrate existing income/expense entries
INSERT INTO "Transaction" ("id", "type", "amount", "date", "categoryId", "accountId", "note", "isRecurring", "frequency", "createdAt")
SELECT "id", 'income', "amount", "date", "categoryId", "accountId", "note", false, NULL, "createdAt" FROM "Income";

INSERT INTO "Transaction" ("id", "type", "amount", "date", "categoryId", "accountId", "note", "isRecurring", "frequency", "createdAt")
SELECT "id", 'expense', "amount", "date", "categoryId", "accountId", "note", false, NULL, "createdAt" FROM "Expense";

-- Drop old tables (dependents first)
DROP TABLE "Income";
DROP TABLE "Expense";
DROP TABLE "IncomeCategory";
DROP TABLE "ExpenseCategory";

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");
CREATE INDEX "Transaction_date_idx" ON "Transaction"("date");
CREATE INDEX "Transaction_isRecurring_idx" ON "Transaction"("isRecurring");

PRAGMA foreign_keys=ON;
