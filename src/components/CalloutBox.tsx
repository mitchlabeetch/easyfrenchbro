import React from 'react';
import { clsx } from 'clsx';
import type { CalloutType, CalloutContent, StampTemplate } from '../types';
import { DEFAULT_STAMP_TEMPLATES } from '../types';

// ─────────────────────────────────────────────────────────────────
// CALLOUT BOX COMPONENT
// Renders styled stamp boxes like "FALSE FRIEND", "GRAMMAR", etc.
// ─────────────────────────────────────────────────────────────────

interface CalloutBoxProps {
  type: CalloutType;
  title?: string;
  content: string;
  icon?: string;
  color?: string;
  backgroundColor?: string;
  editable?: boolean;
  onContentChange?: (content: string) => void;
  onTitleChange?: (title: string) => void;
  onDelete?: () => void;
  className?: string;
}

// Get stamp template for a given type
export const getStampTemplate = (type: CalloutType): StampTemplate | undefined => {
  return DEFAULT_STAMP_TEMPLATES.find(t => t.type === type);
};

// Map callout types to default styling
const CALLOUT_STYLES: Record<CalloutType, { icon: string; headerColor: string; backgroundColor: string; label: string }> = {
  grammar: { icon: '📖', headerColor: '#2563eb', backgroundColor: '#eff6ff', label: 'GRAMMAR' },
  culture: { icon: '🏛️', headerColor: '#7c3aed', backgroundColor: '#f5f3ff', label: 'CULTURE' },
  falseFriend: { icon: '⚠️', headerColor: '#dc2626', backgroundColor: '#fef2f2', label: 'FALSE FRIEND' },
  pronunciation: { icon: '🔊', headerColor: '#059669', backgroundColor: '#ecfdf5', label: 'PRONUNCIATION' },
  note: { icon: '📝', headerColor: '#6b7280', backgroundColor: '#f9fafb', label: 'NOTE' },
  spoken: { icon: '💬', headerColor: '#ea580c', backgroundColor: '#fff7ed', label: 'SPOKEN FRENCH' },
  vocab: { icon: '📝', headerColor: '#0891b2', backgroundColor: '#ecfeff', label: 'VOCABULARY' },
  history: { icon: '🏰', headerColor: '#831843', backgroundColor: '#fdf2f8', label: 'HISTORY' },
  background: { icon: '📚', headerColor: '#854d0e', backgroundColor: '#fefce8', label: 'A LITTLE BACKGROUND' },
};

export const CalloutBox: React.FC<CalloutBoxProps> = ({
  type,
  title,
  content,
  icon,
  color,
  backgroundColor,
  editable = false,
  onContentChange,
  onTitleChange,
  onDelete,
  className,
}) => {
  const defaultStyle = CALLOUT_STYLES[type] || CALLOUT_STYLES.note;
  const displayIcon = icon || defaultStyle.icon;
  const displayTitle = title || defaultStyle.label;
  const headerColor = color || defaultStyle.headerColor;
  const bgColor = backgroundColor || defaultStyle.backgroundColor;

  return (
    <div 
      className={clsx(
        'callout-box rounded-lg border-l-4 p-3 my-3 relative group',
        'break-inside-avoid', // Prevent page break inside
        className
      )}
      style={{ 
        backgroundColor: bgColor,
        borderLeftColor: headerColor 
      }}
    >
      {/* Delete button (shown on hover) */}
      {onDelete && (
        <button
          onClick={onDelete}
          className="absolute -top-2 -right-2 w-5 h-5 bg-white border rounded-full shadow-sm 
                     text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 
                     transition-opacity no-print flex items-center justify-center text-xs"
          title="Delete"
        >
          ×
        </button>
      )}

      {/* Header */}
      <div 
        className="callout-header flex items-center gap-2 mb-2"
        style={{ color: headerColor }}
      >
        <span className="callout-icon text-base">{displayIcon}</span>
        {editable && onTitleChange ? (
          <input
            type="text"
            value={displayTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            className="font-bold text-xs uppercase tracking-wide bg-transparent border-none 
                       focus:ring-0 focus:outline-none p-0"
            style={{ color: headerColor }}
          />
        ) : (
          <span className="font-bold text-xs uppercase tracking-wide">{displayTitle}</span>
        )}
      </div>

      {/* Content */}
      {editable && onContentChange ? (
        <textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          className="callout-content w-full text-sm leading-relaxed bg-transparent border-none 
                     resize-none focus:ring-0 focus:outline-none text-gray-800"
          rows={3}
          placeholder="Enter note content..."
        />
      ) : (
        <div className="callout-content text-sm leading-relaxed text-gray-800">
          {content}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// CALLOUT PICKER (for inserting new callouts)
// ─────────────────────────────────────────────────────────────────

interface CalloutPickerProps {
  onSelect: (type: CalloutType) => void;
  onClose: () => void;
  position?: { x: number; y: number };
}

export const CalloutPicker: React.FC<CalloutPickerProps> = ({
  onSelect,
  onClose,
  position,
}) => {
  const calloutTypes: CalloutType[] = [
    'grammar', 'falseFriend', 'culture', 'pronunciation', 
    'spoken', 'vocab', 'history', 'background', 'note'
  ];

  return (
    <div 
      className="fixed z-50 bg-white shadow-xl border rounded-lg p-3 w-72 animate-fade-in"
      style={position ? { top: position.y, left: position.x } : {}}
    >
      <div className="flex justify-between items-center border-b pb-2 mb-3">
        <h4 className="text-xs font-bold text-gray-500">Insert Callout Box</h4>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {calloutTypes.map((type) => {
          const style = CALLOUT_STYLES[type];
          return (
            <button
              key={type}
              onClick={() => {
                onSelect(type);
                onClose();
              }}
              className="flex items-center gap-2 p-2 rounded border hover:border-blue-300 
                         hover:bg-blue-50 transition-colors text-left"
            >
              <span className="text-lg">{style.icon}</span>
              <span className="text-xs font-medium text-gray-700">{style.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// SNIPPET PREVIEW (for snippet library)
// ─────────────────────────────────────────────────────────────────

interface SnippetPreviewProps {
  type: CalloutType;
  onDragStart?: (e: React.DragEvent, type: CalloutType) => void;
}

export const CalloutSnippetPreview: React.FC<SnippetPreviewProps> = ({
  type,
  onDragStart,
}) => {
  const style = CALLOUT_STYLES[type];
  
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, type)}
      className="snippet-item cursor-grab border rounded p-2 hover:border-blue-300 
                 hover:shadow-md transition-all bg-white"
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{style.icon}</span>
        <div>
          <div className="text-xs font-semibold text-gray-700">{style.label}</div>
          <div className="text-[10px] text-gray-400">Drag to insert</div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// CALLOUT CONTENT RENDERER
// Renders a CalloutContent object from the page content
// ─────────────────────────────────────────────────────────────────

interface CalloutContentRendererProps {
  content: CalloutContent;
  editable?: boolean;
  onUpdate?: (updates: Partial<CalloutContent>) => void;
  onDelete?: () => void;
}

export const CalloutContentRenderer: React.FC<CalloutContentRendererProps> = ({
  content,
  editable = false,
  onUpdate,
  onDelete,
}) => {
  return (
    <CalloutBox
      type={content.calloutType}
      title={content.title}
      content={content.content}
      icon={content.icon}
      color={content.color}
      editable={editable}
      onContentChange={(newContent) => onUpdate?.({ content: newContent })}
      onTitleChange={(newTitle) => onUpdate?.({ title: newTitle })}
      onDelete={onDelete}
    />
  );
};

export default CalloutBox;
