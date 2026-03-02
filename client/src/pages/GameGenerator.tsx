import { useState, useEffect } from 'react';
import { LotterySelector } from '../components/ui/LotterySelector';
import { LotteryBanner } from '../components/ui/LotteryBanner';
import { LOTTERIES, type LotteryGame } from '../constants/lotteries';
import {
  Wand2,
  Loader2,
  AlertCircle,
  Database,
  Users,
  Printer,
  Save,
  Check,
  CheckCircle,
} from 'lucide-react';
import {
  generateGames,
  importData,
  getLatestPrizes,
  getLatestResult,
  saveTickets,
  type PrizeData,
} from '../services/api';
import { SyndicateConfig, type Participant } from '../components/ui/SyndicateConfig';

const GAME_PRICES: Record<LotteryGame, number> = {
  megasena: 6.0,
  lotofacil: 3.5,
  lotomania: 3.0,
  quina: 3.0,
};

interface GameMetrics {
  even: number;
  odd: number;
  sum: number;
  sumOk: boolean;
  rangeOk: boolean;
}
interface GeneratedGame {
  numbers: number[];
  metrics: GameMetrics;
}

// ──── Toggle Neumórfico ──────────────────────────────────────────────────────
const NeuToggle = ({
  checked,
  onChange,
  activeColor,
}: {
  checked: boolean;
  onChange: () => void;
  activeColor: string;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    className={`relative w-14 h-7 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400 transition-all duration-300 ${
      checked ? 'neumorphic-active' : 'neumorphic-base'
    }`}
  >
    {/* Thumb */}
    <span
      className={`absolute top-[4px] left-[4px] w-[19px] h-[19px] neumorphic-thumb
        ${checked ? `neumorphic-thumb-active ${activeColor}` : 'bg-white'}
        ${checked ? 'translate-x-7' : 'translate-x-0'}`}
      style={{
        transitionProperty: 'transform, background-color',
        transitionDuration: '300ms, 250ms',
        transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1), ease',
      }}
    />
  </button>
);
// ─────────────────────────────────────────────────────────────────────────────

