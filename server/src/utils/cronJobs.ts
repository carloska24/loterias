import cron from 'node-cron';
import { importHistoricalData } from '../services/loteriasApi.js';

interface LotteryConfig {
  slug: string;
  name: string;
  total: number;
  game: number;
}

const LOTTERIES_CONFIG: LotteryConfig[] = [
  { slug: 'megasena', name: 'Mega-Sena', total: 60, game: 6 },
  { slug: 'lotofacil', name: 'Lotofácil', total: 25, game: 15 },
  { slug: 'lotomania', name: 'Lotomania', total: 100, game: 50 },
  { slug: 'quina', name: 'Quina', total: 80, game: 5 },
];

export const setupCronJobs = () => {
  // Executa todos os dias às 22:30h (Horário de Brasília)
  // Sorteios da Caixa geralmente ocorrem até às 21:00 e saem os resultados às 22:00
  cron.schedule('30 22 * * *', async () => {
    console.log('[CRON] Iniciando rotina de atualização diária dos resultados...');
    for (const lotto of LOTTERIES_CONFIG) {
      try {
        await importHistoricalData(lotto.slug, lotto.name, lotto.total, lotto.game);
      } catch (err) {
        console.error(`[CRON] Erro ao importar resultados para ${lotto.name}:`, err);
      }
    }
    console.log('[CRON] Rotina de atualização finalizada.');
  });

  console.log('[CRON] Jobs agendados: Atualização diária configurada para 22:30h.');
};
