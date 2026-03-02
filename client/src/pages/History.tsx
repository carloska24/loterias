import { useState, useEffect } from 'react';
import { LotterySelector } from '../components/ui/LotterySelector';
import { LOTTERIES, type LotteryGame } from '../constants/lotteries';
import {
  getLatestResult,
  getSavedTickets,
  getSpecificResult,
  deleteSavedTicket,
  deleteAllSavedTickets,
  archiveTicket,
  archiveAllTickets,
} from '../services/api';
import {
  Loader2,
  Printer,
  CheckCircle2,
  Search,
  Trash2,
  Users,
  Ticket,
  Award,
  Database,
  CalendarClock,
  AlertCircle,
  X,
  Archive,
  ArchiveRestore,
  ListTodo,
} from 'lucide-react';

interface LatestResult {
  contestNumber: number;
  date: string;
  numbers: number[];
}
interface Participant {
  name: string;
  quota: number;
}
interface SavedTicket {
  id: string;
  contestNumber: number | null;
  numbers: number[];
  cost: number;
  isSyndicate: boolean;
  archived: boolean;
  participants: Participant[];
  createdAt: string;
  lotterySlug: string;
}

// Barra de progresso de acertos
const HitBar = ({ hits, total, gradient }: { hits: number; total: number; gradient: string }) => {
  const pct = total > 0 ? (hits / total) * 100 : 0;
  const color =
    pct >= 80
      ? 'from-emerald-400 to-emerald-600'
      : pct >= 50
        ? 'from-amber-400 to-orange-500'
        : `${gradient}`;
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="hit-bar flex-1">
        <div className={`hit-bar-fill bg-gradient-to-r ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-black text-gray-500 w-12 text-right">
        {hits}/{total}
      </span>
    </div>
  );
};

export const History = () => {
  const [selectedGame, setSelectedGame] = useState<LotteryGame>('megasena');
  const [loading, setLoading] = useState(false);
  const [loadingResult, setLoadingResult] = useState(false);
  const [latestResult, setLatestResult] = useState<LatestResult | null>(null);
  const [savedTickets, setSavedTickets] = useState<SavedTicket[]>([]);
  const [availableContests, setAvailableContests] = useState<(number | null)[]>([]);
  const [selectedContest, setSelectedContest] = useState<number | null>(null);
  const [userNumbersStr, setUserNumbersStr] = useState('');
  const [manualCheck, setManualCheck] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [isArchivingAll, setIsArchivingAll] = useState(false);

  const config = LOTTERIES[selectedGame];

  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      setLatestResult(null);
      setTicketToDelete(null);
      setIsDeletingAll(false);
      setNotification(null);
      setManualCheck(false);
      try {
        // Traz TODAS as apostas (ativas + arquivadas) de uma vez
        const res = await getSavedTickets(selectedGame, 'all').catch(() => ({ tickets: [] }));
        const tickets: SavedTicket[] = res.tickets || [];
        setSavedTickets(tickets);
        // Concursos das apostas ATIVAS para o seletor
        const activeTickets = tickets.filter(t => !t.archived);
        const contests = Array.from(
          new Set<number | null>(activeTickets.map(t => t.contestNumber))
        ).sort((a, b) => (Number(b) || 0) - (Number(a) || 0));
        setAvailableContests(contests);
        if (contests.length > 0) setSelectedContest(contests[0] as number | null);
        else {
          setSelectedContest(null);
          const gr = await getLatestResult(selectedGame).catch(() => null);
          setLatestResult(gr);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [selectedGame]);

  useEffect(() => {
    if (savedTickets.length === 0 && selectedContest === null) return;
    const fetchResult = async () => {
      setLoadingResult(true);
      try {
        const res =
          selectedContest === null
            ? await getLatestResult(selectedGame).catch(() => null)
            : await getSpecificResult(selectedGame, selectedContest).catch(() => null);
        setLatestResult(res);
      } finally {
        setLoadingResult(false);
      }
    };
    fetchResult();
  }, [selectedContest, selectedGame, savedTickets.length]);

  const handleConfirmDelete = async () => {
    if (!ticketToDelete) return;
    setDeletingId(ticketToDelete);
    const id = ticketToDelete;
    setTicketToDelete(null);
    try {
      await deleteSavedTicket(id);
      const newList = savedTickets.filter(t => t.id !== id);
      setSavedTickets(newList);
      const newContests = Array.from(
        new Set<number | null>(newList.map(t => t.contestNumber))
      ).sort((a, b) => (Number(b) || 0) - (Number(a) || 0));
      setAvailableContests(newContests);
      if (!newContests.includes(selectedContest))
        setSelectedContest(newContests.length > 0 ? (newContests[0] as number | null) : null);
      setNotification({ type: 'success', message: 'Aposta removida com sucesso.' });
    } catch {
      setNotification({ type: 'error', message: 'Falha ao deletar a aposta.' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleArchive = async (id: string, archive: boolean) => {
    setArchivingId(id);
    try {
      await archiveTicket(id, archive);
      setSavedTickets(prev => prev.map(t => (t.id === id ? { ...t, archived: archive } : t)));
      setNotification({
        type: 'success',
        message: archive ? '📦 Aposta arquivada com sucesso.' : '🔓 Aposta restaurada.',
      });
    } catch {
      setNotification({ type: 'error', message: 'Erro ao atualizar a aposta.' });
    } finally {
      setArchivingId(null);
    }
  };

  const handleArchiveAll = async () => {
    setIsArchivingAll(true);
    try {
      await archiveAllTickets(selectedGame);
      setSavedTickets(prev =>
        prev.map(t => (t.lotterySlug === selectedGame ? { ...t, archived: true } : t))
      );
      setAvailableContests([]);
      setSelectedContest(null);
      setNotification({ type: 'success', message: '📦 Todas as apostas foram arquivadas!' });
    } catch {
      setNotification({ type: 'error', message: 'Erro ao arquivar todas as apostas.' });
    } finally {
      setIsArchivingAll(false);
    }
  };

  const handleConfirmDeleteAll = async () => {
    setIsDeletingAll(false);
    setLoading(true);
    try {
      await deleteAllSavedTickets(selectedGame);
      setSavedTickets([]);
      setAvailableContests([]);
      setSelectedContest(null);
      setLatestResult(null);
      setNotification({ type: 'success', message: 'Todas as apostas foram removidas.' });
    } catch {
      setNotification({ type: 'error', message: 'Falha ao limpar apostas.' });
    } finally {
      setLoading(false);
    }
  };

  // Separação: ativas (tab Ativas) e arquivadas (tab Arquivadas)
  const activeTickets = savedTickets.filter(t => !t.archived && t.lotterySlug === selectedGame);
  const archivedTickets = savedTickets.filter(t => t.archived && t.lotterySlug === selectedGame);

  // Visíveis na aba atual
  const filteredTickets =
    activeTab === 'active'
      ? activeTickets.filter(t => t.contestNumber === selectedContest)
      : archivedTickets;

  const userNumbers = userNumbersStr
    .split(/[\s,;-]+/)
    .map(n => parseInt(n.trim(), 10))
    .filter(n => !isNaN(n));
  const checkHits = (nums: number[]) =>
    latestResult ? nums.filter(n => latestResult.numbers.includes(n)) : [];
  const manualHits = manualCheck && latestResult ? checkHits(userNumbers).length : 0;
  const totalCost = filteredTickets.reduce((a, t) => a + t.cost, 0);
  const hitsNeededForMaxPrize = config.maxPrizeHits;
  const isBillionaire = filteredTickets.some(
    t => checkHits(t.numbers).length >= hitsNeededForMaxPrize
  );

  return (
    <div className="w-full mx-auto print:w-full print:m-0 print:p-0">
      {/* ── Desktop ────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto space-y-6 print:hidden">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-black text-gray-800">Conferidor Inteligente</h1>
          <p className="text-gray-500 text-sm">
            Cruzamento automático com os sorteios oficiais da Caixa.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <LotterySelector selected={selectedGame} onSelect={setSelectedGame} />
            <button
              onClick={() => window.print()}
              disabled={!latestResult || savedTickets.length === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white transition-all shadow-md bg-gradient-to-r ${config.gradient} hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50`}
            >
              <Printer className="w-4 h-4" /> Imprimir Extrato
            </button>
          </div>

          {/* ── Abas: Ativas / Arquivadas ────────────────────────── */}
          <div className="flex items-center gap-1 px-4 pt-4 border-b border-gray-100">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-bold transition-all ${
                activeTab === 'active'
                  ? `${config.textColor} border-b-2 ${config.borderColor} bg-white -mb-px`
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <ListTodo className="w-4 h-4" />
              Ativas
              {activeTickets.length > 0 && (
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    activeTab === 'active'
                      ? `${config.color} text-white`
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {activeTickets.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('archived')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-bold transition-all ${
                activeTab === 'archived'
                  ? 'text-amber-600 border-b-2 border-amber-500 bg-white -mb-px'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Archive className="w-4 h-4" />
              Arquivadas
              {archivedTickets.length > 0 && (
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    activeTab === 'archived'
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {archivedTickets.length}
                </span>
              )}
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
            {/* Lado Esquerdo */}
            <div className="xl:col-span-1 space-y-5">
              {/* Resultado Oficial */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 shadow-inner flex flex-col justify-center min-h-[200px]">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
                  Sorteio Oficial Vigente
                </h3>
                {loadingResult || loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
                  </div>
                ) : latestResult ? (
                  <div className="text-center animate-fadeIn">
                    <h2 className={`text-2xl font-black ${config.textColor}`}>
                      Concurso {latestResult.contestNumber}
                    </h2>
                    <p className="text-xs text-gray-400 mb-4 font-medium">
                      {new Date(latestResult.date).toLocaleDateString('pt-BR')}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {latestResult.numbers
                        .sort((a, b) => a - b)
                        .map(num => (
                          <span
                            key={num}
                            className={`draw-ball text-white bg-gradient-to-br ${config.gradient} border border-white/20 shadow-md`}
                          >
                            {num.toString().padStart(2, '0')}
                          </span>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <CalendarClock className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-bold text-sm">
                      {selectedContest
                        ? `Aguardando sorteio do Concurso ${selectedContest}.`
                        : 'Sorteio não sincronizado.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Conferência Avulsa */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="text-xs font-black text-gray-600 mb-3 flex items-center gap-2 uppercase tracking-wider">
                  <Search className="w-3.5 h-3.5" /> Conferência Avulsa
                </h3>
                <textarea
                  value={userNumbersStr}
                  onChange={e => {
                    setUserNumbersStr(e.target.value);
                    setManualCheck(false);
                  }}
                  placeholder="Ex: 04 12 33 45 59 60"
                  className="w-full h-20 p-3 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 ring-caixa-blue/20 outline-none resize-none mb-3"
                />
                <button
                  onClick={() => setManualCheck(true)}
                  disabled={userNumbers.length === 0 || !latestResult}
                  className="w-full py-2.5 bg-gray-800 text-white rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50 text-sm"
                >
                  Conferir Avulso
                </button>
                {manualCheck && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-xl text-center border border-gray-100">
                    <span className="font-black text-gray-800">Acertos: {manualHits}</span>
                    <HitBar
                      hits={manualHits}
                      total={userNumbers.length}
                      gradient={config.gradient}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Lado Direito — Apostas */}
            <div className="xl:col-span-2 bg-gray-50/50 rounded-2xl p-5 border border-gray-100 min-h-[500px]">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
                    <Ticket className={`w-4 h-4 ${config.textColor}`} /> Suas Apostas
                  </h3>
                  <span className="text-xs font-bold bg-white border border-gray-200 text-gray-600 px-2.5 py-0.5 rounded-full shadow-sm">
                    {filteredTickets.length} salvos
                  </span>
                  {activeTab === 'active' && activeTickets.length > 0 && (
                    <>
                      <button
                        onClick={handleArchiveAll}
                        disabled={isArchivingAll}
                        className="ml-1 flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white rounded-lg text-[10px] font-bold transition-colors border border-amber-200 hover:border-amber-500 disabled:opacity-50"
                      >
                        {isArchivingAll ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Archive className="w-3 h-3" />
                        )}
                        Arquivar Tudo
                      </button>
                      <button
                        onClick={() => setIsDeletingAll(true)}
                        className="ml-1 flex items-center gap-1 px-2.5 py-0.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-[10px] font-bold transition-colors border border-red-100 hover:border-red-500"
                      >
                        <Trash2 className="w-3 h-3" /> Esvaziar
                      </button>
                    </>
                  )}
                </div>
                {availableContests.length > 0 && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Concurso:
                    </label>
                    <select
                      value={selectedContest || ''}
                      onChange={e =>
                        setSelectedContest(e.target.value ? Number(e.target.value) : null)
                      }
                      className="bg-white border border-gray-200 text-sm font-black p-2 rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-caixa-blue/20"
                    >
                      {availableContests
                        .filter(c => c !== null)
                        .map(c => (
                          <option key={c} value={c || ''}>
                            {c ? `Concurso ${c}` : 'Apostas Antigas'}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
                </div>
              ) : filteredTickets.length > 0 ? (
                <div className="space-y-3">
                  {filteredTickets.map((ticket, idx) => {
                    const hitsFound = checkHits(ticket.numbers);
                    const isWinner = hitsFound.length >= hitsNeededForMaxPrize;
                    const hasSomeHits = hitsFound.length > 0;
                    return (
                      <div
                        key={ticket.id}
                        className={`bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative group animate-fadeIn ${deletingId === ticket.id ? 'opacity-40 pointer-events-none' : ''}`}
                      >
                        {/* Botões de ação no hover */}
                        <div className="absolute top-3 right-3 z-10 hidden group-hover:flex items-center gap-1 print:hidden">
                          {/* Arquivar / Restaurar */}
                          <button
                            onClick={() => handleArchive(ticket.id, !ticket.archived)}
                            disabled={archivingId === ticket.id}
                            title={ticket.archived ? 'Restaurar aposta' : 'Arquivar aposta'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              ticket.archived
                                ? 'bg-green-50 text-green-500 hover:bg-green-500 hover:text-white'
                                : 'bg-amber-50 text-amber-500 hover:bg-amber-500 hover:text-white'
                            } disabled:opacity-50`}
                          >
                            {archivingId === ticket.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : ticket.archived ? (
                              <ArchiveRestore className="w-3.5 h-3.5" />
                            ) : (
                              <Archive className="w-3.5 h-3.5" />
                            )}
                          </button>
                          {/* Deletar */}
                          <button
                            onClick={() => setTicketToDelete(ticket.id)}
                            className="p-1.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mb-3 pr-8">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              Aposta {(idx + 1).toString().padStart(2, '0')}
                            </span>
                            {ticket.isSyndicate && (
                              <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[9px] font-black border border-blue-100 flex items-center gap-1">
                                <Users className="w-2.5 h-2.5" /> Bolão
                              </span>
                            )}
                          </div>
                          <div
                            className={`px-2.5 py-0.5 rounded-md text-[10px] font-black ${
                              !latestResult
                                ? 'bg-orange-50 text-orange-600'
                                : hasSomeHits
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                  : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {!latestResult
                              ? 'AGUARDANDO SORTEIO'
                              : hasSomeHits
                                ? `${hitsFound.length} ACERTOS`
                                : 'NENHUM ACERTO'}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {ticket.numbers
                            .sort((a, b) => a - b)
                            .map(num => {
                              const isHit = hitsFound.includes(num);
                              return (
                                <span
                                  key={num}
                                  className={`draw-ball ${
                                    isHit
                                      ? `bg-gradient-to-br ${config.gradient} text-white border-white/20 draw-ball-hit`
                                      : 'bg-gray-50 text-gray-500 border-gray-200'
                                  }`}
                                >
                                  {num.toString().padStart(2, '0')}
                                </span>
                              );
                            })}
                        </div>

                        {/* Barra de progresso */}
                        {latestResult && (
                          <HitBar
                            hits={hitsFound.length}
                            total={hitsNeededForMaxPrize}
                            gradient={config.gradient}
                          />
                        )}

                        {isWinner && (
                          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center justify-center gap-2 text-yellow-700 font-black animate-pulse text-sm">
                            <Award className="w-4 h-4" /> PRÊMIO MÁXIMO!
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-20 text-gray-400">
                  <Database className="w-10 h-10 mb-4 opacity-20" />
                  <p className="text-sm">Nenhuma aposta salva para {config.name}.</p>
                  <p className="text-xs mt-1 text-gray-300">
                    Gere jogos e clique em "Salvar na Nuvem".
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── IMPRESSÃO FIEL AO MOCKUP ──────────────────────────────── */}
      <div className="hidden print:block w-full bg-white">
        <style>{`
          @media print {
            @page { margin: 1.5cm 1.2cm; size: A4 portrait; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            body { font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; }

            /* ── HEADER ── */
            .ph { border-radius: 10px; padding: 16px 20px; margin-bottom: 16px; page-break-inside: avoid; }
            .ph h1 { margin: 0 0 4px; font-size: 20px; font-weight: 900; letter-spacing: -0.3px; color: #fff; text-transform: uppercase; }
            .ph .sub { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 6px; }
            .ph .sub-left { color: rgba(255,255,255,0.9); font-size: 12px; font-weight: 700; }
            .ph .sub-right { color: rgba(255,255,255,0.75); font-size: 10px; font-weight: 600; text-align: right; }

            /* ── DEZENAS SORTEADAS ── */
            .pd { border-radius: 10px; padding: 14px 18px; margin-bottom: 16px; page-break-inside: avoid; }
            .pd h2 { font-size: 10px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 10px; }
            .pd-balls { display: flex; flex-wrap: wrap; gap: 6px; }

            /* ── AUDITORIA ── */
            .pa-title { font-size: 11px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase;
              padding: 10px 18px; border-radius: 8px 8px 0 0; color: #fff; margin: 0; }
            .pa-wrap { border: 1.5px solid #e5e7eb; border-radius: 10px; overflow: hidden; margin-bottom: 16px; }
            .pa-row { padding: 8px 14px; border-bottom: 1px solid #f3f4f6; page-break-inside: avoid; }
            .pa-row:last-child { border-bottom: none; }
            .pa-row-top { display: flex; align-items: center; gap: 10px; flex-wrap: nowrap; }
            .pa-label { font-size: 11px; font-weight: 900; color: #111827; width: 64px; flex-shrink: 0; }
            .pa-balls { display: flex; flex-wrap: wrap; gap: 4px; flex: 1; }

            /* Bolinha grande no estilo do mockup */
            .p-ball {
              display: inline-flex; align-items: center; justify-content: center;
              width: 34px; height: 34px; border-radius: 50%;
              font-size: 11px; font-weight: 900; flex-shrink: 0;
              box-sizing: border-box;
            }
            .p-ball-hit { color: #fff; border: 2.5px solid rgba(255,255,255,0.6); }
            .p-ball-miss { background: #f3f4f6; color: #9ca3af; border: 2px solid #e5e7eb; }

            /* Badge de acertos */
            .pa-badge { font-size: 10px; font-weight: 800; padding: 3px 10px; border-radius: 999px;
              white-space: nowrap; flex-shrink: 0; margin-left: auto; }
            .ph-green  { background: #d1fae5; color: #065f46; }
            .ph-amber  { background: #fef3c7; color: #92400e; }
            .ph-red    { background: #fee2e2; color: #991b1b; }
            .ph-gray   { background: #f3f4f6; color: #6b7280; }

            /* Barra de progresso GROSSA */
            .pa-bar { height: 12px; background: #f3f4f6; border-radius: 999px; overflow: hidden; margin: 6px 14px 2px; }
            .pa-bar-fill { height: 100%; border-radius: 999px; }

            /* ── BOLÃO ── */
            .ps-wrap { border: 1.5px solid #e5e7eb; border-radius: 10px; overflow: hidden; margin-top: 16px; page-break-inside: avoid; }
            .ps-hd { padding: 12px 18px; font-size: 11px; font-weight: 900; color: #fff; letter-spacing: 0.5px; }
            .ps-head-row { display: grid; grid-template-columns: 1fr 120px; padding: 6px 18px;
              font-size: 9px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;
              color: #6b7280; border-bottom: 1.5px solid #e5e7eb; }
            .ps-row { display: grid; grid-template-columns: 1fr 120px; padding: 9px 18px;
              font-size: 11px; font-weight: 700; border-bottom: 1px solid #f3f4f6; align-items: center; }
            .ps-row:last-child { border-bottom: none; }
            .ps-row:nth-child(even) { background: #fafafa; }
            .ps-total { display: flex; justify-content: space-between; padding: 10px 18px;
              font-size: 12px; font-weight: 900; border-top: 2px solid #e5e7eb; }

            /* ── PRÊMIO MÁXIMO ── */
            .pw-banner { border-radius: 10px; padding: 18px; text-align: center; margin-top: 16px; page-break-inside: avoid; }
            .pw-banner p { margin: 0; color: #fff; }

            /* ── RODAPÉ ── */
            .pf { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e5e7eb; text-align: center;
              font-size: 9px; color: #9ca3af; font-style: italic; letter-spacing: 0.3px; }
          }
        `}</style>

        {(() => {
          const lotteryColors: Record<
            string,
            { solid: string; light: string; lightText: string; synGrad: string }
          > = {
            megasena: {
              solid: '#059669',
              light: '#ecfdf5',
              lightText: '#065f46',
              synGrad: 'linear-gradient(90deg,#059669,#047857)',
            },
            lotofacil: {
              solid: '#db2777',
              light: '#fdf2f8',
              lightText: '#9d174d',
              synGrad: 'linear-gradient(90deg,#db2777,#be185d)',
            },
            lotomania: {
              solid: '#ea580c',
              light: '#fff7ed',
              lightText: '#c2410c',
              synGrad: 'linear-gradient(90deg,#ea580c,#c2410c)',
            },
            quina: {
              solid: '#2563eb',
              light: '#eff6ff',
              lightText: '#1e40af',
              synGrad: 'linear-gradient(90deg,#2563eb,#1d4ed8)',
            },
          };
          const lc = lotteryColors[selectedGame] || {
            solid: '#6d28d9',
            light: '#f5f3ff',
            lightText: '#4338ca',
            synGrad: 'linear-gradient(90deg,#6d28d9,#4338ca)',
          };

          const ballGrad: Record<string, string> = {
            megasena: 'linear-gradient(155deg,#34d399,#059669)',
            lotofacil: 'linear-gradient(155deg,#f472b6,#db2777)',
            lotomania: 'linear-gradient(155deg,#fb923c,#ea580c)',
            quina: 'linear-gradient(155deg,#60a5fa,#2563eb)',
          };
          const bg = ballGrad[selectedGame] || 'linear-gradient(155deg,#a78bfa,#6d28d9)';

          const syndicateParticipants =
            filteredTickets.find(t => t.isSyndicate)?.participants ?? [];
          const hasSyndicate = filteredTickets.some(t => t.isSyndicate);

          return (
            <div>
              {/* ── HEADER ── */}
              <div className="ph" style={{ background: lc.solid }}>
                <h1>Extrato de Conferência · Loterias AI</h1>
                <div className="sub">
                  <span className="sub-left">
                    <strong>{config.name}</strong>
                    {latestResult && <> · Concurso {latestResult.contestNumber}</>}
                  </span>
                  <span className="sub-right">
                    Auditado em: {new Date().toLocaleDateString('pt-BR')}
                    <br />
                    Resultado sujeito à confirmação da CEF
                  </span>
                </div>
              </div>

              {/* ── DEZENAS SORTEADAS ── */}
              {latestResult && (
                <div className="pd" style={{ background: lc.light }}>
                  <h2 style={{ color: lc.lightText }}>
                    Dezenas Sorteadas Oficialmente ·{' '}
                    {new Date(latestResult.date).toLocaleDateString('pt-BR')}
                  </h2>
                  <div className="pd-balls">
                    {latestResult.numbers
                      .sort((a, b) => a - b)
                      .map(n => (
                        <span key={n} className="p-ball p-ball-hit" style={{ background: bg }}>
                          {n.toString().padStart(2, '0')}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* ── AUDITORIA ── */}
              <div className="pa-wrap">
                <p className="pa-title" style={{ background: lc.solid }}>
                  Auditoria de Apostas
                </p>

                {filteredTickets.map((ticket, idx) => {
                  const hitsFound = checkHits(ticket.numbers);
                  const pct =
                    hitsNeededForMaxPrize > 0
                      ? Math.round((hitsFound.length / hitsNeededForMaxPrize) * 100)
                      : 0;
                  const badgeClass =
                    pct >= 80
                      ? 'ph-green'
                      : pct >= 40
                        ? 'ph-amber'
                        : hitsFound.length > 0
                          ? 'ph-red'
                          : 'ph-gray';
                  const barColor =
                    pct >= 80
                      ? 'linear-gradient(90deg,#10b981,#34d399,#6ee7b7)'
                      : pct >= 40
                        ? 'linear-gradient(90deg,#f59e0b,#fbbf24,#fcd34d)'
                        : 'linear-gradient(90deg,#ef4444,#f87171,#fca5a5)';

                  return (
                    <div key={ticket.id} className="pa-row">
                      <div className="pa-row-top">
                        <span className="pa-label">
                          Jogo {(idx + 1).toString().padStart(2, '0')}
                        </span>
                        <div className="pa-balls">
                          {ticket.numbers
                            .sort((a, b) => a - b)
                            .map(num => {
                              const isHit = hitsFound.includes(num);
                              return (
                                <span
                                  key={num}
                                  className={`p-ball ${isHit ? 'p-ball-hit' : 'p-ball-miss'}`}
                                  style={isHit ? { background: bg } : {}}
                                >
                                  {num.toString().padStart(2, '00')}
                                </span>
                              );
                            })}
                        </div>
                        <span className={`pa-badge ${badgeClass}`}>
                          {hitsFound.length} acertos — {pct}%
                        </span>
                      </div>
                      {/* Barra grossa */}
                      <div className="pa-bar">
                        <div
                          className="pa-bar-fill"
                          style={{
                            width: `${pct}%`,
                            background: pct > 0 ? barColor : 'transparent',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── BOLÃO ── */}
              {hasSyndicate && syndicateParticipants.length > 0 && (
                <div className="ps-wrap">
                  <div className="ps-hd" style={{ background: lc.solid }}>
                    Demonstrativo de Bolão · {filteredTickets.length} apostas
                  </div>
                  <div className="ps-head-row">
                    <span>Participante</span>
                    <span style={{ textAlign: 'right' }}>Cota (R$)</span>
                  </div>
                  {syndicateParticipants.map((p, i) => (
                    <div
                      key={p.name}
                      className="ps-row"
                      style={i % 2 === 0 ? {} : { background: '#fafafa' }}
                    >
                      <span style={{ fontWeight: 700 }}>{p.name}</span>
                      <span style={{ fontWeight: 900, textAlign: 'right' }}>
                        {p.quota.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  ))}
                  <div className="ps-total">
                    <span>CUSTO TOTAL</span>
                    <span>R$ {totalCost.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              )}

              {/* ── PRÊMIO MÁXIMO ── */}
              {isBillionaire && (
                <div
                  className="pw-banner"
                  style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}
                >
                  <p style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>
                    🏆 PRÊMIO MÁXIMO DETECTADO!
                  </p>
                  <p style={{ fontSize: 11, opacity: 0.9 }}>
                    Dirija-se à Caixa Econômica Federal com seus bilhetes originais para retirar o
                    prêmio.
                  </p>
                </div>
              )}

              {/* ── RODAPÉ ── */}
              <div className="pf">
                Documento para fins de conferência. Resultado oficial sujeito à verificação da Caixa
                Econômica Federal. Gerado por Loterias AI · {new Date().toLocaleDateString('pt-BR')}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Toast ─────────────────────────────────────────── */}
      {notification && (
        <div
          className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border w-[90%] md:w-auto max-w-sm animate-slideUp ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <p className="font-bold text-sm">{notification.message}</p>
          <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-70 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Modal Deletar ─────────────────────────────────── */}
      {ticketToDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-red-50 p-6 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                <Trash2 className="w-7 h-7 text-red-500" />
              </div>
              <h2 className="text-lg font-black text-red-900 mb-1">Excluir Aposta?</h2>
              <p className="text-sm text-red-600/80">
                Esta aposta será apagada permanentemente da nuvem.
              </p>
            </div>
            <div className="p-5 flex gap-3">
              <button
                onClick={() => setTicketToDelete(null)}
                className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-md transition-colors text-sm"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Deletar Tudo ─────────────────────────────── */}
      {isDeletingAll && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 animate-slideUp">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-lg font-black text-gray-800 mb-2">Esvaziar Nuvem?</h3>
              <p className="text-gray-500 text-sm">
                Apagar permanentemente <strong>todas as {filteredTickets.length} apostas</strong>?
                Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex border-t border-gray-100">
              <button
                onClick={() => setIsDeletingAll(false)}
                className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-50 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteAll}
                className="flex-1 py-4 bg-red-500 text-white font-black hover:bg-red-600 transition-colors text-sm"
              >
                Limpar Tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
