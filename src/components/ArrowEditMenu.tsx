import React from 'react';
import { Trash2, X, MoveHorizontal } from 'lucide-react';
import { ArrowStyle, ArrowHeadStyle } from '../types';

interface ArrowEditMenuProps {
  arrowId: string;
  currentStyle: ArrowStyle;
  currentHeadStyle: ArrowHeadStyle;
  currentWidth: number;
  currentColor: string;
  onUpdate: (id: string, updates: any) => void; // Using any for partial ArrowConnector
  onDelete: (id: string) => void;
  onClose: () => void;
  position?: { x: number; y: number };
}

const ARROW_STYLES: { value: ArrowStyle; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' }
];

const ARROW_HEADS: { value: ArrowHeadStyle; label: string }[] = [
  { value: 'arrow', label: 'Arrow' },
  { value: 'dot', label: 'Dot' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'none', label: 'None' }
];

export const ArrowEditMenu: React.FC<ArrowEditMenuProps> = ({
  arrowId,
  currentStyle,
  currentHeadStyle,
  currentWidth,
  currentColor,
  onUpdate,
  onDelete,
  onClose,
  position
}) => {
  const style = position 
    ? { top: position.y, left: position.x }
    : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

  return (
    <div 
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-3 w-64 animate-in fade-in zoom-in-95 duration-200"
      style={style}
    >
      <div className="flex justify-between items-center mb-3 border-b pb-2">
        <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
          <MoveHorizontal size={12} /> Edit Arrow
        </h4>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
        >
          <X size={14} />
        </button>
      </div>

      <div className="space-y-3">
        {/* Style */}
        <div>
          <label className="block text-[10px] text-gray-500 mb-1">Style</label>
          <div className="grid grid-cols-3 gap-1">
            {ARROW_STYLES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onUpdate(arrowId, { style: value })}
                className={`px-2 py-1 text-xs border rounded ${
                  currentStyle === value 
                    ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' 
                    : 'hover:bg-gray-50 text-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Head */}
        <div>
          <label className="block text-[10px] text-gray-500 mb-1">Head</label>
          <div className="grid grid-cols-4 gap-1">
            {ARROW_HEADS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onUpdate(arrowId, { headStyle: value })}
                className={`px-1 py-1 text-[10px] border rounded ${
                  currentHeadStyle === value 
                    ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' 
                    : 'hover:bg-gray-50 text-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Width Slider */}
        <div>
          <label className="flex justify-between text-[10px] text-gray-500 mb-1">
            <span>Width</span>
            <span>{currentWidth}px</span>
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={currentWidth}
            onChange={(e) => onUpdate(arrowId, { strokeWidth: Number(e.target.value) })}
            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Color - For now simpler logic or passed from palette? 
            Let's providing a color picker or reset to default palette color?
            User asked for "Style / Shape / Width / Delete". Color is implicit maybe.
            I'll add a simple color picker input for flexibility.
        */}
        <div>
           <label className="block text-[10px] text-gray-500 mb-1">Color</label>
           <div className="flex gap-2 items-center">
             <input 
                type="color" 
                value={currentColor} 
                onChange={(e) => onUpdate(arrowId, { color: e.target.value })}
                className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
             />
             <span className="text-xs text-gray-400 font-mono">{currentColor}</span>
           </div>
        </div>

        <div className="pt-2 border-t mt-2">
          <button
            onClick={() => {
                if(confirm("Delete this arrow?")) {
                    onDelete(arrowId);
                    onClose();
                }
            }}
            className="w-full py-1.5 flex items-center justify-center gap-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-100 transition-colors"
          >
            <Trash2 size={12} /> Delete Arrow
          </button>
        </div>
      </div>
    </div>
  );
};
