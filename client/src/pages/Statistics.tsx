import { useState, useEffect } from 'react';
import { LotterySelector } from '../components/ui/LotterySelector';
import { LOTTERIES, type LotteryGame } from '../constants/lotteries';
import { getStats, type StatsData } from '../services/api';
import { Loader2, Flame, Snowflake, BarChart3, Layers, Link2, AlertCircle } from 'lucide-react';

const HEAT_THRESHOLDS = [0.6, 0.8]; // <60% = frio, 60-80% = morno, >80% = quente

const HeatColor = (pct: number, maxPct: number): { dot: string; bg: string; text: string } => {
  const ratio = maxPct > 0 ? pct / maxPct : 0;
  if (ratio > HEAT_THRESHOLDS[1]!)
    return { dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-600' };
  if (ratio > HEAT_THRESHOLDS[0]!)
    return { dot: 'bg-amber-400', bg: 'bg-amber-50', text: 'text-amber-600' };
  return { dot: 'bg-blue-400', bg: 'bg-blue-50', text: 'text-blue-600' };
};

export const Statistics = () => {
  const [selectedGame, setSelectedGame] = useState<LotteryGame>('lotofacil');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const config = LOTTERIES[selectedGame];

  useEffect(() => {
    setLoading(true);
    setError('');
    setStats(null);
    getStats(selectedGame)
      .then(setStats)
      .catch(() =>
        setError('Dados insuficientes. Sincronize os resultados desta loteria primeiro.')
      )
      .finally(() => setLoading(false));
  }, [selectedGame]);

  const maxFreqPct = stats ? Math.max(...stats.numbers.map(n => n.frequencyPct)) : 1;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      <div className="text-center space-y-1">
        <h1 className="text-3xl font-black text-gray-800">Estatísticas Históricas</h1>
        <p className="text-gray-500 text-sm">Análise completa dos sorteios oficiais da Caixa.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <LotterySelector selected={selectedGame} onSelect={setSelectedGame} />
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
            <Loader2 className={`w-10 h-10 animate-spin ${config.textColor}`} />
            <p className="text-sm font-medium">Calculando {config.name}…</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center gap-3 m-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {stats && !loading && (
          <div className="p-6 space-y-8">
            {/* 1 ─── Cards Rápidos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: 'Sorteios analisados',
                  value: stats.totalDraws.toLocaleString('pt-BR'),
                  icon: BarChart3,
                  color: 'text-blue-600',
                  bg: 'bg-blue-50',
                },
                {
                  label: 'Soma mínima esperada',
                  value: String(stats.sumStats.q1),
                  icon: Layers,
                  color: 'text-purple-600',
                  bg: 'bg-purple-50',
                },
                {
                  label: 'Soma máxima esperada',
                  value: String(stats.sumStats.q3),
                  icon: Layers,
                  color: 'text-pink-600',
                  bg: 'bg-pink-50',
                },
                {
                  label: 'Soma média histórica',
                  value: String(Math.round(stats.sumStats.mean)),
                  icon: BarChart3,
                  color: `${config.textColor}`,
                  bg: `${config.color.replace('bg-', 'bg-')}/10`,
                },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="lottery-card p-4">
                  <div className={`inline-flex p-2 rounded-xl mb-3 ${bg}`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <p className="text-xl font-black text-gray-800">{value}</p>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {/* 2 ─── Heatmap de Frequências */}
            <div>
              <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <BarChart3 className={`w-4 h-4 ${config.textColor}`} /> Heatmap de Frequência
                <span className="text-[10px] font-bold text-gray-400 normal-case tracking-normal ml-1">
                  ({stats.totalDraws} sorteios)
                </span>
              </h3>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {stats.numbers.map(({ number, frequency, frequencyPct }) => {
                  const heat = HeatColor(frequencyPct, maxFreqPct);
                  const barH = maxFreqPct > 0 ? Math.round((frequencyPct / maxFreqPct) * 48) : 4;
                  return (
                    <div key={number} className="flex flex-col items-center gap-1 group">
                      {/* Barra vertical */}
                      <div className="flex items-end h-14 w-full bg-gray-50 rounded-lg overflow-hidden border border-gray-100 px-1 pt-1">
                        <div
                          className={`w-full rounded-t bg-gradient-to-t ${heat.dot === 'bg-red-500' ? 'from-red-500 to-rose-400' : heat.dot === 'bg-amber-400' ? 'from-amber-400 to-yellow-300' : 'from-blue-400 to-blue-300'} transition-all duration-700`}
                          style={{ height: Math.max(barH, 4) }}
                        />
                      </div>
                      {/* Número */}
                      <span className={`text-[11px] font-black ${heat.text}`}>
                        {number.toString().padStart(2, '0')}
                      </span>
                      {/* Frequência (tooltip on hover) */}
                      <span
                        className="text-[9px] font-medium group-hover:opacity-100 opacity-0 transition-opacity absolute bg-gray-800 px-1.5 py-0.5 rounded mt-16 pointer-events-none z-10"
                        style={{ color: '#fff' }}
                      >
                        {frequency}× ({frequencyPct.toFixed(1)}%)
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                  Alta frequência
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                  Intermediária
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-400 inline-block" />
                  Baixa frequência
                </span>
              </div>
            </div>

            {/* 3 ─── Top Quentes vs Frios */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-red-500" /> Top 10 Números Quentes
                </h3>
                <div className="space-y-2">
                  {stats.topHot.map((n, i) => (
                    <div key={n.number} className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-gray-400 w-4">{i + 1}</span>
                      <span
                        className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-black text-white bg-gradient-to-br ${config.gradient} shadow-sm shrink-0`}
                      >
                        {n.number.toString().padStart(2, '0')}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${config.gradient} rounded-full`}
                          style={{ width: `${(n.frequencyPct / maxFreqPct) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-black text-gray-600 w-20 text-right">
                        {n.frequency}× ({n.frequencyPct.toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Snowflake className="w-4 h-4 text-blue-500" /> Top 10 Números Frios
                </h3>
                <div className="space-y-2">
                  {stats.topCold.map((n, i) => (
                    <div key={n.number} className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-gray-400 w-4">{i + 1}</span>
                      <span className="w-8 h-8 flex items-center justify-center rounded-full text-xs font-black bg-blue-100 text-blue-700 shrink-0">
                        {n.number.toString().padStart(2, '0')}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-300 to-blue-500 rounded-full"
                          style={{ width: `${(n.frequencyPct / maxFreqPct) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-black text-gray-600 w-20 text-right">
                        {n.frequency}× ({n.frequencyPct.toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 4 ─── IQR da Soma (Marcador Visual) */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-500" /> Distribuição da Soma Histórica (IQR
                10%–90%)
              </h3>
              <div className="space-y-3">
                <div className="relative h-8">
                  <div className="absolute inset-y-0 left-0 right-0 bg-gray-100 rounded-full overflow-hidden">
                    {/* Zona ideal (IQR) */}
                    <div
                      className={`absolute inset-y-0 bg-gradient-to-r ${config.gradient} opacity-30 rounded-full`}
                      style={{
                        left: `${((stats.sumStats.q1 - stats.sumStats.min) / (stats.sumStats.max - stats.sumStats.min || 1)) * 100}%`,
                        right: `${100 - ((stats.sumStats.q3 - stats.sumStats.min) / (stats.sumStats.max - stats.sumStats.min || 1)) * 100}%`,
                      }}
                    />
                    {/* Média */}
                    <div
                      className={`absolute inset-y-1 w-1 bg-gradient-to-b ${config.gradient} rounded-full`}
                      style={{
                        left: `${((stats.sumStats.mean - stats.sumStats.min) / (stats.sumStats.max - stats.sumStats.min || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-500">
                  <span>Mín: {stats.sumStats.min}</span>
                  <span className={`${config.textColor} font-black`}>
                    IQR Ideal: {stats.sumStats.q1}–{stats.sumStats.q3} · Média:{' '}
                    {Math.round(stats.sumStats.mean)}
                  </span>
                  <span>Máx: {stats.sumStats.max}</span>
                </div>
                <p className="text-[11px] text-gray-400 text-center">
                  Jogos com soma fora do IQR são automaticamente rejeitados pelo gerador.
                </p>
              </div>
            </div>

            {/* 5 ─── Pares Frequentes */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Link2 className={`w-4 h-4 ${config.textColor}`} /> Top 20 Pares Mais Frequentes
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats.topPairs.map(({ pair, count }, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 bg-white rounded-xl p-3 border border-gray-100 shadow-sm"
                  >
                    <span className={`text-[10px] font-black text-gray-400 w-4`}>#{i + 1}</span>
                    <span className={`text-xs font-black ${config.textColor}`}>
                      {pair[0].toString().padStart(2, '0')}+{pair[1].toString().padStart(2, '0')}
                    </span>
                    <span className="ml-auto text-[10px] font-bold text-gray-500">{count}×</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
