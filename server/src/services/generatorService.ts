import { PrismaClient } from '@prisma/client';
import {
  calculateFrequency,
  calculateDelay,
  normalizeMap,
  calculateSumStats,
  hasMinRangeCoverage,
  shuffle,
  countEvenOdd,
  calculateSum,
  isValidSequence,
  probabilityAnyPrize,
  hitProbability,
} from '../utils/mathUtils.js';

const prisma = new PrismaClient();

// Acertos mínimos para cada prêmio por loteria
const PRIZE_TIERS: Record<string, { label: string; minHits: number }[]> = {
  megasena: [
    { label: 'Sena (6)', minHits: 6 },
    { label: 'Quina (5)', minHits: 5 },
    { label: 'Quadra (4)', minHits: 4 },
  ],
  lotofacil: [
    { label: '15 acertos', minHits: 15 },
    { label: '14 acertos', minHits: 14 },
    { label: '13 acertos', minHits: 13 },
    { label: '12 acertos', minHits: 12 },
    { label: '11 acertos', minHits: 11 },
  ],
  lotomania: [
    { label: '20 acertos', minHits: 20 },
    { label: '19 acertos', minHits: 19 },
    { label: '18 acertos', minHits: 18 },
    { label: '0 acertos', minHits: 0 },
  ],
  quina: [
    { label: 'Quina (5)', minHits: 5 },
    { label: 'Quadra (4)', minHits: 4 },
    { label: 'Terno (3)', minHits: 3 },
    { label: 'Duque (2)', minHits: 2 },
  ],
};

interface GeneratorConfig {
  lotterySlug: string;
  numberOfGames: number;
  strategy: 'balanced' | 'frequency' | 'delay';
}

export const generateGames = async (config: GeneratorConfig) => {
  const { lotterySlug, numberOfGames, strategy } = config;

  const lottery = await prisma.lottery.findUnique({
    where: { slug: lotterySlug },
    include: {
      results: {
        orderBy: { contestNumber: 'desc' },
        take: 5000,
      },
    },
  });

  if (!lottery) throw new Error('Loteria não encontrada');

  const historyNumbers = lottery.results.map(r => r.numbers);
  const historyWithContest = lottery.results.map(r => ({
    contextNumber: r.contestNumber,
    numbers: r.numbers,
  }));
  const latestContest = lottery.results[0]?.contestNumber || 0;

  // ── Estatísticas Históricas ─────────────────────────────────────────
  const rawFrequency = calculateFrequency(historyNumbers, lottery.totalNumbers);
  const rawDelay = calculateDelay(historyWithContest, lottery.totalNumbers, latestContest);

  // Normalizar para [0,1] antes de combinar — resolve o problema de escala
  const normFreq = normalizeMap(rawFrequency);
  const normDelay = normalizeMap(rawDelay);

  // IQR da soma histórica para filtro de validade
  const sumStats = calculateSumStats(historyNumbers);

  // ── Pontuação por Estratégia (scores normalizados) ──────────────────
  const candidates: { number: number; score: number }[] = [];

  for (let i = 1; i <= lottery.totalNumbers; i++) {
    const freq = normFreq.get(i) ?? 0;
    const delay = normDelay.get(i) ?? 0;

    let score = 0;
    switch (strategy) {
      case 'frequency':
        // Prioriza números mais frequentes
        score = freq * 0.8 + delay * 0.2;
        break;
      case 'delay':
        // Prioriza números mais atrasados (lei dos grandes números)
        score = delay * 0.8 + freq * 0.2;
        break;
      case 'balanced':
      default:
        // Equilibrado: combina os dois com peso igual após normalização
        score = freq * 0.5 + delay * 0.5;
        break;
    }
    candidates.push({ number: i, score });
  }

  // ── Geração com Randomização Ponderada + Filtros ────────────────────
  const games: {
    numbers: number[];
    metrics: { even: number; odd: number; sum: number; sumOk: boolean; rangeOk: boolean };
  }[] = [];

  // Número sorteado efetivamente (Lotomania sorteia 20 de 100, mas o jogo tem 50)
  // gameNumbers = números que o apostador escolhe; drawnNumbers = números sorteados
  const drawnNumbers = lotterySlug === 'lotomania' ? 20 : lottery.gameNumbers;

  let attempts = 0;
  const maxAttempts = numberOfGames * 200;

  while (games.length < numberOfGames && attempts < maxAttempts) {
    attempts++;
    const gameNumbers: number[] = [];
    const pool = [...candidates];

    while (gameNumbers.length < lottery.gameNumbers && pool.length > 0) {
      pool.sort((a, b) => b.score - a.score);
      // Pool de candidatos: top 2× o tamanho do jogo para variedade controlada
      const topN = Math.min(pool.length, lottery.gameNumbers * 2);
      const randomIndex = Math.floor(Math.random() * topN);
      const chosen = pool[randomIndex];
      if (chosen) gameNumbers.push(chosen.number);
      pool.splice(randomIndex, 1);
    }

    const sortedGame = gameNumbers.sort((a, b) => a - b);
    const { even, odd } = countEvenOdd(sortedGame);
    const sum = calculateSum(sortedGame);

    // ── Filtro 1: Não pode ser todo par ou todo ímpar (exceto jogos pequenos)
    if ((even === 0 || odd === 0) && lottery.gameNumbers >= 5) continue;

    // ── Filtro 2: Consecutivos excessivos
    let maxConsecutive = 3;
    if (lottery.gameNumbers >= 15)
      maxConsecutive = Math.max(5, Math.floor(lottery.gameNumbers / 4));
    if (!isValidSequence(sortedGame, maxConsecutive)) continue;

    // ── Filtro 3: Soma dentro do IQR histórico (10th–90th percentil)
    const sumOk = sum >= sumStats.q1 && sum <= sumStats.q3;
    if (!sumOk) continue;

    // ── Filtro 4: Cobertura mínima de faixas
    const rangeOk = hasMinRangeCoverage(sortedGame, lottery.totalNumbers, lottery.gameNumbers);

    games.push({
      numbers: sortedGame,
      metrics: { even, odd, sum, sumOk, rangeOk },
    });
  }

  // ── Probabilidades de Prêmio ────────────────────────────────────────
  const tiers = PRIZE_TIERS[lotterySlug] ?? [];
  const prizeProbabilities = tiers.map(tier => ({
    label: tier.label,
    probability: hitProbability(
      lottery.totalNumbers,
      drawnNumbers,
      lottery.gameNumbers,
      tier.minHits
    ),
    odds: Math.round(
      1 /
        (hitProbability(lottery.totalNumbers, drawnNumbers, lottery.gameNumbers, tier.minHits) || 1)
    ),
  }));

  const probAnyPrize = probabilityAnyPrize(
    lottery.totalNumbers,
    drawnNumbers,
    lottery.gameNumbers,
    tiers.length > 0 ? tiers[tiers.length - 1]!.minHits : 1
  );

  return {
    strategy,
    basedOn: `Últimos ${lottery.results.length} concursos`,
    sumStats,
    probAnyPrize,
    probAnyPrizeOdds: Math.round(1 / (probAnyPrize || 1)),
    prizeProbabilities,
    games,
    attemptsUsed: attempts,
  };
};
