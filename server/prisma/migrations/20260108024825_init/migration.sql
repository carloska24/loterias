-- CreateTable
CREATE TABLE "Lottery" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "totalNumbers" INTEGER NOT NULL,
    "gameNumbers" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lottery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "id" TEXT NOT NULL,
    "lotteryId" TEXT NOT NULL,
    "contestNumber" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "numbers" INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lottery_name_key" ON "Lottery"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Lottery_slug_key" ON "Lottery"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Result_lotteryId_contestNumber_key" ON "Result"("lotteryId", "contestNumber");

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_lotteryId_fkey" FOREIGN KEY ("lotteryId") REFERENCES "Lottery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
