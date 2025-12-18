import React, { useState } from 'react';
import { Bold, Italic, Underline, Strikethrough, X, Save } from 'lucide-react';
import { TextStyle } from '../types';

interface RichTextEditorProps {
  initialText: string;
  initialStyles: TextStyle[];
  onSave: (text: string, styles: TextStyle[], shouldSync?: boolean) => void;
  onCancel: () => void;
  position: { x: number, y: number };
  isEmbedded?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  initialText, 
  initialStyles, 
  onSave, 
  onCancel,
  position,
  isEmbedded = false
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
          const wordId = String(index);
          
          let styleEntry = newStyles.find(s => s.wordId === wordId);
           if (!styleEntry) {
              styleEntry = { wordId: wordId };
              newStyles.push(styleEntry);
          }
          
          // Toggle
          if (styleEntry[styleKey]) {
              delete styleEntry[styleKey];
              // Cleanup empty objects? Maybe not strictly necessary but cleaner
          } else {
              styleEntry[styleKey] = true;
          }
      });
      
      setStyles(newStyles);
  };

  const handleSave = () => {
      // Styles are already mapped to indices "0", "1" etc.
      onSave(text, styles);
  };

  return (
    <div 
      className={isEmbedded ? "bg-white p-4 h-full flex flex-col font-sans" : "fixed z-50 bg-white shadow-xl border rounded-lg p-4 w-96 font-sans"}
      style={isEmbedded ? {} : { top: position.y, left: position.x }}
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
      <div className="bg-gray-50 border rounded p-2 mb-3 flex-1 overflow-y-auto text-sm leading-relaxed font-serif">
         <p className="text-xs text-gray-400 mb-1">Click words to select, then apply styles:</p>
         <div className="whitespace-pre-wrap">
             {(() => {
                 // Match WordGroupRenderer logic exactly
                 const tokens = text.split(/([a-zA-Z0-9À-ÿ'']+)/).filter(Boolean);
                 let wordIndex = 0;
                 return tokens.map((token, idx) => {
                     const isWord = /^[a-zA-Z0-9À-ÿ'']+$/.test(token);
                     
                     if (!isWord) {
                         return <span key={idx}>{token}</span>;
                     }
                     
                     const currentWordIndex = wordIndex++;
                     // const tempId = `temp-${currentWordIndex}`; // Unused
                     
                     // Check style with logical index stored as wordId "0", "1" etc.
                     // The editor state initially loads styles with real IDs "0", "1".
                     // But here we construct temp IDs "temp-0" for internal editor tracking.
                     // Wait, initialStyles come from the store with IDs like "0", "1".
                     // So we should map them to our internal ID format or just use "0", "1" directly.
                     // Let's use string indices as IDs directly to simplify.
                     const wordId = String(currentWordIndex);
                     
                     // We need to check if we have a style for this index
                     const style = styles.find(s => s.wordId === wordId);
                     const isSelected = selectedWordIndices.includes(currentWordIndex);
                     
                     return (
                         <span
                           key={idx}
                           onClick={() => handleWordClick(currentWordIndex)}
                           className={`cursor-pointer px-0.5 rounded transition-colors ${isSelected ? 'bg-blue-200 text-blue-800' : 'hover:bg-gray-200'}`}
                           style={{
                               fontWeight: style?.bold ? 'bold' : 'normal',
                               fontStyle: style?.italic ? 'italic' : 'normal',
                               textDecoration: `${style?.underline ? 'underline' : ''} ${style?.strikethrough ? 'line-through' : ''}`.trim()
                           }}
                         >
                            {token}
                         </span>
                     );
                 });
             })()}
         </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          <Save size={16} /> Save (Local)
        </button>
        <button
          onClick={() => {
            onSave(text, styles, true);
          }}
          className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center gap-2"
          title="Save and automatically update linked words"
        >
          <Save size={16} /> Save & Sync
        </button>
      </div>
    </div>
  );
};
