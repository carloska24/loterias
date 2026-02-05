import type { FastifyInstance } from 'fastify';
import { importHistoricalData, prisma } from '../services/loteriasApi.js';

export async function lotteryRoutes(server: FastifyInstance) {
  server.post('/import/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };

    // Configurações básicas padrão para as principais
    // Idealmente isso estaria num config ou DB
    let name = '';
    let total = 0;
    let game = 0;

    switch (slug) {
      case 'megasena':
      case 'mega-sena':
        name = 'Mega-Sena';
        total = 60;
        game = 6;
        break;
      case 'lotofacil':
        name = 'Lotofácil';
        total = 25;
        game = 15;
        break;
      case 'lotomania':
        name = 'Lotomania';
        total = 100;
        game = 50; // Dezenas na aposta padrão (apesar de sortear 20)
        break;
      case 'quina':
        name = 'Quina';
        total = 80;
        game = 5;
        break;
      default:
        return reply.status(400).send({ error: 'Loteria desconhecida ou não configurada auto.' });
    }

    // Force Update: Remove o último resultado para garantir atualização de prêmios
    try {
      const lottery = await prisma.lottery.findUnique({ where: { slug } });
      if (lottery) {
        const lastResult = await prisma.result.findFirst({
          where: { lotteryId: lottery.id },
          orderBy: { contestNumber: 'desc' },
        });

        if (lastResult) {
          console.log(
            `[Force Update] Removendo conc. ${lastResult.contestNumber} da ${name} para atualizar...`
          );
          await prisma.result.delete({ where: { id: lastResult.id } });
        }
      }
    } catch (err) {
      console.error('Erro ao tentar forçar atualização:', err);
    }

    // Await processing to provide feedback
    try {
      await importHistoricalData(slug, name, total, game);
      return { message: `Base de dados de ${name} atualizada com sucesso.` };
    } catch (err) {
      console.error('Erro import:', err);
      return reply.status(500).send({ error: 'Falha ao atualizar base de dados.' });
    }
  });

  server.get('/last-result/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };

    try {
      const lottery = await prisma.lottery.findUnique({
        where: { slug },
      });

      if (!lottery) return reply.status(404).send({ error: 'Loteria não encontrada' });

      const lastResult = await prisma.result.findFirst({
        where: { lotteryId: lottery.id },
        orderBy: { contestNumber: 'desc' },
      });

      return lastResult;
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ error: 'Erro ao buscar último resultado' });
    }
  });

  server.get('/health', async () => {
    return { status: 'ok' };
  });
}
