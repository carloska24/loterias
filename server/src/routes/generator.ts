import type { FastifyInstance } from 'fastify';
import { generateGames } from '../services/generatorService.js';

export async function generatorRoutes(server: FastifyInstance) {
  server.post('/generate', async (request, reply) => {
    const { lotterySlug, numberOfGames, strategy } = request.body as {
      lotterySlug: string;
      numberOfGames: number;
      strategy: 'balanced' | 'frequency' | 'delay';
    };

    if (!lotterySlug) {
      return reply.status(400).send({ error: 'lotterySlug é obrigatório' });
    }

    try {
      const result = await generateGames({
        lotterySlug,
        numberOfGames: numberOfGames || 3,
        strategy: strategy || 'balanced',
      });
      return result;
    } catch (error) {
      console.error(error);
      return reply
        .status(500)
        .send({ error: 'Erro ao gerar jogos. Verifique se há dados históricos.' });
    }
  });
}
