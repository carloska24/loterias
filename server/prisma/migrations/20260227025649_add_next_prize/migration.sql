-- AlterTable
ALTER TABLE "Lottery" ADD COLUMN     "accumulated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nextDate" TIMESTAMP(3),
ADD COLUMN     "nextPrize" DOUBLE PRECISION;
