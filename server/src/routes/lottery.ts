import type { FastifyInstance } from 'fastify';
import { importHistoricalData } from '../services/loteriasApi.js';

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
        game = 20; // Sorteados
        break;
      case 'quina':
        name = 'Quina';
        total = 80;
        game = 5;
        break;
      default:
        return reply.status(400).send({ error: 'Loteria desconhecida ou não configurada auto.' });
    }

    // Async processing to not block
    importHistoricalData(slug, name, total, game).catch(err => {
      console.error('Erro background import:', err);
    });

    return { message: `Importação iniciada para ${name}` };
  });

  server.get('/health', async () => {
    return { status: 'ok' };
  });
}
