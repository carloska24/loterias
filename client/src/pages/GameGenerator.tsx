import { useState } from 'react';
import { LotterySelector } from '../components/ui/LotterySelector';
import { LOTTERIES, type LotteryGame } from '../constants/lotteries';
import { Wand2, Loader2, AlertCircle } from 'lucide-react';
import { generateGames } from '../services/api';

export const GameGenerator = () => {
  const [selectedGame, setSelectedGame] = useState<LotteryGame>('megasena');
  const [strategy, setStrategy] = useState('balanced');
  const [quantity, setQuantity] = useState(3);
  const [loading, setLoading] = useState(false);
  const [generatedGames, setGeneratedGames] = useState<number[][]>([]);
  const [error, setError] = useState('');

  const config = LOTTERIES[selectedGame];

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setGeneratedGames([]);

    try {
      // Map frontend ID to slug if needed, for now they match
      const result = await generateGames(selectedGame, strategy, quantity);
      setGeneratedGames(result.games);
    } catch (err) {
      console.error(err);
      setError(
        'Erro ao gerar jogos. O banco de dados pode estar vazio. Tente importar dados primeiro.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-800">Gerador Inteligente</h1>
        <p className="text-gray-500">Utilize nossa IA estatística para criar jogos otimizados.</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header / Selector */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <LotterySelector selected={selectedGame} onSelect={setSelectedGame} />
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className={`text-2xl font-bold ${config.textColor}`}>{config.name}</h2>
              <p className="text-sm text-gray-500">
                Selecione as configurações para gerar seus jogos.
              </p>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-white transition-all shadow-md
                ${config.color} hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Wand2 className="w-5 h-5" />
              )}
              {loading ? 'Gerando...' : 'Gerar Palpites'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Configs Column */}
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">Estratégia</label>
                <select
                  value={strategy}
                  onChange={e => setStrategy(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg bg-white focus:ring-2 ring-caixa-blue/20 outline-none transition-shadow"
                >
                  <option value="balanced">Equilíbrio Estatístico (Recomendado)</option>
                  <option value="frequency">Frequência (Mais sorteados)</option>
                  <option value="delay">Atraso (Quem não sai há muito tempo)</option>
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-sm font-semibold text-gray-700">Quantidade de Jogos</label>
                  <span className="text-sm font-bold text-caixa-blue">{quantity}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  className="w-full accent-caixa-blue cursor-pointer"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}
            </div>

            {/* Preview Column (Volante Mockup) */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex flex-col gap-4 max-h-[500px] overflow-y-auto custom-scrollbar">
              {generatedGames.length > 0 ? (
                <>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest text-center sticky top-0 bg-gray-50 pb-2">
                    Jogos Gerados
                  </h3>
                  {generatedGames.map((game, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 animate-fadeIn"
                    >
                      <span className="text-xs font-bold text-gray-400 mb-2 block">
                        Jogo {idx + 1}
                      </span>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {game.map(num => (
                          <span
                            key={num}
                            className={`
                             w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold text-white shadow-sm
                             ${config.color}
                           `}
                          >
                            {num.toString().padStart(2, '0')}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 opacity-50">
                    <Wand2 className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-400 text-sm italic">
                    Configure e clique em Gerar para visualizar os palpites.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
