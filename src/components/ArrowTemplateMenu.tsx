import React from 'react';
import { ArrowStyle, ArrowHeadStyle } from '../types';

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
  if (!isOpen || !position) return null;

  const templates = [
    { label: 'Standard', style: 'solid', head: 'arrow', color: '#000000' },
    { label: 'Dashed Info', style: 'dashed', head: 'dot', color: '#6b7280' },
    { label: 'Important', style: 'solid', head: 'diamond', color: '#ef4444' },
    { label: 'Subtle', style: 'dotted', head: 'none', color: '#d1d5db' },
  ] as const;

  return (
    <div 
      className="fixed z-50 bg-white rounded-lg shadow-xl border p-2 flex flex-col gap-1 w-48"
      style={{ left: position.x, top: position.y }}
    >
      <div className="text-xs font-semibold text-gray-500 mb-1 px-2">Select Style</div>
      {templates.map((t, i) => (
        <button
          key={i}
          className="text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center justify-between group"
          onClick={() => onSelect?.({ style: t.style, headStyle: t.head, color: t.color })}
        >
          <span>{t.label}</span>
          <div className="w-8 h-px bg-current" style={{ borderTopStyle: t.style, color: t.color }} />
        </button>
      ))}
      <hr className="my-1" />
      <button 
        className="text-xs text-center text-gray-400 hover:text-gray-600 py-1"
        onClick={handleClose}
      >
        Cancel
      </button>
    </div>
  );
};
