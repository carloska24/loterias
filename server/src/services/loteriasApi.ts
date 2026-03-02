import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const BASE_URL = 'https://loteriascaixa-api.herokuapp.com/api';

// For Prisma 7, we might need to pass the adapter or url here if not using global config
// But usually `new PrismaClient()` picks up the config or env if setup standardly.
// Since we have `prisma.config.ts`, it should work.
const prisma = new PrismaClient();

interface ApiResult {
  loteria: string;
  concurso: number;
  data: string;
  dezenas: string[];
  valorEstimadoProximoConcurso?: number;
  dataProximoConcurso?: string;
  acumulou?: boolean;
}

export const fetchLatestResult = async (loteriaSlug: string) => {
  try {
    const response = await axios.get<ApiResult>(`${BASE_URL}/${loteriaSlug}/latest`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar resultado da ${loteriaSlug}:`, error);
    return null;
  }
};

export const fetchResultByConcurso = async (loteriaSlug: string, concurso: number) => {
  try {
    const response = await axios.get<ApiResult>(`${BASE_URL}/${loteriaSlug}/${concurso}`);
    return response.data;
  } catch (error) {
    // 404 means it doesn't exist yet usually
    return null;
  }
};

export const importHistoricalData = async (
  loteriaSlug: string,
  loteriaName: string,
  totalNumbers: number,
  gameNumbers: number
) => {
  console.log(`Iniciando importação para ${loteriaName} (${loteriaSlug})...`);

  // 1. Ensure Lottery exists
  let lottery = await prisma.lottery.findUnique({ where: { slug: loteriaSlug } });

  if (!lottery) {
    console.log(`Criando registro da loteria ${loteriaName}...`);
    lottery = await prisma.lottery.create({
      data: {
        name: loteriaName,
        slug: loteriaSlug,
        totalNumbers,
        gameNumbers,
      },
    });
  }

  // Sempre tentar resgatar o sorteio mais recente de vez para atualizar O Prêmio e Data no header da Loteria
  try {
    const latestForMeta = await fetchLatestResult(loteriaSlug);
    if (latestForMeta) {
      let proximaData: Date | null = null;
      if (latestForMeta.dataProximoConcurso) {
        const [d, m, y] = latestForMeta.dataProximoConcurso.split('/');
        proximaData = new Date(Number(y), Number(m) - 1, Number(d));
      }

      await prisma.lottery.update({
        where: { id: lottery.id },
        data: {
          nextPrize: latestForMeta.valorEstimadoProximoConcurso ?? null,
          nextDate: proximaData,
          accumulated: latestForMeta.acumulou ?? false,
        },
      });
    }
  } catch (err) {
    console.error('Falha não fatal ao atualizar meta-dados da loteria:', err);
  }

  // 2. Get latest imported contest to resume from
  const lastResult = await prisma.result.findFirst({
    where: { lotteryId: lottery.id },
    orderBy: { contestNumber: 'desc' },
  });

  let nextConcurso = (lastResult?.contestNumber || 0) + 1;
  let hasMore = true;
  let errorCount = 0;

  console.log(`Iniciando busca a partir do concurso ${nextConcurso}...`);

  while (hasMore && errorCount < 5) {
    const data = await fetchResultByConcurso(loteriaSlug, nextConcurso);

    if (!data) {
      // Try to fetch latest to see if we reached the end or just a gap/error
      const latest = await fetchLatestResult(loteriaSlug);
      if (latest && latest.concurso < nextConcurso) {
        console.log(`Chegamos ao fim dos resultados disponíveis (${latest.concurso}).`);
        break;
      }

      console.log(`Erro/Vazio no concurso ${nextConcurso}. Tentando próximo...`);
      errorCount++;
      nextConcurso++; // Skip or retry logic could be more complex
      continue;
    }

    errorCount = 0; // Reset error count on success

    // Date format from API: "10/04/2007" (DD/MM/YYYY)
    const dateParts = data.data ? data.data.split('/').map(Number) : [];
    if (dateParts.length < 3) continue;

    const [day, month, year] = dateParts;
    if (!day || !month || !year) continue;

    const dateObj = new Date(year, month - 1, day);

    await prisma.result.create({
      data: {
        lotteryId: lottery.id,
        contestNumber: data.concurso,
        date: dateObj,
        numbers: data.dezenas.map(Number),
      },
    });

    console.log(`Importado: Concurso ${data.concurso} - ${data.data}`);
    nextConcurso++;

    // Rate limiting friendly
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`Importação finalizada para ${loteriaName}.`);
  return { status: 'success', lastConcurso: nextConcurso - 1 };
};
