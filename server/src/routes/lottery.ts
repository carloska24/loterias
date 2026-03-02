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

  server.get('/latest/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const { PrismaClient } = await import('@prisma/client');
    const { importHistoricalData } = await import('../services/loteriasApi.js');
    const prisma = new PrismaClient();

    try {
      const lottery = await prisma.lottery.findUnique({
        where: { slug },
        include: {
          results: {
            orderBy: { contestNumber: 'desc' },
            take: 1,
          },
        },
      });

      if (!lottery || lottery.results.length === 0) {
        return reply.status(404).send({ error: 'Nenhum resultado encontrado.' });
      }

      // Dispara atualização em background silenciosa para manter a base fresca
      importHistoricalData(
        lottery.slug,
        lottery.name,
        lottery.totalNumbers,
        lottery.gameNumbers
      ).catch(err => {
        console.error('Erro no auto-sync de background:', err);
      });

      return lottery.results[0];
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Erro ao buscar resultado.' });
    } finally {
      await prisma.$disconnect();
    }
  });

  server.get('/results/:slug/:contest', async (request, reply) => {
    const { slug, contest } = request.params as { slug: string; contest: string };
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
      const lottery = await prisma.lottery.findUnique({
        where: { slug },
      });

      if (!lottery) return reply.status(404).send({ error: 'Loteria não encontrada.' });

      let result = await prisma.result.findUnique({
        where: {
          lotteryId_contestNumber: {
            lotteryId: lottery.id,
            contestNumber: parseInt(contest, 10),
          },
        },
      });

      if (!result) {
        // Auto-sincronização On-Demand se não existe no banco
        const { fetchResultByConcurso } = await import('../services/loteriasApi.js');
        const apiData = await fetchResultByConcurso(slug, parseInt(contest, 10));

        if (apiData && apiData.dezenas && apiData.dezenas.length > 0) {
          const dateParts = apiData.data ? apiData.data.split('/').map(Number) : [];
          if (dateParts.length >= 3) {
            const [day, month, year] = dateParts;
            const dateObj = new Date(year, month - 1, day);

            result = await prisma.result.create({
              data: {
                lotteryId: lottery.id,
                contestNumber: apiData.concurso,
                date: dateObj,
                numbers: apiData.dezenas.map(Number),
              },
            });
          }
        }
      }

      if (!result) {
        return reply.status(404).send({ error: 'Resultado deste concurso não encontrado.' });
      }

      return result;
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Erro ao buscar resultado do concurso.' });
    } finally {
      await prisma.$disconnect();
    }
  });

  server.get('/results/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const query = request.query as { page?: string; limit?: string };

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
      const lottery = await prisma.lottery.findUnique({
        where: { slug },
      });

      if (!lottery) {
        return reply.status(404).send({ error: 'Loteria não encontrada.' });
      }

      const [results, total] = await Promise.all([
        prisma.result.findMany({
          where: { lotteryId: lottery.id },
          orderBy: { contestNumber: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.result.count({
          where: { lotteryId: lottery.id },
        }),
      ]);

      return {
        data: results,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Erro ao buscar resultados históricos.' });
    } finally {
      await prisma.$disconnect();
    }
  });

  server.get('/latest-prizes', async (request, reply) => {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
      const lotteries = await prisma.lottery.findMany({
        select: {
          slug: true,
          name: true,
          nextPrize: true,
          nextDate: true,
          accumulated: true,
        },
      });
      return lotteries;
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Erro ao buscar dados de prêmios.' });
    } finally {
      await prisma.$disconnect();
    }
  });

  server.get('/stats/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const { PrismaClient } = await import('@prisma/client');
    const { calculateFrequency, calculateDelay, calculateSumStats, calculatePairCooccurrence } =
      await import('../utils/mathUtils.js');
    const prisma = new PrismaClient();

    try {
      const lottery = await prisma.lottery.findUnique({
        where: { slug },
        include: {
          results: { orderBy: { contestNumber: 'desc' }, take: 5000 },
        },
      });

      if (!lottery || lottery.results.length === 0) {
        return reply.status(404).send({ error: 'Dados insuficientes para estatísticas.' });
      }

      const historyNumbers = lottery.results.map(r => r.numbers);
      const historyWithContest = lottery.results.map(r => ({
        contextNumber: r.contestNumber,
        numbers: r.numbers,
      }));
      const latestContest = lottery.results[0]?.contestNumber ?? 0;
      const totalDraws = lottery.results.length;

      const freqMap = calculateFrequency(historyNumbers, lottery.totalNumbers);
      const delayMap = calculateDelay(historyWithContest, lottery.totalNumbers, latestContest);
      const sumStats = calculateSumStats(historyNumbers);
      const topPairs = calculatePairCooccurrence(historyNumbers, 20);

      // Montar array de números com freq+delay para heatmap
      const numbers = Array.from({ length: lottery.totalNumbers }, (_, i) => i + 1).map(n => ({
        number: n,
        frequency: freqMap.get(n) ?? 0,
        frequencyPct: ((freqMap.get(n) ?? 0) / totalDraws) * 100,
        delay: delayMap.get(n) ?? 0,
      }));

      const sorted = [...numbers].sort((a, b) => b.frequency - a.frequency);

      return {
        totalDraws,
        numbers,
        topHot: sorted.slice(0, 10),
        topCold: sorted.slice(-10).reverse(),
        sumStats,
        topPairs,
      };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Erro ao calcular estatísticas.' });
    } finally {
      await prisma.$disconnect();
    }
  });

  server.get('/health', async () => {
    return { status: 'ok' };
  });
}
