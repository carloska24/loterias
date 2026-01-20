import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Verificando configuração da Lotomania...');

  const lottery = await prisma.lottery.findUnique({
    where: { slug: 'lotomania' },
  });

  if (!lottery) {
    console.log('Lotomania não encontrada no banco de dados.');
    return;
  }

  console.log(`Configuração atual: Total=${lottery.totalNumbers}, Game=${lottery.gameNumbers}`);

  if (lottery.gameNumbers !== 50) {
    console.log('Atualizando para 50 números...');
    const updated = await prisma.lottery.update({
      where: { id: lottery.id },
      data: { gameNumbers: 50 },
    });
    console.log(`Atualizado com sucesso! Novo valor: ${updated.gameNumbers}`);
  } else {
    console.log('Configuração já está correta (50).');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
