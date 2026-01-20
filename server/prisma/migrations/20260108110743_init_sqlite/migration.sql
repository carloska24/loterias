-- CreateTable
CREATE TABLE "Lottery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "totalNumbers" INTEGER NOT NULL,
    "gameNumbers" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Result" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lotteryId" TEXT NOT NULL,
    "contestNumber" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "numbers" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Result_lotteryId_fkey" FOREIGN KEY ("lotteryId") REFERENCES "Lottery" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Lottery_name_key" ON "Lottery"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Lottery_slug_key" ON "Lottery"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Result_lotteryId_contestNumber_key" ON "Result"("lotteryId", "contestNumber");