export const GameGenerator = () => {
  const [selectedGame, setSelectedGame] = useState<LotteryGame>('megasena');
  const [strategy, setStrategy] = useState('balanced');
  const [quantity, setQuantity] = useState(3);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [generatedGames, setGeneratedGames] = useState<GeneratedGame[]>([]);
  const [probAnyPrizeOdds, setProbAnyPrizeOdds] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [prizes, setPrizes] = useState<Record<string, PrizeData>>({});
  const [loadingPrizes, setLoadingPrizes] = useState(true);

  useEffect(() => {
    getLatestPrizes()
      .then(data => {
        const map = data.reduce(
          (acc, curr) => {
            acc[curr.slug] = curr;
            return acc;
          },
          {} as Record<string, PrizeData>
        );
        setPrizes(map);
      })
      .catch(console.error)
      .finally(() => setLoadingPrizes(false));
  }, []);

  const [isSyndicateMode, setIsSyndicateMode] = useState(false);
  const [syndicateGroups, setSyndicateGroups] = useState<Record<string, Participant[]>>({
    megasena: [],
    lotofacil: [],
    lotomania: [],
    quina: [],
  });

  const participants = syndicateGroups[selectedGame] || [];
  const setParticipants = (setter: React.SetStateAction<Participant[]>) => {
    setSyndicateGroups(prev => {
      const cur = prev[selectedGame] || [];
      const updated = typeof setter === 'function' ? setter(cur) : setter;
      return { ...prev, [selectedGame]: updated };
    });
  };

  const config = LOTTERIES[selectedGame];
  const ticketPrice = GAME_PRICES[selectedGame];
  const totalCost = quantity * ticketPrice;

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setGeneratedGames([]);
    setProbAnyPrizeOdds(null);
    const minDelay = new Promise(res => setTimeout(res, 900)); // mínimo 0.9s visual
    try {
      const [result] = await Promise.all([
        generateGames(selectedGame, strategy, quantity),
        minDelay,
      ]);
      setGeneratedGames(result.games || []);
      if (result.probAnyPrizeOdds) setProbAnyPrizeOdds(result.probAnyPrizeOdds);
    } catch {
      await minDelay;
      setError(
        'Erro ao gerar jogos. O banco de dados pode estar vazio. Clique em "Sincronizar" primeiro.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError('');
    try {
      await importData(selectedGame);
      setTimeout(() => setSyncing(false), 3000);
    } catch {
      setError('Falha ao acionar a sincronização.');
      setSyncing(false);
    }
  };

  const handleSelectGame = (game: LotteryGame) => {
    setSelectedGame(game);
    setGeneratedGames([]);
    setError('');
    setSaveSuccess(false);
    setProbAnyPrizeOdds(null);
  };

  const handleSaveTickets = async () => {
    if (!generatedGames.length) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      let nextContestNumber: number | undefined;
      try {
        const res = await getLatestResult(selectedGame);
        if (res?.contestNumber) nextContestNumber = res.contestNumber + 1;
      } catch {
        /* silencioso */
      }

      const ticketsToSave = generatedGames.map(g => ({
        lotterySlug: selectedGame,
        contestNumber: nextContestNumber,
        numbers: g.numbers,
        cost: ticketPrice,
        isSyndicate: isSyndicateMode,
        participants: isSyndicateMode
          ? participants.map(p => ({ name: p.name, quota: p.quota }))
          : [],
      }));
      await saveTickets(ticketsToSave);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch {
      setError('Erro ao salvar os bilhetes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full mx-auto space-y-8 print:w-full print:max-w-none print:m-0 print:p-0 print:space-y-0">
      {/* ── Tela Desktop ──────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto space-y-8 print:hidden">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-black text-gray-800">Gerador Inteligente</h1>
          <p className="text-gray-500 text-sm">IA estatística com filtros matemáticos avançados.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden print:hidden max-w-4xl mx-auto">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <LotterySelector selected={selectedGame} onSelect={handleSelectGame} />
        </div>

        <div className="p-6 md:p-8">
          <LotteryBanner
            selected={selectedGame}
            prizeData={prizes[selectedGame]}
            loading={loadingPrizes}
          />

          {/* ── Cabeçalho + Botão Gerar ─── */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-xl font-black text-gray-800 tracking-tight">
                Configure seus Palpites
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Filtros de soma e faixas aplicados automaticamente.
              </p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading || (isSyndicateMode && participants.length === 0)}
              className={`group relative w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white transition-all duration-300 bg-gradient-to-r ${config.gradient} shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Wand2 className="w-5 h-5" />
              )}
              {loading ? 'Gerando...' : 'Gerar Palpites'}
            </button>
          </div>

          {/* ── Toggle Bolão NEUMÓRFICO ─── */}
          <div className="mb-8 flex items-center justify-between p-5 bg-[#eef1f5] rounded-2xl shadow-[6px_6px_12px_#c8ccd3,-6px_-6px_12px_#ffffff]">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl transition-colors ${isSyndicateMode ? `${config.color} text-white shadow-md` : 'bg-white/60 text-gray-400'}`}
              >
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-700">Modo Bolão</h3>
                <p className="text-xs text-gray-500">
                  Divida os jogos com amigos e gere o termo de rateio.
                </p>
              </div>
            </div>
            <NeuToggle
              checked={isSyndicateMode}
              onChange={() => setIsSyndicateMode(v => !v)}
              activeColor={config.color}
            />
          </div>

          {isSyndicateMode && (
            <SyndicateConfig
              colorClass={config.color}
              textColorClass={config.textColor}
              borderColorClass={config.borderColor}
              participants={participants}
              setParticipants={setParticipants}
              totalCost={totalCost}
              ticketPrice={ticketPrice}
            />
          )}

          {/* ── Grid Principal ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Configuração */}
            <div className="lg:col-span-5 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Estratégia</label>
                <select
                  value={strategy}
                  onChange={e => setStrategy(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 ring-caixa-blue/20 outline-none text-sm font-medium"
                >
                  <option value="balanced">⚖️ Equilíbrio Estatístico (Recomendado)</option>
                  <option value="frequency">🔥 Frequência (Mais sorteados)</option>
                  <option value="delay">❄️ Atraso (Mais atrasados)</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-bold text-gray-700">Quantidade de Jogos</label>
                  <span className={`text-sm font-black ${config.textColor}`}>{quantity}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  className="w-full accent-caixa-blue cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-400 font-medium">
                  <span>1</span>
                  <span>10</span>
                  <span>20</span>
                  <span>35</span>
                  <span>50</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Custo Total
                </p>
                <p className={`text-2xl font-black ${config.textColor}`}>
                  R$ {totalCost.toFixed(2).replace('.', ',')}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {quantity}× R$ {ticketPrice.toFixed(2).replace('.', ',')}
                </p>
              </div>

              {/* Probabilidades da loteria */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                  Odds por Prize
                </p>
                <div className="space-y-1.5">
                  {config.prizeTable.map(pt => (
                    <div key={pt.label} className="flex justify-between text-xs">
                      <span className="text-gray-600 font-medium">{pt.label}</span>
                      <span className="font-black text-gray-800">
                        1:{pt.odds.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
                {probAnyPrizeOdds && (
                  <div
                    className={`mt-3 pt-3 border-t border-gray-200 flex justify-between text-xs font-black ${config.textColor}`}
                  >
                    <span>Ganhar qualquer prêmio</span>
                    <span>1:{probAnyPrizeOdds.toLocaleString('pt-BR')}</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleSync}
                disabled={syncing || loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm"
              >
                {syncing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-caixa-blue" />
                ) : (
                  <Database className="w-4 h-4 text-caixa-blue" />
                )}
                {syncing ? 'Atualizando...' : 'Sincronizar Resultados'}
              </button>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-start gap-2 border border-red-100">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}
            </div>

            {/* Preview dos Jogos */}
            <div className="lg:col-span-7 bg-gray-50 rounded-2xl p-5 border border-gray-100 flex flex-col gap-4 max-h-[650px] overflow-y-auto custom-scrollbar relative">
              {generatedGames.length > 0 ? (
                <>
                  <div className="sticky top-0 bg-gray-50 pt-1 pb-3 z-10 flex items-center justify-between border-b border-gray-200">
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
                      <span
                        className={`w-1.5 h-5 rounded-full bg-gradient-to-b ${config.gradient}`}
                      />
                      {generatedGames.length} Jogos Gerados
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveTickets}
                        disabled={isSaving || saveSuccess}
                        className={`flex items-center gap-1.5 text-xs font-bold text-white px-3 py-2 rounded-xl shadow-sm transition-all ${saveSuccess ? 'bg-emerald-500' : `bg-gradient-to-r ${config.gradient} hover:shadow-md hover:-translate-y-0.5`} disabled:opacity-70`}
                      >
                        {isSaving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : saveSuccess ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        {saveSuccess ? 'Salvo!' : isSaving ? 'Salvando...' : 'Salvar Nuvem'}
                      </button>
                      <button
                        onClick={() => window.print()}
                        className={`flex items-center gap-1.5 text-xs font-bold ${config.textColor} bg-white border border-gray-200 px-3 py-2 rounded-xl shadow-sm hover:shadow-md transition-all`}
                      >
                        <Printer className="w-3.5 h-3.5" /> Imprimir
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {generatedGames.map((game, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow animate-fadeIn"
                      >
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-50">
                          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                            Bilhete {(idx + 1).toString().padStart(2, '0')}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {/* Badge de Soma */}
                            <span
                              className={`metric-badge ${game.metrics.sumOk ? 'metric-ok' : 'metric-warn'}`}
                            >
                              {game.metrics.sumOk ? (
                                <CheckCircle className="inline w-2.5 h-2.5 mr-0.5" />
                              ) : null}
                              Σ={game.metrics.sum}
                            </span>
                            {/* Badge Par/Ímpar */}
                            <span className="metric-badge bg-indigo-50 text-indigo-700 border-indigo-200">
                              P:{game.metrics.even} Í:{game.metrics.odd}
                            </span>
                            {/* Badge Faixas */}
                            <span
                              className={`metric-badge ${game.metrics.rangeOk ? 'metric-ok' : 'metric-warn'}`}
                            >
                              {game.metrics.rangeOk ? 'Faixas ✓' : 'Faixas ⚠'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {game.numbers.map(num => (
                            <span
                              key={num}
                              className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-black text-white shadow-md bg-gradient-to-br ${config.gradient} border border-white/20`}
                            >
                              {num.toString().padStart(2, '0')}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                    <Wand2 className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-400 text-sm">
                    Configure e clique em <strong>Gerar Palpites</strong>.
                  </p>
                  <p className="text-xs text-gray-300 mt-1">
                    Filtros matemáticos aplicados automaticamente.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── IMPRESSÃO PREMIUM ─────────────────────────────────────── */}
      <div className="hidden print:block w-full bg-white">
        <style>{`
          @media print {
            @page { margin: 1.2cm 1cm; }
            .gen-header {
              background: linear-gradient(135deg, #1e3a8a 0%, #6d28d9 60%, #db2777 100%) !important;
              -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
              border-radius: 14px; padding: 20px 24px; margin-bottom: 20px; page-break-inside: avoid;
            }
            .gen-header h1 { color: #fff; font-size: 22px; font-weight: 900; margin: 0; }
            .gen-header p  { color: rgba(255,255,255,0.80); font-size: 12px; margin: 4px 0 0; }
            .gen-badge {
              background: rgba(255,255,255,0.18); color: #fff; font-size: 10px; font-weight: 700;
              border-radius: 999px; padding: 3px 10px; letter-spacing: 0.5px;
            }
            .gen-ticket {
              border-radius: 12px; padding: 12px 16px; margin-bottom: 8px;
              page-break-inside: avoid; border: 1.5px solid #e5e7eb;
              display: flex; justify-content: space-between; align-items: center; gap: 12px;
            }
            .gen-ticket-label { font-size: 11px; font-weight: 900; color: #111827; white-space: nowrap; }
            .gen-ball {
              display: inline-flex; align-items: center; justify-content: center;
              width: 30px; height: 30px; border-radius: 50%;
              font-size: 11px; font-weight: 900; color: #fff; margin: 2px;
              -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
            }
            .gen-metrics {
              font-size: 9px; font-weight: 700; white-space: nowrap;
              padding: 3px 8px; border-radius: 6px; margin-left: 8px;
              -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
            }
            .gen-syndicate {
              border-radius: 12px; overflow: hidden; margin-bottom: 16px;
              border: 1.5px solid #e5e7eb; page-break-inside: avoid;
            }
            .gen-syndicate-hd {
              padding: 12px 18px; font-size: 9px; font-weight: 900;
              letter-spacing: 1.5px; text-transform: uppercase; color: #fff;
              -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
            }
            .gen-syndicate-row {
              display: grid; grid-template-columns: 1fr 1fr 1.5fr; align-items: center;
              padding: 8px 18px; font-size: 11px; font-weight: 700;
              border-bottom: 1px solid rgba(0,0,0,0.05);
            }
            .gen-syndicate-row:nth-child(even) {
              background: rgba(0,0,0,0.02);
              -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
            }
            .gen-sig { border-bottom: 1px solid #9ca3af; height: 16px; }
          }
        `}</style>

        {generatedGames.length > 0 &&
          (() => {
            const gradientMap: Record<string, string> = {
              megasena: 'linear-gradient(135deg,#10b981,#065f46)',
              lotofacil: 'linear-gradient(135deg,#ec4899,#be185d)',
              lotomania: 'linear-gradient(135deg,#f97316,#c2410c)',
              quina: 'linear-gradient(135deg,#3b82f6,#1e40af)',
            };
            const syndicateGrad: Record<string, string> = {
              megasena: 'linear-gradient(135deg,#1e3a8a,#6d28d9)',
              lotofacil: 'linear-gradient(135deg,#be185d,#7c3aed)',
              lotomania: 'linear-gradient(135deg,#c2410c,#92400e)',
              quina: 'linear-gradient(135deg,#1e40af,#4c1d95)',
            };
            const ballGrad = gradientMap[selectedGame] || 'linear-gradient(135deg,#6366f1,#4338ca)';
            const synGrad =
              syndicateGrad[selectedGame] || 'linear-gradient(135deg,#4338ca,#7c3aed)';

            return (
              <div>
                {/* ── HEADER ── */}
                <div className="gen-header">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div>
                      <h1>🎰 Recibo Oficial · Loterias AI</h1>
                      <p style={{ marginTop: 6 }}>
                        <strong style={{ color: '#fff', fontSize: 14 }}>{config.name}</strong>
                        <span>
                          {' '}
                          · Emitido em {new Date().toLocaleDateString('pt-BR')} às{' '}
                          {new Date().toLocaleTimeString('pt-BR').slice(0, 5)}
                        </span>
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="gen-badge">
                        {quantity} jogos · R$ {totalCost.toFixed(2).replace('.', ',')}
                      </span>
                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 6 }}>
                        Filtros: Soma ✓ · Faixas ✓ · Par/Ímpar ✓
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── BOLÃO / TERMO DE RATEIO ── */}
                {isSyndicateMode && participants.length > 0 && (
                  <div className="gen-syndicate" style={{ marginBottom: 20 }}>
                    <div className="gen-syndicate-hd" style={{ background: synGrad }}>
                      👥 Termo de Rateio Oficial · {participants.length} Participantes
                    </div>
                    <div
                      style={{
                        padding: '4px 18px 4px',
                        fontSize: 9,
                        fontWeight: 800,
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        color: '#6b7280',
                        borderBottom: '1px solid #e5e7eb',
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr' }}>
                        <span>Participante</span>
                        <span>Cota (R$)</span>
                        <span>Assinatura</span>
                      </div>
                    </div>
                    {participants.map((p, i) => (
                      <div key={p.id} className="gen-syndicate-row">
                        <span style={{ fontWeight: 900 }}>
                          {(i + 1).toString().padStart(2, '0')} · {p.name.toUpperCase()}
                        </span>
                        <span style={{ fontWeight: 900 }}>
                          R$ {p.quota.toFixed(2).replace('.', ',')}
                        </span>
                        <div className="gen-sig" />
                      </div>
                    ))}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        padding: '10px 18px',
                        borderTop: '1.5px solid #e5e7eb',
                      }}
                    >
                      <span style={{ fontWeight: 900, fontSize: 12 }}>
                        Total Arrecadado: R$ {totalCost.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                )}

                {/* ── VOLANTES ── */}
                <p
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    color: '#6b7280',
                    paddingBottom: 8,
                    borderBottom: '2px solid #e5e7eb',
                    marginBottom: 10,
                  }}
                >
                  🎟 Relação de Volantes · {quantity} fechamentos · Filtros Matemáticos OK ✓
                </p>

                {generatedGames.map((game, idx) => (
                  <div key={idx} className="gen-ticket">
                    <div>
                      <div className="gen-ticket-label" style={{ marginBottom: 6 }}>
                        Jogo {(idx + 1).toString().padStart(2, '0')}
                      </div>
                      <div>
                        {game.numbers.map(num => (
                          <span key={num} className="gen-ball" style={{ background: ballGrad }}>
                            {num.toString().padStart(2, '0')}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        alignItems: 'flex-end',
                        flexShrink: 0,
                      }}
                    >
                      <span
                        className="gen-metrics"
                        style={{
                          background: game.metrics.sumOk ? '#d1fae5' : '#fef3c7',
                          color: game.metrics.sumOk ? '#065f46' : '#92400e',
                        }}
                      >
                        Σ = {game.metrics.sum} {game.metrics.sumOk ? '✓' : '⚠'}
                      </span>
                      <span
                        className="gen-metrics"
                        style={{ background: '#ede9fe', color: '#5b21b6' }}
                      >
                        P:{game.metrics.even} Í:{game.metrics.odd}
                      </span>
                      <span
                        className="gen-metrics"
                        style={{
                          background: game.metrics.rangeOk ? '#dbeafe' : '#fef3c7',
                          color: game.metrics.rangeOk ? '#1e40af' : '#92400e',
                        }}
                      >
                        Faixas {game.metrics.rangeOk ? '✓' : '⚠'}
                      </span>
                    </div>
                  </div>
                ))}

                {/* ── RODAPÉ ── */}
                <div
                  style={{
                    marginTop: 24,
                    paddingTop: 12,
                    borderTop: '1px solid #e5e7eb',
                    textAlign: 'center',
                  }}
                >
                  <p
                    style={{
                      fontSize: 9,
                      color: '#9ca3af',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontWeight: 700,
                    }}
                  >
                    Documento não fiscal · Apresente este recibo à casa lotérica junto com o volante
                    registrado
                    <br />
                    Gerado por Loterias AI · {new Date().toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            );
          })()}
      </div>
    </div>
  );
};
