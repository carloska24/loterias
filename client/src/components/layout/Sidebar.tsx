import { LayoutDashboard, TrendingUp, History, Settings, LogOut, Ticket } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: 'Painel', path: '/' },
  { icon: Ticket, label: 'Gerador de Jogos', path: '/generator' },
  { icon: History, label: 'Meus Jogos', path: '/history' },
  { icon: TrendingUp, label: 'Estatísticas', path: '/stats' },
  { icon: Settings, label: 'Configurações', path: '/settings' },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col fixed left-0 top-0 shadow-sm z-10">
      {/* Brand */}
      <div className="h-16 bg-caixa-blue flex items-center justify-center shadow-md">
        <h1 className="text-white font-bold text-xl tracking-wider uppercase flex items-center gap-2">
          <Ticket className="w-6 h-6 text-caixa-orange" />
          Loterias <span className="text-caixa-orange">AI</span>
        </h1>
      </div>

      {/* Menu */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {MENU_ITEMS.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
                isActive
                  ? 'bg-blue-50 text-caixa-blue border-l-4 border-caixa-blue shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-caixa-blue'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-caixa-blue' : 'text-gray-400'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <button className="flex items-center gap-3 w-full px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors font-medium">
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </aside>
  );
};
