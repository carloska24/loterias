-- AlterTable
ALTER TABLE "Result" ADD COLUMN "accumulated" BOOLEAN DEFAULT false;
ALTER TABLE "Result" ADD COLUMN "nextDrawDate" TEXT;
ALTER TABLE "Result" ADD COLUMN "nextPrize" REAL DEFAULT 0;
