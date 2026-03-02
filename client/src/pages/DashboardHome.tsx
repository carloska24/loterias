import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Award,
  Calendar,
  Ticket,
  Trophy,
  ChevronRight,
  Loader2,
  Zap,
} from 'lucide-react';
import { getDashboardSummary, getLatestPrizes, type PrizeData } from '../services/api';
import { LOTTERIES, type LotteryGame } from '../constants/lotteries';

interface SavedTicket {
  id: string;
  lotterySlug: string;
  contestNumber: number | null;
  numbers: number[];
  cost: number;
  isSyndicate: boolean;
  createdAt: string;
}

const formatCurrency = (val: number | null) => {
  if (!val) return '—';
  if (val >= 1_000_000) return `R$ ${(val / 1_000_000).toFixed(0)}M`;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(val);
};

const formatDate = (d: string | null) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const isToday = (d: string | null) => {
  if (!d) return false;
  const today = new Date();
  const dt = new Date(d);
  return dt.getDate() === today.getDate() && dt.getMonth() === today.getMonth();
};

export const DashboardHome = () => {
  const [prizes, setPrizes] = useState<PrizeData[]>([]);
  const [tickets, setTickets] = useState<SavedTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardSummary()
      .then(({ prizes: p, tickets: t }) => {
        setPrizes(p);
        setTickets(t);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalInvested = tickets.reduce((s, t) => s + t.cost, 0);
  const uniqueLotteries = new Set(tickets.map(t => t.lotterySlug)).size;

  const accumulatedPrize = prizes
    .filter(p => p.accumulated)
    .sort((a, b) => (b.nextPrize ?? 0) - (a.nextPrize ?? 0))[0];

  const recentTickets = tickets.slice(0, 3);

  const LOTTERY_ORDER: LotteryGame[] = ['megasena', 'lotofacil', 'lotomania', 'quina'];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ── Banner Acumulada ─────────────────────────────────────── */}
      {accumulatedPrize &&
        !loading &&
        (() => {
          const cfg = LOTTERIES[accumulatedPrize.slug as LotteryGame];
          if (!cfg) return null;
          return (
            <div
              className={`relative overflow-hidden rounded-2xl shadow-xl bg-gradient-to-br ${cfg.gradient} p-6 text-white border border-white/10`}
            >
              <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-yellow-950 px-2 py-0.5 rounded mb-2 animate-pulse">
                    <Zap className="w-3 h-3" /> Acumulada
                  </span>
                  <h2 className="text-4xl font-black tracking-tight">
                    {formatCurrency(accumulatedPrize.nextPrize)}
                  </h2>
                  <p className="text-white/80 font-medium">
                    {cfg.name} · Próximo sorteio: {formatDate(accumulatedPrize.nextDate)}
                  </p>
                </div>
                <Link
                  to="/generator"
                  className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5"
                >
                  <Zap className="w-4 h-4" /> Gerar Jogos
                </Link>
              </div>
            </div>
          );
        })()}

      {/* ── Cards de Estatísticas ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: Ticket,
            label: 'Apostas Salvas',
            value: loading ? '...' : String(tickets.length),
            sub: 'na nuvem',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            icon: Award,
            label: 'Valor Investido',
            value: loading ? '...' : `R$ ${totalInvested.toFixed(2).replace('.', ',')}`,
            sub: 'total acumulado',
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            icon: Calendar,
            label: 'Loterias Ativas',
            value: loading ? '...' : String(uniqueLotteries),
            sub: 'com apostas',
            color: 'text-purple-600',
            bg: 'bg-purple-50',
          },
          {
            icon: TrendingUp,
            label: 'Próximos Sorteios',
            value: loading ? '...' : String(prizes.filter(p => isToday(p.nextDate)).length),
            sub: 'hoje',
            color: 'text-orange-600',
            bg: 'bg-orange-50',
          },
        ].map(({ icon: Icon, label, value, sub, color, bg }) => (
          <div key={label} className="lottery-card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-800">{value}</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{sub}</p>
            <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Próximos Sorteios ─────────────────────────────────── */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-black text-gray-800 text-sm uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" /> Próximos Prêmios
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              LOTTERY_ORDER.map(slug => {
                const p = prizes.find(x => x.slug === slug);
                if (!p) return null;
                const cfg = LOTTERIES[slug];
                const today = isToday(p.nextDate);
                return (
                  <div
                    key={slug}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/80 transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full ${cfg.color} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800 text-sm">{cfg.name}</span>
                        {p.accumulated && (
                          <span className="text-[9px] font-black uppercase bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded tracking-wider">
                            Acum.
                          </span>
                        )}
                        {today && (
                          <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded tracking-wider">
                            Hoje
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{formatDate(p.nextDate)}</p>
                    </div>
                    <span className={`text-sm font-black ${cfg.textColor}`}>
                      {formatCurrency(p.nextPrize)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Últimas Apostas ───────────────────────────────────── */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-black text-gray-800 text-sm uppercase tracking-wider flex items-center gap-2">
              <Ticket className="w-4 h-4 text-blue-500" /> Últimas Apostas
            </h3>
            <Link
              to="/history"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Ver todas <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : recentTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Ticket className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">Nenhuma aposta salva ainda.</p>
              <Link
                to="/generator"
                className="mt-3 text-xs font-bold text-blue-600 hover:underline"
              >
                Gerar meu primeiro jogo →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentTickets.map(ticket => {
                const cfg = LOTTERIES[ticket.lotterySlug as LotteryGame];
                if (!cfg) return null;
                return (
                  <div
                    key={ticket.id}
                    className="px-5 py-3.5 hover:bg-gray-50/80 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded text-white bg-gradient-to-r ${cfg.gradient}`}
                        >
                          {cfg.name}
                        </span>
                        {ticket.contestNumber && (
                          <span className="text-xs text-gray-500">
                            Concurso {ticket.contestNumber}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {ticket.numbers.slice(0, 10).map(n => (
                        <span
                          key={n}
                          className={`w-7 h-7 text-[10px] font-black flex items-center justify-center rounded-full text-white bg-gradient-to-br ${cfg.gradient} shadow-sm`}
                        >
                          {n.toString().padStart(2, '0')}
                        </span>
                      ))}
                      {ticket.numbers.length > 10 && (
                        <span className="w-7 h-7 text-[10px] font-bold flex items-center justify-center rounded-full bg-gray-100 text-gray-500">
                          +{ticket.numbers.length - 10}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
