import { Construction } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ComingSoon = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
      <div className="bg-blue-50 p-6 rounded-full">
        <Construction className="w-16 h-16 text-caixa-blue" />
      </div>
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Em Construção</h1>
        <p className="text-gray-500 max-w-md mx-auto">
          Estamos preparando esta funcionalidade com o padrão de qualidade das Loterias.
        </p>
      </div>
      <Link
        to="/"
        className="px-6 py-3 bg-caixa-blue text-white rounded-lg font-bold hover:bg-blue-800 transition-colors"
      >
        Voltar ao Início
      </Link>
    </div>
  );
};
