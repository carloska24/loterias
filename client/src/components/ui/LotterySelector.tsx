import { useEffect, useState } from 'react';
import { LOTTERIES, type LotteryGame } from '../../constants/lotteries';
import { getLatestPrizes, type PrizeData } from '../../services/api';
import { motion } from 'framer-motion';

interface LotterySelectorProps {
  selected: LotteryGame;
  onSelect: (game: LotteryGame) => void;
}

export const LotterySelector = ({ selected, onSelect }: LotterySelectorProps) => {
  const [prizes, setPrizes] = useState<Record<string, PrizeData>>({});

  useEffect(() => {
    const fetchPrizes = async () => {
      try {
        const data = await getLatestPrizes();
        const prizeMap = data.reduce(
          (acc, curr) => {
            acc[curr.slug] = curr;
            return acc;
          },
          {} as Record<string, PrizeData>
        );
        setPrizes(prizeMap);
      } catch (err) {
        console.error('Falha ao carregar prêmios recentes', err);
      }
    };
    fetchPrizes();
  }, []);

  return (
    <div className="flex p-1.5 bg-gray-100/80 backdrop-blur-md rounded-xl overflow-x-auto custom-scrollbar items-center gap-1.5 border border-white max-w-fit mx-auto shadow-inner">
      {(Object.values(LOTTERIES) as Array<(typeof LOTTERIES)[keyof typeof LOTTERIES]>).map(
        lottery => {
          const isSelected = selected === lottery.id;
          const prizeInfo = prizes[lottery.id];
          const isAccumulated = prizeInfo?.accumulated;

          return (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              key={lottery.id}
              onClick={() => onSelect(lottery.id as LotteryGame)}
              className={`
                relative flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 min-w-[140px] whitespace-nowrap
                ${
                  isSelected
                    ? `bg-white text-gray-900 shadow-md ring-1 ring-gray-200/50`
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }
              `}
            >
              <img
                src={lottery.icon}
                alt={lottery.name}
                className={`w-5 h-5 object-contain transition-transform duration-300 ${isSelected ? 'scale-110 drop-shadow-sm' : 'grayscale opacity-60'}`}
              />
              <span className={isSelected ? 'tracking-tight' : 'font-semibold'}>
                {lottery.name}
              </span>

              {/* Indicador discreto de acúmulo no Pill */}
              {isAccumulated && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                </span>
              )}
            </motion.button>
          );
        }
      )}
    </div>
  );
};
