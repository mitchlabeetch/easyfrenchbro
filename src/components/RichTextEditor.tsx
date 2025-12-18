import React, { useState } from 'react';
import { Bold, Italic, Underline, Strikethrough, X, Save } from 'lucide-react';
import { TextStyle } from '../types';

interface RichTextEditorProps {
  initialText: string;
  initialStyles: TextStyle[];
  onSave: (text: string, styles: TextStyle[], shouldSync?: boolean) => void;
  onCancel: () => void;
  position: { x: number, y: number };
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  initialText, 
  initialStyles, 
  onSave, 
  onCancel,
  position 
}) => {
  const [text, setText] = useState(initialText);
  const [styles, setStyles] = useState<TextStyle[]>(initialStyles);
  
  // Selection state
  const [selectedWordIndices, setSelectedWordIndices] = useState<number[]>([]);

  const handleWordClick = (index: number) => {
     if (selectedWordIndices.includes(index)) {
         setSelectedWordIndices(selectedWordIndices.filter(i => i !== index));
     } else {
         setSelectedWordIndices([...selectedWordIndices, index]);
     }
  };

  const applyStyleToSelection = (styleKey: keyof Omit<TextStyle, 'wordId'>) => {
      const newStyles = [...styles];
      
      selectedWordIndices.forEach(index => {
          // Find existing style for this word index
          // We need a stable ID for the word. In this ephemeral editor, index is proxy for ID?
          // No, we need to map back to original IDs if possible or generate new ones.
          // Let's use a temporary ID convention: "temp-idx"
          const tempWordId = `temp-${index}`;
          
          let styleEntry = newStyles.find(s => s.wordId === tempWordId);
          if (!styleEntry) {
              styleEntry = { wordId: tempWordId };
              newStyles.push(styleEntry);
          }
          
          // Toggle
          if (styleEntry[styleKey]) {
              delete styleEntry[styleKey];
          } else {
              styleEntry[styleKey] = true;
          }
      });
      
      setStyles(newStyles);
  };

  const handleSave = () => {
      // Map temp IDs back to real relative IDs (0, 1, 2...)
      // The parent component needs to reconcile these styles with the actual line data
      // So we return styles with "relative index" based IDs? 
      // ACTUALLY: The styles prop uses `wordId`.
      // We should probably pass the styles back with their associated word INDICES or internal IDs.
      // Let's assume onSave handles the mapping if we provide index-based styles.
      
      const cleanStyles = styles.map(s => ({
          ...s,
          wordId: s.wordId.replace('temp-', '') // Convert "temp-0" -> "0"
      }));
      
      onSave(text, cleanStyles);
  };

  return (
    <div 
      className="fixed z-50 bg-white shadow-xl border rounded-lg p-4 w-96 font-sans"
      style={{ top: position.y, left: position.x }}
    >
      <div className="flex justify-between items-center mb-2 border-b pb-2">
        <h3 className="text-sm font-bold text-gray-700">Edit Text & Style</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
           <X size={16} />
        </button>
      </div>

      <div className="flex gap-2 mb-3">
         <button 
           onClick={() => applyStyleToSelection('bold')}
           className="p-1 border rounded hover:bg-gray-50" title="Bold"
         >
           <Bold size={16} />
         </button>
         <button 
           onClick={() => applyStyleToSelection('italic')}
           className="p-1 border rounded hover:bg-gray-50" title="Italic"
         >
           <Italic size={16} />
         </button>
         <button 
           onClick={() => applyStyleToSelection('underline')}
           className="p-1 border rounded hover:bg-gray-50" title="Underline"
         >
           <Underline size={16} />
         </button>
         <button 
           onClick={() => applyStyleToSelection('strikethrough')}
           className="p-1 border rounded hover:bg-gray-50" title="Strikethrough"
         >
           <Strikethrough size={16} />
         </button>
      </div>

      {/* Editable Area - For content changes */}
      <textarea
        className="w-full h-24 border rounded p-2 text-sm mb-3 resize-none font-serif"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {/* Styling Area - Interactive Words */}
      <div className="bg-gray-50 border rounded p-2 mb-3 h-32 overflow-y-auto text-sm leading-relaxed">
         <p className="text-xs text-gray-400 mb-1">Click words to select, then apply styles:</p>
         <div className="flex flex-wrap gap-1">
             {text.split(/\s+/).filter(Boolean).map((word, idx) => {
                 const tempId = `temp-${idx}`;
                 const style = styles.find(s => s.wordId === tempId);
                 const isSelected = selectedWordIndices.includes(idx);
                 
                 return (
                     <span
                       key={idx}
                       onClick={() => handleWordClick(idx)}
                       className={`cursor-pointer px-1 rounded transition-colors ${isSelected ? 'bg-blue-200 text-blue-800' : 'hover:bg-gray-200'}`}
                       style={{
                           fontWeight: style?.bold ? 'bold' : 'normal',
                           fontStyle: style?.italic ? 'italic' : 'normal',
                           textDecoration: `${style?.underline ? 'underline' : ''} ${style?.strikethrough ? 'line-through' : ''}`
                       }}
                     >
                        {word}
                     </span>
                 );
             })}
         </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          <Save size={16} /> Save
        </button>
        <button
          onClick={() => {
            // Map temp IDs back to real relative IDs and trigger sync
            const cleanStyles = styles.map(s => ({
                ...s,
                wordId: s.wordId.replace('temp-', '')
            }));
            onSave(text, cleanStyles, true); // shouldSync = true
          }}
          className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center gap-2"
          title="Save and sync styles to linked words in the other language"
        >
          <Save size={16} /> Sync & Save
        </button>
      </div>
    </div>
  );
};
