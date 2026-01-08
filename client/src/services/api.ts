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
  const response = await api.post(`/import/${lotterySlug}`);
  return response.data;
};
