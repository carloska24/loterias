import { useState } from 'react';
import { ChevronDown, ChevronUp, Brain, TrendingUp, History, Scale } from 'lucide-react';

export const SystemExplanation = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="max-w-4xl mx-auto mt-8 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">
              Como funciona a Inteligência Estatística?
            </h3>
            <p className="text-sm text-gray-500">
              Entenda a lógica matemática por trás dos palpites
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="p-6 pt-0 border-t border-gray-100 bg-gray-50/30 animate-fadeIn">
          <div className="grid md:grid-cols-3 gap-6 pt-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-blue-600 font-semibold">
                <TrendingUp className="w-5 h-5" />
                <h4>Estratégia de Frequência</h4>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Analisa todo o histórico de sorteios para identificar os{' '}
                <strong>números quentes</strong>. A teoria é que em curtos períodos, certos números
                tendem a sair mais vezes devido a imperfeições físicas microscópicas ou tendências
                de momento.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-600 font-semibold">
                <History className="w-5 h-5" />
                <h4>Estratégia de Atraso</h4>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Baseada na "Lei dos Grandes Números". Se um número não sai há muito tempo (está{' '}
                <strong>frio</strong>), a estatística sugere que sua probabilidade de sair aumenta a
                cada novo sorteio para "equilibrar" a média histórica.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600 font-semibold">
                <Scale className="w-5 h-5" />
                <h4>Equilíbrio (Recomendado)</h4>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Nossa IA cruza os dados de Frequência e Atraso. Ela busca números que têm boa
                frequência histórica mas que não saem há um tempo razoável, criando o{' '}
                <strong>ponto ideal</strong> de probabilidade para o seu jogo.
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">
            <strong>Nota Importante:</strong> Loterias são jogos de azar. Nosso sistema utiliza
            matemática pura para otimizar suas chances evitando combinações improváveis, mas não
            garante premiação. Jogue com responsabilidade.
          </div>
        </div>
      )}
    </div>
  );
};
