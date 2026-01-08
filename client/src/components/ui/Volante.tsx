interface VolanteProps {
  numbers: number[];
  totalNumbers: number;
  highlightColor: string; // e.g., 'bg-lottery-megasena'
}

export const Volante = ({ numbers, totalNumbers, highlightColor }: VolanteProps) => {
  // Create array from 1 to totalNumbers
  const allNumbers = Array.from({ length: totalNumbers }, (_, i) => i + 1);

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-inner max-w-sm mx-auto">
      <div className="grid grid-cols-10 gap-1 sm:gap-2">
        {allNumbers.map(num => {
          const isSelected = numbers.includes(num);
          return (
            <div
              key={num}
              className={`
                aspect-square flex items-center justify-center text-xs sm:text-sm font-bold rounded-full
                transition-all
                ${
                  isSelected
                    ? `${highlightColor} text-white shadow-md scale-110`
                    : 'bg-gray-100 text-gray-400'
                }
              `}
            >
              {num.toString().padStart(2, '0')}
            </div>
          );
        })}
      </div>
    </div>
  );
};
