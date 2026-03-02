import React, { useMemo } from 'react';
import { Users, PieChart } from 'lucide-react';

export interface Participant {
  id: string;
  name: string;
  quota: number; // Valor financeiro
  paid: boolean;
}

interface SyndicateConfigProps {
  colorClass: string;
  textColorClass: string;
  borderColorClass: string;
  participants: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  totalCost: number; // from the generated games quantity * price per game
  ticketPrice: number;
}

export const SyndicateConfig: React.FC<SyndicateConfigProps> = ({
  colorClass,
  textColorClass,
  borderColorClass,
  participants,
  setParticipants,
  totalCost,
  ticketPrice,
}) => {
  const FIXED_PARTICIPANTS = ['Carlos', 'Debora', 'Jessica', 'Joyce', 'Karine', 'Wesley'];

  const toggleParticipant = (name: string) => {
    const existing = participants.find(p => p.name === name);
    if (existing) {
      setParticipants(prev => prev.filter(p => p.id !== existing.id));
    } else {
      setParticipants(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          name,
          quota: ticketPrice,
          paid: false,
        },
      ]);
    }
  };

  const adjustQuota = (id: string, amount: number) => {
    setParticipants(prev =>
      prev.map(p => (p.id === id ? { ...p, quota: Math.max(ticketPrice, p.quota + amount) } : p))
    );
  };

  const togglePaid = (id: string) => {
    setParticipants(prev => prev.map(p => (p.id === id ? { ...p, paid: !p.paid } : p)));
  };

  const currentTotal = useMemo(
    () => participants.reduce((sum, p) => sum + p.quota, 0),
    [participants]
  );

  const missingAmount = totalCost - currentTotal;

  // Gerar cores dinâmicas para o gráfico
  // Construir o conic-gradient para o gráfico de donut
  const conicGradientStr = useMemo(() => {
    if (participants.length === 0 || totalCost === 0) return 'transparent';
    const chartColors = [
      '#6366f1',
      '#10b981',
      '#f59e0b',
      '#ec4899',
      '#8b5cf6',
      '#14b8a6',
      '#f43f5e',
    ];

    let startPercentage = 0;
    const segments = participants.map((p, index) => {
      const percentage = (p.quota / Math.max(totalCost, currentTotal)) * 100;
      const endPercentage = startPercentage + percentage;
      const color = chartColors[index % chartColors.length];
      const segment = `${color} ${startPercentage}% ${endPercentage}%`;
      startPercentage = endPercentage;
      return segment;
    });

    // Se faltar valor, preencher com cinza
    if (totalCost > currentTotal) {
      segments.push(`#e5e7eb ${startPercentage}% 100%`);
    }

    return `conic-gradient(${segments.join(', ')})`;
  }, [participants, totalCost, currentTotal]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8 animate-fadeIn">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg text-white ${colorClass}`}>
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Cotas do Bolão</h2>
            <p className="text-sm text-gray-500">Adicione participantes e gerencie os custos</p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm font-semibold text-gray-500">Custo Total Previsto</div>
          <div
            className={`text-2xl font-bold ${currentTotal === totalCost ? 'text-emerald-500' : 'text-gray-800'}`}
          >
            R$ {totalCost.toFixed(2).replace('.', ',')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
        {/* Toggle List */}
        <div className="space-y-4 bg-gray-50/50 p-5 rounded-2xl border border-gray-100 shadow-inner">
          <div className="flex items-center justify-between mb-4 border-b border-gray-200/60 pb-3">
            <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest">
              Membros do Rateio
            </h3>
            <span className="text-xs font-bold text-gray-500 bg-white px-3 py-1.5 shadow-sm border border-gray-200 rounded-lg">
              Cota Base: R$ {ticketPrice.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <div className="space-y-2">
            {FIXED_PARTICIPANTS.map(name => {
              const activeParticipant = participants.find(p => p.name === name);
              const isActive = !!activeParticipant;

              return (
                <div
                  key={name}
                  className={`flex flex-col p-3.5 rounded-xl border transition-all duration-300 ${isActive ? 'bg-white border-caixa-blue/30 shadow-md ring-1 ring-caixa-blue/5' : 'bg-transparent border-transparent hover:bg-gray-100 hover:border-gray-200'}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={isActive}
                          onChange={() => toggleParticipant(name)}
                        />
                        <div
                          className={`w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all shadow-inner ${isActive ? 'bg-caixa-blue' : ''}`}
                        ></div>
                      </label>
                      <span
                        className={`font-black text-sm tracking-wide ${isActive ? 'text-caixa-blue' : 'text-gray-500'}`}
                      >
                        {name}
                      </span>
                    </div>

                    {isActive && (
                      <button
                        type="button"
                        onClick={() => togglePaid(activeParticipant.id)}
                        className={`text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg font-black transition-colors shadow-sm ml-auto ${
                          activeParticipant.paid
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                            : 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200'
                        }`}
                      >
                        {activeParticipant.paid ? 'Pago' : 'Pendente'}
                      </button>
                    )}
                  </div>

                  {isActive && (
                    <div className="flex flex-wrap items-center justify-center sm:justify-between gap-3 mt-3 bg-gray-50 py-2.5 px-4 rounded-xl border border-gray-100 shadow-sm animate-fadeIn">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:block">
                        Aporte
                      </span>
                      <div className="flex items-center justify-center w-full sm:w-auto gap-3">
                        <button
                          type="button"
                          onClick={() => adjustQuota(activeParticipant.id, -ticketPrice)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-500 hover:border-red-200 font-black transition-colors shadow-sm text-lg"
                        >
                          -
                        </button>
                        <span className="text-sm font-black text-gray-800 min-w-[80px] text-center bg-white py-1.5 px-2 rounded-lg border border-gray-200">
                          R$ {activeParticipant.quota.toFixed(2).replace('.', ',')}
                        </span>
                        <button
                          type="button"
                          onClick={() => adjustQuota(activeParticipant.id, ticketPrice)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-emerald-50 hover:text-emerald-500 hover:border-emerald-200 font-black transition-colors shadow-sm text-base"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Gráfico de Cotas */}
        <div className="flex flex-col items-center justify-center bg-gray-50 border border-gray-100 rounded-xl p-6 relative">
          <h3 className="absolute top-4 left-6 text-sm font-bold text-gray-500 flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            Divisão do Bolão
          </h3>

          <div className="relative w-40 h-40 mt-6">
            <div
              className="absolute inset-0 rounded-full shadow-inner transition-all duration-500"
              style={{ background: conicGradientStr }}
            ></div>
            {/* Inner Circle for Donut effect */}
            <div className="absolute inset-2 bg-gray-50 rounded-full flex flex-col items-center justify-center shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Arrecadado
              </span>
              <span className="text-lg font-black text-gray-800">
                R$ {currentTotal.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          <div className="mt-6 w-full space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span className="font-medium">Total Arrecadado</span>
              <span className="font-bold">R$ {currentTotal.toFixed(2).replace('.', ',')}</span>
            </div>

            {missingAmount > 0 && (
              <div className="flex justify-between text-amber-600">
                <span className="font-medium">Falta Arrecadar</span>
                <span className="font-bold border-b border-amber-600/30">
                  R$ {missingAmount.toFixed(2).replace('.', ',')}
                </span>
              </div>
            )}
            {missingAmount < 0 && (
              <div className={`flex justify-between ${textColorClass}`}>
                <span className="font-medium">Valor Sobrando</span>
                <span className={`font-bold border-b ${borderColorClass}`}>
                  R$ {Math.abs(missingAmount).toFixed(2).replace('.', ',')}
                </span>
              </div>
            )}
            {missingAmount === 0 && currentTotal > 0 && (
              <div className={`flex justify-between text-emerald-600`}>
                <span className="font-medium flex items-center gap-1">Bolão Fechado 🎉</span>
                <span className={`font-bold border-b border-emerald-600/30`}>R$ 0,00</span>
              </div>
            )}

            <div className="flex justify-between text-gray-800 pt-2 border-t border-gray-200">
              <span className="font-bold text-xs uppercase tracking-wider text-gray-500">
                Custo Previsto
              </span>
              <span className="font-black text-md">
                R$ {totalCost.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
