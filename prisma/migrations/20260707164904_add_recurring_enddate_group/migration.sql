-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "endDate" DATETIME;
ALTER TABLE "Transaction" ADD COLUMN "recurringGroupId" TEXT;

-- CreateIndex
CREATE INDEX "Transaction_recurringGroupId_idx" ON "Transaction"("recurringGroupId");
