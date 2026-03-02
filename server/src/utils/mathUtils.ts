export const calculateFrequency = (
  results: number[][],
  totalNumbers: number
): Map<number, number> => {
  const frequency = new Map<number, number>();
  for (let i = 1; i <= totalNumbers; i++) frequency.set(i, 0);
  results.forEach(numbers => {
    numbers.forEach(num => {
      frequency.set(num, (frequency.get(num) || 0) + 1);
    });
  });
  return frequency;
};

export const calculateDelay = (
  results: { contextNumber: number; numbers: number[] }[],
  totalNumbers: number,
  currentContest: number
): Map<number, number> => {
  const lastSeenAt = new Map<number, number>();
  const sortedResults = [...results].sort((a, b) => b.contextNumber - a.contextNumber);
  for (const res of sortedResults) {
    for (const num of res.numbers) {
      if (!lastSeenAt.has(num)) lastSeenAt.set(num, res.contextNumber);
    }
  }
  const delays = new Map<number, number>();
  for (let i = 1; i <= totalNumbers; i++) {
    const last = lastSeenAt.get(i);
    delays.set(i, last ? currentContest - last : currentContest);
  }
  return delays;
};

// Normaliza um Map de scores para o intervalo [0, 1]
export const normalizeMap = (map: Map<number, number>): Map<number, number> => {
  const values = Array.from(map.values());
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const normalized = new Map<number, number>();
  for (const [key, val] of map.entries()) {
    normalized.set(key, (val - min) / range);
  }
  return normalized;
};

// Calcula o IQR (Interquartile Range) da soma das dezenas sorteadas
export const calculateSumStats = (
  results: number[][]
): { q1: number; q3: number; mean: number; min: number; max: number } => {
  const sums = results.map(r => r.reduce((a, b) => a + b, 0)).sort((a, b) => a - b);
  if (sums.length === 0) return { q1: 0, q3: Infinity, mean: 0, min: 0, max: Infinity };
  const mean = sums.reduce((a, b) => a + b, 0) / sums.length;
  const q1 = sums[Math.floor(sums.length * 0.1)] ?? sums[0]!;
  const q3 = sums[Math.floor(sums.length * 0.9)] ?? sums[sums.length - 1]!;
  return { q1, q3, mean, min: sums[0]!, max: sums[sums.length - 1]! };
};

// Verifica cobertura mínima de faixas de números
// Ex: para Lotofácil (1-25), divide em 5 faixas de 5. Exige pelo menos minFaixas cobertas.
export const hasMinRangeCoverage = (
  numbers: number[],
  totalNumbers: number,
  gameSize: number
): boolean => {
  const faixaSize = Math.max(Math.floor(totalNumbers / 5), 5);
  const faixas = new Set<number>();
  for (const n of numbers) {
    faixas.add(Math.floor((n - 1) / faixaSize));
  }
  // Exige ao menos metade das faixas cobertas (dinâmico por tamanho de jogo)
  const minFaixas = Math.max(2, Math.floor(gameSize / 5));
  return faixas.size >= minFaixas;
};

// Calcula pares com maior co-ocorrência histórica
export const calculatePairCooccurrence = (
  results: number[][],
  topN = 20
): { pair: [number, number]; count: number }[] => {
  const pairMap = new Map<string, number>();
  for (const nums of results) {
    const sorted = [...nums].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const key = `${sorted[i]}-${sorted[j]}`;
        pairMap.set(key, (pairMap.get(key) || 0) + 1);
      }
    }
  }
  return Array.from(pairMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([key, count]) => {
      const [a, b] = key.split('-').map(Number);
      return { pair: [a, b] as [number, number], count };
    });
};

// Combinatória C(n, k)
export const combination = (n: number, k: number): number => {
  if (k > n) return 0;
  if (k === 0 || k === n) return 1;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return Math.round(result);
};

// Probabilidade de acertar exatamente `hits` dentre `gameSize` números
// de um universo de `totalNumbers` no qual `drawn` números foram sorteados
export const hitProbability = (
  totalNumbers: number,
  drawn: number,
  gameSize: number,
  hits: number
): number => {
  const numerator = combination(drawn, hits) * combination(totalNumbers - drawn, gameSize - hits);
  const denominator = combination(totalNumbers, gameSize);
  return denominator > 0 ? numerator / denominator : 0;
};

// Retorna probabilidade de ganhar qualquer prêmio (acertar ao menos minHits)
export const probabilityAnyPrize = (
  totalNumbers: number,
  drawn: number,
  gameSize: number,
  minHits: number
): number => {
  let prob = 0;
  for (let h = minHits; h <= Math.min(drawn, gameSize); h++) {
    prob += hitProbability(totalNumbers, drawn, gameSize, h);
  }
  return prob;
};

// Fisher-Yates shuffle
export const shuffle = <T>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j] as T;
    arr[j] = temp as T;
  }
  return arr;
};

export const countEvenOdd = (numbers: number[]): { even: number; odd: number } => {
  let even = 0,
    odd = 0;
  for (const num of numbers) {
    if (num % 2 === 0) even++;
    else odd++;
  }
  return { even, odd };
};

export const calculateSum = (numbers: number[]): number =>
  numbers.reduce((acc, curr) => acc + curr, 0);

export const isValidSequence = (numbers: number[], maxConsecutive = 3): boolean => {
  let maxConseq = 1,
    currentConseq = 1;
  const sorted = [...numbers].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1] as number;
    const current = sorted[i] as number;
    if (current === prev + 1) {
      currentConseq++;
      if (currentConseq > maxConseq) maxConseq = currentConseq;
    } else {
      currentConseq = 1;
    }
  }
  return maxConseq <= maxConsecutive;
};
