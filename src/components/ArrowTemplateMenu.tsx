import React from 'react';
import { GripHorizontal } from 'lucide-react';
import { ArrowStyle, ArrowHeadStyle } from '../types';
import { useDraggable } from '../hooks/useDraggable';

interface ArrowTemplateMenuProps {
  isOpen?: boolean;
  onSelect?: (template: { style: ArrowStyle; headStyle: ArrowHeadStyle; color?: string }) => void;
  onCancel?: () => void;
  onClose?: () => void;
  position?: { x: number; y: number };
}

export const ArrowTemplateMenu: React.FC<ArrowTemplateMenuProps> = ({ 
  isOpen = true, 
  onSelect, 
  onCancel, 
  onClose,
  position 
}) => {
  const handleClose = onCancel || onClose;
  const { position: dragPos, dragHandleProps } = useDraggable({
    initialPosition: position || { x: window.innerWidth / 2 - 96, y: window.innerHeight / 2 - 100 }
  });

  if (!isOpen || !position) return null;

  const templates = [
    { label: 'Standard', style: 'solid', head: 'arrow', color: '#000000' },
    { label: 'Dashed Info', style: 'dashed', head: 'dot', color: '#6b7280' },
    { label: 'Important', style: 'solid', head: 'diamond', color: '#ef4444' },
    { label: 'Subtle', style: 'dotted', head: 'none', color: '#d1d5db' },
  ] as const;

  return (
    <div 
      className="fixed z-[100] bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 w-48 no-print"
      style={{ left: dragPos.x, top: dragPos.y }}
    >
      {/* Drag Handle */}
      <div 
        className="flex items-center justify-between px-3 py-2 border-b dark:border-gray-700 select-none bg-gray-50 dark:bg-gray-900 rounded-t-lg"
        {...dragHandleProps}
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
          <GripHorizontal size={12} className="text-gray-400" />
          Select Style
        </div>
        <button 
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm font-bold"
        >
          ×
        </button>
      </div>
      
      <div className="p-2 flex flex-col gap-1">
        {templates.map((t, i) => (
          <button
            key={i}
            className="text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 rounded flex items-center justify-between group"
            onClick={() => onSelect?.({ style: t.style, headStyle: t.head, color: t.color })}
          >
            <span>{t.label}</span>
            <div className="w-8 h-px bg-current" style={{ borderTopStyle: t.style, color: t.color }} />
          </button>
        ))}
      </div>
    </div>
  );
};
