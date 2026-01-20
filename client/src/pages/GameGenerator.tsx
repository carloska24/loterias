import { useState } from 'react';
import { LotterySelector } from '../components/ui/LotterySelector';
import { LOTTERIES, type LotteryGame } from '../constants/lotteries';
import { Wand2, Loader2, AlertCircle, RefreshCw, Database, FileText } from 'lucide-react';
import { generateGames, importData } from '../services/api';
import { SystemExplanation } from '../components/ui/SystemExplanation';
import { ParticipantsSelector } from '../components/ui/ParticipantsSelector';
import { generatePDF } from '../services/pdfService';
import { PrizeBanner } from '../components/ui/PrizeBanner';
import { LotteryBall } from '../components/ui/LotteryBall';

export const GameGenerator = () => {
  const [selectedGame, setSelectedGame] = useState<LotteryGame>('megasena');
  const [strategy, setStrategy] = useState('balanced');
  const [quantity, setQuantity] = useState(3);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [generatedGames, setGeneratedGames] = useState<number[][]>([]);
  const [error, setError] = useState('');

  const [successMsg, setSuccessMsg] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);

  const config = LOTTERIES[selectedGame];

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    setGeneratedGames([]);

    try {
      // Map frontend ID to slug if needed, for now they match
      const result = await generateGames(selectedGame, strategy, quantity);
      setGeneratedGames(result.games);
    } catch (err) {
      console.error(err);
      setError(
        'Erro ao gerar jogos. O banco de dados pode estar vazio. Tente atualizar a base de dados.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDB = async () => {
    setUpdating(true);
    setError('');
    setSuccessMsg('');
    try {
      await importData(selectedGame);
      setSuccessMsg(
        `Base de dados da ${config.name} atualizada com sucesso! Agora você pode gerar jogos.`
      );
    } catch (err) {
      console.error(err);
      setError('Erro ao atualizar base de dados. Verifique a conexão com o servidor.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadPDF = async () => {
    await generatePDF({
      lotteryName: config.name,
      games: generatedGames,
      participants: participants,
      strategy: strategy,
      logoUrl: config.icon,
    });
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-800">Gerador Inteligente</h1>
        <p className="text-gray-500">Utilize nossa IA estatística para criar jogos otimizados.</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <PrizeBanner key={selectedGame} lotterySlug={selectedGame} colorClass={config.color} />
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden max-w-4xl mx-auto">
        {/* Header / Selector */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <LotterySelector selected={selectedGame} onSelect={setSelectedGame} />

          <button
            onClick={handleUpdateDB}
            disabled={updating || loading}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-caixa-blue transition-colors px-4 py-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200"
            title="Baixar últimos resultados"
          >
            {updating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            {updating ? 'Atualizando Base...' : 'Atualizar Base de Dados'}
          </button>
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
              disabled={loading || updating}
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
              <ParticipantsSelector onSelectionChange={setParticipants} colorClass={config.color} />

              <div className="h-px bg-gray-100 my-4" />

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
                <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm flex items-start gap-2 animate-fadeIn">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm flex items-start gap-2 animate-fadeIn border border-green-100">
                  <RefreshCw className="w-5 h-5 shrink-0 mt-0.5" />
                  {successMsg}
                </div>
              )}
            </div>

            {/* Preview Column (Volante Mockup) */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex flex-col gap-4 max-h-[500px] overflow-y-auto custom-scrollbar">
              {generatedGames.length > 0 ? (
                <>
                  <div className="sticky top-0 bg-gray-50 pb-2 z-10 flex flex-col gap-2">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest text-center">
                      Jogos Gerados
                    </h3>
                    <button
                      onClick={handleDownloadPDF}
                      className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:text-caixa-blue hover:border-caixa-blue transition-all shadow-sm"
                    >
                      <FileText className="w-4 h-4" />
                      Baixar PDF
                    </button>
                  </div>

                  {generatedGames.map((game, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 animate-fadeIn"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-gray-400 block">
                          Jogo {idx + 1}
                        </span>
                        {participants.length > 0 && (
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {participants.map(name => (
                              <div
                                key={name}
                                title={name}
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] text-white font-bold ring-1 ring-white ${config.color}`}
                              >
                                {name.charAt(0)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {game.map(num => (
                          <LotteryBall key={num} number={num} colorClass={config.color} size="sm" />
                        ))}
                      </div>

                      {participants.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-gray-50 text-center">
                          <p className="text-[10px] text-gray-400">
                            Participantes:{' '}
                            <span className="font-medium text-gray-600">
                              {participants.join(', ')}
                            </span>
                          </p>
                        </div>
                      )}
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

      <SystemExplanation />
    </div>
  );
};
