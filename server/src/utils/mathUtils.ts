export const calculateFrequency = (
  results: number[][],
  totalNumbers: number
): Map<number, number> => {
  const frequency = new Map<number, number>();

  // Initialize with 0
  for (let i = 1; i <= totalNumbers; i++) {
    frequency.set(i, 0);
  }

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
  const delays = new Map<number, number>();

  // Initialize with 'infinite' or max delay (assumed as total contests if never appeared)
  for (let i = 1; i <= totalNumbers; i++) {
    delays.set(i, currentContest);
  }

  // Iterate backwards to find last appearance
  // Assuming results are sorted desc (newest first)
  // Or we can just build a map of "lastSeenAt"

  const lastSeenAt = new Map<number, number>();

  // Sort descending just in case
  const sortedResults = [...results].sort((a, b) => b.contextNumber - a.contextNumber);

  for (const res of sortedResults) {
    for (const num of res.numbers) {
      if (!lastSeenAt.has(num)) {
        lastSeenAt.set(num, res.contextNumber);
      }
    }
    // Optimization: If we found all numbers, break? No, need precision.
  }

  for (let i = 1; i <= totalNumbers; i++) {
    const last = lastSeenAt.get(i);
    // Delay = Current Contest - Last Seen Contest
    // If never seen, delay is Current Contest
    delays.set(i, last ? currentContest - last : currentContest);
  }

  return delays;
};

// Fisher-Yates shuffle for generic randomness
export const shuffle = <T>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j] as T; // Type assertion safe here as indices are valid
    arr[j] = temp as T;
  }
  return arr;
};
