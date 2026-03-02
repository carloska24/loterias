import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

export const generateGames = async (
  lotterySlug: string,
  strategy: string,
  numberOfGames: number
) => {
  const response = await api.post('/generate', {
    lotterySlug,
    strategy,
    numberOfGames,
  });
  return response.data;
};

export const importData = async (lotterySlug: string) => {
  const response = await api.post(
    `/import/${lotterySlug}`,
    {},
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
  return response.data;
};

export const getLatestResult = async (lotterySlug: string) => {
  const response = await api.get(`/latest/${lotterySlug}`);
  return response.data;
};

export const getSpecificResult = async (lotterySlug: string, contestNumber: number) => {
  const response = await api.get(`/results/${lotterySlug}/${contestNumber}`);
  return response.data;
};

export interface PaginatedResults {
  data: Array<Record<string, unknown>>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const getResults = async (
  lotterySlug: string,
  page = 1,
  limit = 20
): Promise<PaginatedResults> => {
  const response = await api.get(`/results/${lotterySlug}`, {
    params: { page, limit },
  });
  return response.data;
};

export interface PrizeData {
  slug: string;
  name: string;
  nextPrize: number | null;
  nextDate: string | null;
  accumulated: boolean;
}

export const getLatestPrizes = async (): Promise<PrizeData[]> => {
  const response = await api.get('/latest-prizes');
  return response.data;
};

export interface SavedTicketInput {
  lotterySlug: string;
  contestNumber?: number;
  numbers: number[];
  cost: number;
  isSyndicate: boolean;
  participants: { name: string; quota: number }[];
}

export const saveTickets = async (tickets: SavedTicketInput[]) => {
  const response = await api.post('/tickets', { tickets });
  return response.data;
};

export const deleteSavedTicket = async (id: string) => {
  const response = await api.delete(`/tickets/${id}`);
  return response.data;
};

export const deleteAllSavedTickets = async (lotterySlug?: string) => {
  const response = await api.delete('/tickets/all', {
    params: { lotterySlug },
  });
  return response.data;
};

export const getSavedTickets = async (
  lotterySlug?: string,
  archived?: 'true' | 'false' | 'all'
) => {
  const response = await api.get('/tickets', {
    params: { lotterySlug, archived },
  });
  return response.data;
};

export const archiveTicket = async (id: string, archived: boolean) => {
  const response = await api.patch(`/tickets/${id}/archive`, { archived });
  return response.data;
};

export const archiveAllTickets = async (lotterySlug?: string) => {
  const response = await api.patch('/tickets/archive-all', undefined, {
    params: { lotterySlug },
  });
  return response.data;
};

export interface StatsData {
  totalDraws: number;
  numbers: { number: number; frequency: number; frequencyPct: number; delay: number }[];
  topHot: { number: number; frequency: number; frequencyPct: number; delay: number }[];
  topCold: { number: number; frequency: number; frequencyPct: number; delay: number }[];
  sumStats: { q1: number; q3: number; mean: number; min: number; max: number };
  topPairs: { pair: [number, number]; count: number }[];
}

export const getStats = async (lotterySlug: string): Promise<StatsData> => {
  const response = await api.get(`/stats/${lotterySlug}`);
  return response.data;
};

export const getDashboardSummary = async () => {
  const [prizes, tickets] = await Promise.all([getLatestPrizes(), getSavedTickets()]);
  return { prizes, tickets: tickets.tickets || [] };
};
