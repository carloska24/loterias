import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const BASE_URL = 'https://loteriascaixa-api.herokuapp.com/api';

// For Prisma 7, we might need to pass the adapter or url here if not using global config
// But usually `new PrismaClient()` picks up the config or env if setup standardly.
// Since we have `prisma.config.ts`, it should work.
export const prisma = new PrismaClient();

interface ApiResult {
  nome: string;
  numero_concurso?: number;
  concurso?: number;
  data_concurso?: string;
  data?: string;
  dezenas: string[];
  acumulou?: boolean;
  dataProximoConcurso?: string;
  valorEstimadoProximoConcurso?: number;
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
    console.log(
      `[DEBUG] Resposta API ${loteriaSlug}/${concurso}:`,
      JSON.stringify(response.data, null, 2)
    );
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
  } else {
    // Check if we need to update config
    if (lottery.gameNumbers !== gameNumbers || lottery.totalNumbers !== totalNumbers) {
      console.log(`Atualizando configuração da loteria ${loteriaName}...`);
      lottery = await prisma.lottery.update({
        where: { id: lottery.id },
        data: {
          totalNumbers,
          gameNumbers,
        },
      });
    }
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

    // Normalizar campos que mudam na API
    const numeroConcurso = data?.numero_concurso ?? data?.concurso;
    const dataConcurso = data?.data_concurso ?? data?.data;

    if (!data || !numeroConcurso) {
      // Try to fetch latest to see if we reached the end or just a gap/error
      const latest = await fetchLatestResult(loteriaSlug);
      const latestConcurso = latest?.numero_concurso ?? latest?.concurso ?? 0;

      if (latest && latestConcurso < nextConcurso) {
        console.log(`Chegamos ao fim dos resultados disponíveis (${latestConcurso}).`);
        break;
      }

      console.log(`Erro/Vazio no concurso ${nextConcurso}. Tentando próximo...`);
      errorCount++;
      nextConcurso++; // Skip or retry logic could be more complex
      continue;
    }

    errorCount = 0; // Reset error count on success

    if (!dataConcurso) {
      console.log(`Data inválida para concurso ${numeroConcurso}`);
      nextConcurso++;
      continue;
    }

    // Save result
    // Date format from API: "10/04/2007" (DD/MM/YYYY)
    const dateParts = dataConcurso.split('/').map(Number);
    if (dateParts.length < 3) continue;

    const [day, month, year] = dateParts;
    if (!day || !month || !year) continue;

    const dateObj = new Date(year, month - 1, day);

    // Check mapping to numbers array or string depending on your DB logic

    await prisma.result.create({
      data: {
        lotteryId: lottery.id,
        contestNumber: numeroConcurso,
        date: dateObj,
        numbers: JSON.stringify(data.dezenas.map(Number)),
        accumulated: data.acumulou,
        nextDrawDate: data.dataProximoConcurso,
        nextPrize: data.valorEstimadoProximoConcurso,
      },
    });

    console.log(`Importado: Concurso ${numeroConcurso} - ${dataConcurso}`);
    nextConcurso++;

    // Rate limiting friendly
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`Importação finalizada para ${loteriaName}.`);
  return { status: 'success', lastConcurso: nextConcurso - 1 };
};
