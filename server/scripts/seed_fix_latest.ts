import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Removendo últimos resultados para forçar atualização...');

  const lotteries = await prisma.lottery.findMany();

  for (const lotus of lotteries) {
    const lastResult = await prisma.result.findFirst({
      where: { lotteryId: lotus.id },
      orderBy: { contestNumber: 'desc' },
    });

    if (lastResult) {
      console.log(
        `Removendo último resultado da ${lotus.name} (Concurso ${lastResult.contestNumber})...`
      );
      await prisma.result.delete({
        where: { id: lastResult.id },
      });
    }
  }

  console.log('Pronto! Agora rode "npm run seed" ou use o botão de atualizar no frontend.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
