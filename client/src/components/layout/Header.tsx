import { Bell, User } from 'lucide-react';

export const Header = () => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shadow-sm sticky top-0 z-10 w-full">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Olá, Apostador</h2>
        <p className="text-sm text-gray-500">Vamos buscar o prêmio máximo hoje?</p>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 text-gray-400 hover:text-caixa-blue transition-colors">
          <Bell className="w-6 h-6" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-caixa-orange rounded-full border-2 border-white"></span>
        </button>

        <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-gray-700">Carlos Pereira</p>
            <p className="text-xs text-gray-500">Plano Premium</p>
          </div>
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200 text-gray-500">
            <User className="w-6 h-6" />
          </div>
        </div>
      </div>
    </header>
  );
};
