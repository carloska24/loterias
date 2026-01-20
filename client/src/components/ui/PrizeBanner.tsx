import { useEffect, useState } from 'react';
import { getLastResult } from '../../services/api';
import { Trophy, Calendar } from 'lucide-react';
import type { LotteryGame } from '../../constants/lotteries';
import { LotteryBall } from './LotteryBall';

interface PrizeBannerProps {
  lotterySlug: LotteryGame;
  colorClass: string;
}

interface LastResult {
  nextPrize: number;
  nextDrawDate: string;
  accumulated: boolean;
  contestNumber: number;
  numbers: string; // JSON string "[1,2,3...]"
}

export const PrizeBanner = ({ lotterySlug, colorClass }: PrizeBannerProps) => {
  const [data, setData] = useState<LastResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPrize = async () => {
      setLoading(true);
      try {
        const result = await getLastResult(lotterySlug);
        setData(result);
      } catch (error) {
        console.error('Falha ao buscar prêmio:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrize();
  }, [lotterySlug]);

  if (loading) return <div className="h-24 bg-gray-100 rounded-xl animate-pulse mb-8" />;
  if (!data || !data.nextPrize) return null;

  const formattedPrize = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(data.nextPrize);

  // Extract text color from bg class (simple mapping)
  const textColor = colorClass.replace('bg-', 'text-');
  const ringColor = colorClass.replace('bg-', 'ring-');

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8 mt-4 relative overflow-hidden animate-fadeIn">
      {/* Background decoration */}
      <div
        className={`absolute top-0 right-0 w-32 h-32 ${colorClass} opacity-5 rounded-bl-full -mr-8 -mt-8`}
      />

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        {/* Left: Prize Info */}
        <div className="text-center md:text-left flex-1">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Prêmio Estimado
            </span>
            {data.accumulated && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-bold border border-yellow-200 flex items-center gap-1`}
              >
                <Trophy className="w-3 h-3" />
                ACUMULOU!
              </span>
            )}
          </div>

          <h2
            className={`text-4xl md:text-5xl font-black ${textColor} tracking-tight drop-shadow-sm`}
          >
            {formattedPrize}
          </h2>
        </div>

        {/* Right: Date Info */}
        <div className="flex items-center gap-4 bg-gray-50 px-5 py-3 rounded-lg border border-gray-100 shrink-0">
          <div className={`p-2 rounded-full bg-white shadow-sm ring-1 ${ringColor}`}>
            <Calendar className={`w-6 h-6 ${textColor}`} />
          </div>
          <div className="text-left">
            <p className="text-xs text-gray-500 font-medium uppercase">Próximo Sorteio</p>
            <p className="text-lg font-bold text-gray-700">{data.nextDrawDate || 'A definir'}</p>
          </div>
        </div>
      </div>

      {/* Bottom: Last Result Numbers */}
      {data.numbers && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 text-center md:text-left">
            Último Resultado{' '}
            <span className="text-gray-400 font-normal ml-1">Concurso {data.contestNumber}</span>
          </p>
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {JSON.parse(data.numbers).map((num: number, idx: number) => (
              <LotteryBall key={idx} number={num} colorClass={colorClass} size="sm" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
