import { useState, useEffect, useCallback } from 'react';
import { LotterySelector } from '../components/ui/LotterySelector';
import { LOTTERIES, type LotteryGame } from '../constants/lotteries';
import { getResults, getSpecificResult, type PaginatedResults } from '../services/api';
import { Loader2, Search, Calendar, Hash, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DrawResult {
  id: string;
  contestNumber: number;
  date: string;
  numbers: number[];
}

const calcMetrics = (numbers: number[]) => {
  let even = 0,
    odd = 0,
    sum = 0;
  for (const n of numbers) {
    if (n % 2 === 0) even++;
    else odd++;
    sum += n;
  }
  return { even, odd, sum };
};

export const Results = () => {
  const [selectedGame, setSelectedGame] = useState<LotteryGame>('megasena');
  const [loading, setLoading] = useState(false);
  const [resultsData, setResultsData] = useState<PaginatedResults | null>(null);
  const [page, setPage] = useState(1);
  const [searchContest, setSearchContest] = useState('');
  const [searchResult, setSearchResult] = useState<DrawResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const limit = 20;

  const config = LOTTERIES[selectedGame];

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      setResultsData(await getResults(selectedGame, page, limit));
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }, [selectedGame, page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);
  useEffect(() => {
    setPage(1);
    setSearchContest('');
    setSearchResult(null);
    setSearchError('');
  }, [selectedGame]);

  const handleSearch = async () => {
    const num = parseInt(searchContest.trim(), 10);
    if (isNaN(num)) return;
    setSearchLoading(true);
    setSearchError('');
    setSearchResult(null);
    try {
      const res = await getSpecificResult(selectedGame, num);
      setSearchResult(res);
    } catch {
      setSearchError(`Concurso ${num} não encontrado ou não sincronizado.`);
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchContest('');
    setSearchResult(null);
    setSearchError('');
  };

  const displayResults: DrawResult[] = searchResult
    ? [searchResult]
    : ((resultsData?.data as unknown as DrawResult[]) ?? []);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div className="text-center space-y-1">
        <h1 className="text-3xl font-black text-gray-800">Resultados Oficiais</h1>
        <p className="text-gray-500 text-sm">
          Histórico completo sincronizado com a Caixa Econômica Federal.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <LotterySelector selected={selectedGame} onSelect={setSelectedGame} />
          </div>
          {/* Busca por concurso */}
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <div className="relative">
              <input
                type="number"
                placeholder="Nº do concurso"
                value={searchContest}
                onChange={e => setSearchContest(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 ring-caixa-blue/20 w-44 bg-white"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <button
              onClick={handleSearch}
              disabled={!searchContest || searchLoading}
              className={`px-4 py-2.5 rounded-xl font-bold text-white text-sm transition-all bg-gradient-to-r ${config.gradient} shadow-sm hover:shadow-md disabled:opacity-50`}
            >
              {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
            </button>
            {(searchResult || searchError) && (
              <button
                onClick={clearSearch}
                className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-4">
          {searchError && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2">
              <Search className="w-4 h-4 shrink-0" /> {searchError}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className={`w-10 h-10 animate-spin ${config.textColor}`} />
            </div>
          ) : displayResults.length > 0 ? (
            displayResults.map(draw => {
              const metrics = calcMetrics(draw.numbers);
              return (
                <div
                  key={draw.id || draw.contestNumber}
                  className="lottery-card overflow-hidden animate-fadeIn"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-50 px-5 py-3.5 gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${config.color} shrink-0`}>
                        <Hash className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-black text-gray-800">Concurso {draw.contestNumber}</h3>
                        {draw.date && (
                          <div className="flex items-center gap-1 text-xs text-gray-400 font-medium mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(draw.date).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 text-[11px] font-bold shrink-0">
                      <span className="metric-badge metric-ok">P:{metrics.even}</span>
                      <span className="metric-badge bg-indigo-50 text-indigo-700 border-indigo-200">
                        Í:{metrics.odd}
                      </span>
                      <span className="metric-badge bg-orange-50 text-orange-700 border-orange-200">
                        Σ={metrics.sum}
                      </span>
                    </div>
                  </div>
                  <div className="px-5 py-5 flex flex-wrap justify-center gap-2.5">
                    {draw.numbers
                      .sort((a, b) => a - b)
                      .map(n => (
                        <span
                          key={n}
                          className={`draw-ball text-white bg-gradient-to-br ${config.gradient} border border-white/20 shadow-md hover:scale-110 transition-transform`}
                        >
                          {n.toString().padStart(2, '0')}
                        </span>
                      ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-400 py-12 text-sm">
              Nenhum resultado encontrado.
            </div>
          )}

          {/* Paginação */}
          {!searchResult && resultsData && resultsData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 disabled:opacity-40 text-gray-600 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
              <span className="text-sm font-bold text-gray-500">
                <span className={`${config.textColor}`}>{page}</span> /{' '}
                {resultsData.pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(resultsData.pagination.totalPages, p + 1))}
                disabled={page === resultsData.pagination.totalPages}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 disabled:opacity-40 text-gray-600 transition-colors"
              >
                Próximo <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
