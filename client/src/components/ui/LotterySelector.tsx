import { LOTTERIES, type LotteryGame } from '../../constants/lotteries';

interface LotterySelectorProps {
  selected: LotteryGame;
  onSelect: (game: LotteryGame) => void;
}

export const LotterySelector = ({ selected, onSelect }: LotterySelectorProps) => {
  return (
    <div className="flex gap-2 p-1 bg-gray-100 rounded-lg overflow-x-auto">
      {(Object.values(LOTTERIES) as Array<(typeof LOTTERIES)[keyof typeof LOTTERIES]>).map(
        lottery => {
          const isSelected = selected === lottery.id;

          return (
            <button
              key={lottery.id}
              onClick={() => onSelect(lottery.id as LotteryGame)}
              className={`
              flex items-center gap-2 flex-1 px-4 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap
              ${
                isSelected
                  ? `bg-white text-gray-800 shadow-sm border-b-2 ${lottery.borderColor.replace(
                      'border-',
                      'border-b-'
                    )}`
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
              }
            `}
            >
              <img src={lottery.icon} alt={lottery.name} className="w-6 h-6 object-contain" />
              {lottery.name}
            </button>
          );
        }
      )}
    </div>
  );
};
