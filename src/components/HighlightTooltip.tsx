import React from 'react';
import { Trash2 } from 'lucide-react';
import { useStore } from '../store';

interface HighlightTooltipProps {
  highlightId: string;
  currentColor: string;
  onColorChange: (id: string, color: string) => void;
  onDelete: (id: string) => void;
}

export const HighlightTooltip: React.FC<HighlightTooltipProps> = ({ highlightId, currentColor, onColorChange, onDelete }) => {
  const { theme } = useStore();
  const colors = theme.highlightColors.slice(0, 3); // Take first 3 colors for quick switch

  return (
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 z-50 bg-white shadow-lg rounded-full border p-1 flex items-center gap-1 pointer-events-auto">
      {colors.map(color => (
        <button
          key={color}
          className={`w-4 h-4 rounded-full border ${currentColor === color ? 'ring-2 ring-blue-500' : 'hover:scale-110'}`}
          style={{ backgroundColor: color }}
          onClick={(e) => {
             e.stopPropagation();
             onColorChange(highlightId, color);
          }}
          title={color}
        />
      ))}
      <div className="w-px h-3 bg-gray-200 mx-1"></div>
      <button
        onClick={(e) => {
            e.stopPropagation();
            onDelete(highlightId);
        }}
        className="text-gray-400 hover:text-red-500 p-0.5 rounded-full hover:bg-red-50"
        title="Remove Highlight"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
};
