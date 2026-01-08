import { TrendingUp, Award, Calendar, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface StatCardProps {
  title: string;
  value: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

const StatCard = ({ title, value, label, icon: Icon, color }: StatCardProps) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
        +12% este mês
      </span>
    </div>
    <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
    <p className="text-gray-500 text-sm">{label}</p>
    <p className="text-xs text-gray-400 mt-2">{title}</p>
  </div>
);

export const DashboardHome = () => {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Visão Geral</h1>
          <p className="text-gray-500">Acompanhe seus jogos e estatísticas.</p>
        </div>
        <Link
          to="/generator"
          className="bg-caixa-orange text-white px-6 py-2.5 rounded-lg font-medium hover:bg-orange-600 transition-shadow shadow-md hover:shadow-lg"
        >
          Gerar Novo Jogo
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Jogos Salvos"
          value="12"
          label="Jogos ativos para o próximo concurso"
          icon={Calendar}
          color="bg-blue-600"
        />
        <StatCard
          title="Assertividade Média"
          value="42%"
          label="Baseado nos últimos 10 concursos"
          icon={TrendingUp}
          color="bg-green-600"
        />
        <StatCard
          title="Economia Estimada"
          value="R$ 150"
          label="Evitando jogos repetidos ou ruins"
          icon={Award}
          color="bg-purple-600"
        />
      </div>

      {/* Recent Games Table Placeholder */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">Próximos Jogos</h3>
          <span className="text-sm text-caixa-blue font-medium cursor-pointer">Ver todos</span>
        </div>
        <div className="p-6 text-center text-gray-500 py-12">
          <p>Você ainda não gerou jogos para os próximos concursos.</p>
        </div>
      </div>
    </div>
  );
};
