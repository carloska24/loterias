import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const lotteries = await prisma.lottery.findMany({
    include: { _count: { select: { results: true } } },
  });
  console.log('Lotteries db:', lotteries);
}
main().finally(() => prisma.$disconnect());
