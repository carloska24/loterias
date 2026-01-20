import { useState, useEffect } from 'react';
import { Check, Users } from 'lucide-react';

const NAMES = ['Carlos', 'Debora', 'Karine', 'Jessica', 'Joyce'];

interface ParticipantsSelectorProps {
  onSelectionChange: (selected: string[]) => void;
  colorClass?: string; // e.g. 'bg-green-500' or specific lottery color
}

export const ParticipantsSelector = ({
  onSelectionChange,
  colorClass = 'bg-blue-600',
}: ParticipantsSelectorProps) => {
  // Default everyone selected? Or no one? Let's say all selected by default is friendlier for this group.
  const [selected, setSelected] = useState<string[]>(NAMES);

  useEffect(() => {
    onSelectionChange(selected);
  }, [selected, onSelectionChange]);

  const toggleParticipant = (name: string) => {
    if (selected.includes(name)) {
      setSelected(selected.filter(n => n !== name));
    } else {
      setSelected([...selected, name]);
    }
  };

  // Extract base color for border/text usage if needed, but let's keep it simple with dynamic classes
  const activeClass = colorClass.replace('bg-', 'ring-');

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-fadeIn">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-gray-400" />
        <h3 className="font-bold text-gray-700">Quem vai participar do Bolão?</h3>
        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium">
          {selected.length} selecionado{selected.length !== 1 && 's'}
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        {NAMES.map(name => {
          const isSelected = selected.includes(name);
          const initial = name.charAt(0);

          return (
            <button
              key={name}
              onClick={() => toggleParticipant(name)}
              className={`
                group relative flex items-center gap-3 pl-2 pr-4 py-2 rounded-full transition-all duration-200 border
                ${
                  isSelected
                    ? `border-transparent bg-gray-50 shadow-md ring-2 ${activeClass}`
                    : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'
                }
              `}
            >
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                  ${isSelected ? `${colorClass} text-white` : 'bg-gray-200 text-gray-500'}
                `}
              >
                {isSelected ? <Check className="w-4 h-4" /> : initial}
              </div>

              <span className={`font-medium ${isSelected ? 'text-gray-800' : 'text-gray-400'}`}>
                {name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
