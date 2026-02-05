import { PrismaClient } from '@prisma/client';
import {
  calculateFrequency,
  calculateDelay,
  shuffle,
  getParity,
  getSum,
  getQuadrantDistribution,
} from '../utils/mathUtils.js';

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

    switch (strategy) {
      case 'frequency':
        score = normFreq * 0.8 + normDelay * 0.2;
        break;
      case 'delay':
        score = normDelay * 0.8 + normFreq * 0.2;
        break;
      case 'balanced':
      default:
        score = normFreq * 0.5 + normDelay * 0.5;
        break;
    }

    candidates.push({ number: i, score });
  }

  // 4. Select Numbers based on Weighted Randomness and Advanced Patterns
  const games: number[][] = [];
  const maxAttemptsPerGame = 50; // To avoid infinite loops if filters are too strict

  for (let g = 0; g < numberOfGames; g++) {
    let gameNumbers: number[] = [];
    let attempts = 0;
    let isValid = false;

    while (!isValid && attempts < maxAttemptsPerGame) {
      gameNumbers = [];
      const pool = [...candidates];
      attempts++;

      while (gameNumbers.length < lottery.gameNumbers && pool.length > 0) {
        pool.sort((a, b) => b.score - a.score);
        const topN = Math.max(5, Math.floor(pool.length * 0.3)); // Slightly wider top pool
        const randomIndex = Math.floor(Math.random() * topN);
        const chosen = pool[randomIndex];

        if (chosen) {
          gameNumbers.push(chosen.number);
        }
        pool.splice(randomIndex, 1);
      }

      gameNumbers.sort((a, b) => a - b);

      // --- APPLY ADVANCED PATTERNS FILTERS ---

      // 1. Parity Filter (Ideal: 3/3, 4/2, 2/4 for Mega-Sena)
      const { odd, even } = getParity(gameNumbers);
      const isParityBalanced = odd >= 2 && odd <= 4;

      // 2. Sum Filter (Ideal for Mega-Sena 6 numbers: 150 - 220)
      // Range is approximate based on common winning sums
      const sum = getSum(gameNumbers);
      const isSumInRange = sum >= 130 && sum <= 240;

      // 3. Quadrant Filter (Ideal: scattered across at least 3 quadrants)
      const quadrants = getQuadrantDistribution(gameNumbers, lottery.totalNumbers);
      const quadrantsUsed = quadrants.filter(q => q > 0).length;
      const isDistributed = quadrantsUsed >= 3;

      // 4. Sequence Filter (No more than 2 consecutive numbers)
      let hasLongSequence = false;
      for (let i = 0; i < gameNumbers.length - 2; i++) {
        if (
          gameNumbers[i + 1] === gameNumbers[i] + 1 &&
          gameNumbers[i + 2] === gameNumbers[i] + 2
        ) {
          hasLongSequence = true;
          break;
        }
      }

      if (isParityBalanced && isSumInRange && isDistributed && !hasLongSequence) {
        isValid = true;
      }
    }

    games.push(gameNumbers);
  }

  return {
    strategy,
    basedOn: `Total de ${lottery.results.length} concursos analisados + Padrões Estatísticos Avançados`,
    games,
  };
};
