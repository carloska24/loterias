import { PrismaClient } from '@prisma/client';
import { calculateFrequency, calculateDelay, shuffle } from '../utils/mathUtils.js';

const prisma = new PrismaClient();

interface GeneratorConfig {
  lotterySlug: string;
  numberOfGames: number;
  strategy: 'balanced' | 'frequency' | 'delay';
}

export const generateGames = async (config: GeneratorConfig) => {
  const { lotterySlug, numberOfGames, strategy } = config;

  // 1. Fetch Lottery Info and History
  const lottery = await prisma.lottery.findUnique({
    where: { slug: lotterySlug },
    include: {
      results: {
        orderBy: { contestNumber: 'desc' },
        take: 100, // Analyze last 100 games for trend
      },
    },
  });

  if (!lottery) {
    throw new Error('Loteria não encontrada');
  }

  const historyNumbers = lottery.results.map(r => r.numbers);
  const historyWithContest = lottery.results.map(r => ({
    contextNumber: r.contestNumber,
    numbers: r.numbers,
  }));
  const latestContest = lottery.results[0]?.contestNumber || 0;

  // 2. Calculate Stats
  const frequencyMap = calculateFrequency(historyNumbers, lottery.totalNumbers);
  const delayMap = calculateDelay(historyWithContest, lottery.totalNumbers, latestContest);

  // 3. Score candidates
  const candidates: { number: number; score: number }[] = [];

  for (let i = 1; i <= lottery.totalNumbers; i++) {
    const freq = frequencyMap.get(i) || 0;
    const delay = delayMap.get(i) || 0;

    let score = 0;

    // Simple Scoring Strategy
    switch (strategy) {
      case 'frequency':
        // Higher frequency = Higher score
        score = freq * 1.5 + delay * 0.1;
        break;
      case 'delay':
        // Higher delay = Higher score
        score = delay * 2.0 + freq * 0.5;
        break;
      case 'balanced':
      default:
        // Mix: We want numbers that appear often but aren't TOO delayed?
        // Or numbers that handle the "law of large numbers" return to mean?
        // Let's optimize for HOT numbers that recently appeared + COLD numbers due.
        score = freq + delay;
        break;
    }

    candidates.push({ number: i, score });
  }

  // 4. Select Numbers based on Weighted Randomness (or pure top ranking)
  // Pure Top Ranking:
  // candidates.sort((a, b) => b.score - a.score);

  // Weighted Randomness makes it not deterministic (better for gambling feel)
  const games: number[][] = [];

  for (let g = 0; g < numberOfGames; g++) {
    const gameNumbers: number[] = [];
    const pool = [...candidates]; // Copy

    while (gameNumbers.length < lottery.gameNumbers && pool.length > 0) {
      // Sort by score
      pool.sort((a, b) => b.score - a.score);

      // Take from top N (e.g., top 50% best scores) to avoid only picking the same
      // Randomly pick index from top 20 candidates (variable)
      const topN = Math.min(pool.length, lottery.gameNumbers * 2);
      const randomIndex = Math.floor(Math.random() * topN);

      const chosen = pool[randomIndex];
      if (chosen) {
        gameNumbers.push(chosen.number);
      }

      // Remove chosen from pool
      pool.splice(randomIndex, 1);
    }

    // Sort numbers for display
    games.push(gameNumbers.sort((a, b) => a - b));
  }

  return {
    strategy,
    basedOn: `Últimos ${Math.min(100, lottery.results.length)} concursos`,
    games,
  };
};
