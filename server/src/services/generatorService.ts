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
        // Removing take: 100 to analyze ALL history as requested
      },
    },
  });

  if (!lottery) {
    throw new Error('Loteria não encontrada');
  }

  const historyNumbers = lottery.results.map(r => JSON.parse(r.numbers));
  const historyWithContest = lottery.results.map(r => ({
    contextNumber: r.contestNumber,
    numbers: JSON.parse(r.numbers),
  }));
  const latestContest = lottery.results[0]?.contestNumber || 0;

  // 2. Calculate Stats
  const frequencyMap = calculateFrequency(historyNumbers, lottery.totalNumbers);
  const delayMap = calculateDelay(historyWithContest, lottery.totalNumbers, latestContest);

  // Normalize scores to 0-1 range to handle different scales (freq vs delay)
  const maxFreq = Math.max(...frequencyMap.values()) || 1;
  const maxDelay = Math.max(...delayMap.values()) || 1;

  // 3. Score candidates
  const candidates: { number: number; score: number }[] = [];

  for (let i = 1; i <= lottery.totalNumbers; i++) {
    const freq = frequencyMap.get(i) || 0;
    const delay = delayMap.get(i) || 0;

    const normFreq = freq / maxFreq;
    const normDelay = delay / maxDelay;

    let score = 0;

    // Improved Scoring Strategy with Normalization
    switch (strategy) {
      case 'frequency':
        // Favor High Frequency, Slight penalty for very low delay (repeated immediately)
        score = normFreq * 0.8 + normDelay * 0.2;
        break;
      case 'delay':
        // Favor High Delay, but keep some frequency weight to avoid numbers that NEVER come out
        score = normDelay * 0.8 + normFreq * 0.2;
        break;
      case 'balanced':
      default:
        // Balanced mix of Hot and Due numbers
        // We want numbers that appear often (Hot) AND are due (Delay)
        score = normFreq * 0.5 + normDelay * 0.5;
        break;
    }

    candidates.push({ number: i, score });
  }

  // 4. Select Numbers based on Weighted Randomness
  const games: number[][] = [];

  for (let g = 0; g < numberOfGames; g++) {
    const gameNumbers: number[] = [];
    const pool = [...candidates]; // Copy

    while (gameNumbers.length < lottery.gameNumbers && pool.length > 0) {
      // Sort by score
      pool.sort((a, b) => b.score - a.score);

      // Take from top N (e.g., top 25% best scores) for better intelligence but some randomness
      const topN = Math.max(5, Math.floor(pool.length * 0.25));
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
    basedOn: `Total de ${lottery.results.length} concursos analisados`,
    games,
  };
};
