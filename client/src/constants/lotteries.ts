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
    textColor: 'text-lottery-megasena',
    borderColor: 'border-lottery-megasena',
    totalNumbers: 60,
    defaultGames: 6,
  },
  lotofacil: {
    id: 'lotofacil',
    name: 'Lotofácil',
    icon: lotofacilIcon,
    color: 'bg-lottery-lotofacil',
    textColor: 'text-lottery-lotofacil',
    borderColor: 'border-lottery-lotofacil',
    totalNumbers: 25,
    defaultGames: 15,
  },
  lotomania: {
    id: 'lotomania',
    name: 'Lotomania',
    icon: lotomaniaIcon,
    color: 'bg-lottery-lotomania',
    textColor: 'text-lottery-lotomania',
    borderColor: 'border-lottery-lotomania',
    totalNumbers: 100,
    defaultGames: 50,
  },
  quina: {
    id: 'quina',
    name: 'Quina',
    icon: quinaIcon,
    color: 'bg-lottery-quina',
    textColor: 'text-lottery-quina',
    borderColor: 'border-lottery-quina',
    totalNumbers: 80,
    defaultGames: 5,
  },
} as const;
