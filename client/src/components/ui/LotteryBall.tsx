interface LotteryBallProps {
  number: number;
  colorClass: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LotteryBall = ({ number, colorClass, size = 'md' }: LotteryBallProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  return (
    <div
      className={`
        ${sizeClasses[size]} 
        ${colorClass} 
        rounded-full flex items-center justify-center 
        font-bold text-white shadow-md relative overflow-hidden font-sans shrink-0
      `}
    >
      {/* Brilho/Reflexo para efeito 3D - Gradiente radial simulado com linear + overlay */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/50 via-transparent to-black/10 pointer-events-none" />

      {/* Sombra interna sutil na parte inferior */}
      <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />

      {/* Número com leve sombra de texto para contraste */}
      <span className="relative z-10 drop-shadow-sm">{number.toString().padStart(2, '0')}</span>
    </div>
  );
};
