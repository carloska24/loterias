import { type LotteryGame, LOTTERIES } from '../../constants/lotteries';
import { type PrizeData } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, CalendarDays, Zap } from 'lucide-react';

import bannerMegasena from '../../assets/banner_megasena.png';
import bannerLotofacil from '../../assets/banner_lotofacil.png';
import bannerLotomania from '../../assets/banner_lotomania.png';
import bannerQuina from '../../assets/banner_quina.png';

// ── Mapa de identidade visual por loteria ──────────────────────────────
const LOTTERY_META: Record<
  LotteryGame,
  {
    banner: string;
    accent: string; // cor de destaque hex para badge / glow
    overlay: string; // gradient semi-transparente sobre a imagem
    textShadow: string; // shadow no prémio
    badgeBg: string;
    badgeText: string;
  }
> = {
  megasena: {
    banner: bannerMegasena,
    accent: '#16a34a',
    overlay:
      'linear-gradient(105deg, rgba(4,60,30,0.88) 0%, rgba(4,60,30,0.60) 50%, rgba(4,60,30,0.30) 100%)',
    textShadow: '0 0 32px rgba(52,211,153,0.6)',
    badgeBg: '#fbbf24',
    badgeText: '#78350f',
  },
  lotofacil: {
    banner: bannerLotofacil,
    accent: '#db2777',
    overlay:
      'linear-gradient(105deg, rgba(88,0,80,0.90) 0%, rgba(88,0,80,0.60) 50%, rgba(88,0,80,0.25) 100%)',
    textShadow: '0 0 32px rgba(244,114,182,0.6)',
    badgeBg: '#fbbf24',
    badgeText: '#78350f',
  },
  lotomania: {
    banner: bannerLotomania,
    accent: '#ea580c',
    overlay:
      'linear-gradient(105deg, rgba(120,45,0,0.90) 0%, rgba(120,45,0,0.60) 50%, rgba(120,45,0,0.25) 100%)',
    textShadow: '0 0 32px rgba(251,146,60,0.6)',
    badgeBg: '#fbbf24',
    badgeText: '#78350f',
  },
  quina: {
    banner: bannerQuina,
    accent: '#2563eb',
    overlay:
      'linear-gradient(105deg, rgba(10,15,80,0.92) 0%, rgba(10,15,80,0.65) 50%, rgba(10,15,80,0.25) 100%)',
    textShadow: '0 0 32px rgba(96,165,250,0.6)',
    badgeBg: '#fbbf24',
    badgeText: '#78350f',
  },
};

interface LotteryBannerProps {
  selected: LotteryGame;
  prizeData: PrizeData | undefined;
  loading: boolean;
}

export const LotteryBanner = ({ selected, prizeData, loading }: LotteryBannerProps) => {
  const lottery = LOTTERIES[selected];
  const meta = LOTTERY_META[selected];
  const isAccumulated = prizeData?.accumulated;

  const formatCurrency = (val: number | null) => {
    if (!val) return '—';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Em breve';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={selected}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.98 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full overflow-hidden rounded-2xl shadow-2xl mb-6"
        style={{ minHeight: 160 }}
      >
        {/* ── Imagem de Fundo ─────────────────────────────────────── */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${meta.banner})`, backgroundPosition: 'center 40%' }}
        />

        {/* ── Overlay Gradiente (lê da esquerda, imagem fica à direita) ── */}
        <div className="absolute inset-0" style={{ background: meta.overlay }} />

        {/* ── Barra colorida superior ──────────────────────────────── */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: `linear-gradient(90deg, ${meta.accent}, transparent)` }}
        />

        {/* ── Conteúdo ─────────────────────────────────────────────── */}
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 md:p-6">
          {/* Esquerdo: Logo + Nome + Badge */}
          <div className="flex items-center gap-4">
            {/* Ícone com glassmorphism */}
            {/* Bolinha com o ícone preenchendo edge-to-edge */}
            <div
              className="w-[72px] h-[72px] rounded-2xl shrink-0 overflow-hidden border-2"
              style={{
                borderColor: 'rgba(255,255,255,0.30)',
                boxShadow: `0 4px 28px ${meta.accent}70, 0 0 0 1px rgba(255,255,255,0.10)`,
              }}
            >
              <img src={lottery.icon} alt={lottery.name} className="w-full h-full object-cover" />
            </div>

            <div>
              {/* Badges row */}
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-[2px] text-white/60">
                  Caixa Econômica Federal
                </span>
                {isAccumulated && (
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest"
                    style={{
                      background: meta.badgeBg,
                      color: meta.badgeText,
                      boxShadow: `0 2px 12px ${meta.badgeBg}88`,
                    }}
                  >
                    <Zap className="w-2.5 h-2.5" />
                    Acumulou!
                  </motion.span>
                )}
              </div>

              {/* Nome da loteria */}
              <h2
                className="text-3xl md:text-4xl font-black tracking-tight text-white leading-none"
                style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
              >
                {lottery.name}
              </h2>

              <p className="text-white/60 text-xs font-medium mt-1">
                {lottery.totalNumbers} números · Sorteio oficial
              </p>
            </div>
          </div>

          {/* Direito: Prêmio + Data */}
          <div
            className="w-full md:w-auto rounded-xl p-4 md:px-6 md:py-4 border shrink-0"
            style={{
              background: 'rgba(0,0,0,0.35)',
              backdropFilter: 'blur(16px)',
              borderColor: 'rgba(255,255,255,0.12)',
            }}
          >
            {/* Label */}
            <p className="text-[10px] font-bold uppercase tracking-[2px] text-white/60 flex items-center gap-1.5 mb-1">
              <Trophy className="w-3 h-3" />
              Prêmio Estimado
            </p>

            {/* Valor */}
            {loading ? (
              <div
                className="h-10 w-52 rounded-lg animate-pulse"
                style={{ background: 'rgba(255,255,255,0.12)' }}
              />
            ) : (
              <p
                className="text-4xl md:text-5xl font-black tracking-tighter text-white leading-none"
                style={{ textShadow: meta.textShadow }}
              >
                {formatCurrency(prizeData?.nextPrize || null)}
              </p>
            )}

            {/* Próximo sorteio */}
            <div
              className="flex items-center gap-1.5 mt-2 pt-2 border-t"
              style={{ borderColor: 'rgba(255,255,255,0.12)' }}
            >
              <CalendarDays className="w-3 h-3 text-white/50" />
              <p className="text-xs text-white/70 font-medium">
                Próximo: {loading ? '...' : formatDate(prizeData?.nextDate || null)}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
