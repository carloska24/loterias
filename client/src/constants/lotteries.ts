import megasenaIcon from '../assets/megasena.png';
import lotofacilIcon from '../assets/lotofacil.png';
import lotomaniaIcon from '../assets/lotomania.png';
import quinaIcon from '../assets/quina.jpg';

export type LotteryGame = 'megasena' | 'lotofacil' | 'lotomania' | 'quina';

export const LOTTERIES = {
  megasena: {
    id: 'megasena',
    name: 'Mega-Sena',
    icon: megasenaIcon,
    color: 'bg-lottery-megasena',
    gradient: 'from-lottery-megasena to-emerald-600',
    textColor: 'text-lottery-megasena',
    borderColor: 'border-lottery-megasena',
    totalNumbers: 60,
    defaultGames: 6,
    drawnNumbers: 6,
    maxPrizeHits: 6,
    // Soma histórica das 6 dezenas da Mega-Sena (percentis 10%–90%)
    sumRange: { min: 95, max: 175, mean: 132 },
    prizeTable: [
      { label: 'Sena (6 acertos)', minHits: 6, odds: 50063860 },
      { label: 'Quina (5 acertos)', minHits: 5, odds: 154518 },
      { label: 'Quadra (4 acertos)', minHits: 4, odds: 2332 },
    ],
  },
  lotofacil: {
    id: 'lotofacil',
    name: 'Lotofácil',
    icon: lotofacilIcon,
    color: 'bg-lottery-lotofacil',
    gradient: 'from-lottery-lotofacil to-pink-600',
    textColor: 'text-lottery-lotofacil',
    borderColor: 'border-lottery-lotofacil',
    totalNumbers: 25,
    defaultGames: 15,
    drawnNumbers: 15,
    maxPrizeHits: 15,
    // Soma histórica das 15 dezenas da Lotofácil (percentis 10%–90%)
    sumRange: { min: 170, max: 220, mean: 195 },
    prizeTable: [
      { label: '15 acertos', minHits: 15, odds: 3268760 },
      { label: '14 acertos', minHits: 14, odds: 21792 },
      { label: '13 acertos', minHits: 13, odds: 794 },
      { label: '12 acertos', minHits: 12, odds: 68 },
      { label: '11 acertos', minHits: 11, odds: 11 },
    ],
  },
  lotomania: {
    id: 'lotomania',
    name: 'Lotomania',
    icon: lotomaniaIcon,
    color: 'bg-lottery-lotomania',
    gradient: 'from-lottery-lotomania to-orange-500',
    textColor: 'text-lottery-lotomania',
    borderColor: 'border-lottery-lotomania',
    totalNumbers: 100,
    defaultGames: 50, // Apostador escolhe 50
    drawnNumbers: 20, // Caixa sorteia 20
    maxPrizeHits: 20,
    // Soma histórica dos 20 números sorteados (percentis 10%–90%)
    sumRange: { min: 780, max: 1250, mean: 1010 },
    prizeTable: [
      { label: '20 acertos', minHits: 20, odds: 304 },
      { label: '19 acertos', minHits: 19, odds: 27 },
      { label: '18 acertos', minHits: 18, odds: 7 },
      { label: '0 acertos', minHits: 0, odds: 4 },
    ],
  },
  quina: {
    id: 'quina',
    name: 'Quina',
    icon: quinaIcon,
    color: 'bg-lottery-quina',
    gradient: 'from-lottery-quina to-blue-800',
    textColor: 'text-lottery-quina',
    borderColor: 'border-lottery-quina',
    totalNumbers: 80,
    defaultGames: 5,
    drawnNumbers: 5,
    maxPrizeHits: 5,
    // Soma histórica das 5 dezenas da Quina (percentis 10%–90%)
    sumRange: { min: 50, max: 260, mean: 170 },
    prizeTable: [
      { label: 'Quina (5 acertos)', minHits: 5, odds: 24040060 },
      { label: 'Quadra (4 acertos)', minHits: 4, odds: 154518 },
      { label: 'Terno (3 acertos)', minHits: 3, odds: 2732 },
      { label: 'Duque (2 acertos)', minHits: 2, odds: 91 },
    ],
  },
} as const;
