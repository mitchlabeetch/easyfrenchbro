import React, { useState } from 'react';
import { useStore } from '../store';
import { X, Link as LinkIcon, Unlink } from 'lucide-react';

interface LinkingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LinkingModal: React.FC<LinkingModalProps> = ({ isOpen, onClose }) => {
  const { 
    pages, 
    currentPageIndex, 
    linkedPairs, 
    addLinkedPair, 
    removeLinkedPair 
  } = useStore();

  const [selectedFrench, setSelectedFrench] = useState<string[]>([]);
  const [selectedEnglish, setSelectedEnglish] = useState<string[]>([]);

  if (!isOpen) return null;

  const currentPage = pages[currentPageIndex || 0];
  if (!currentPage) return null;

  const handleWordClick = (wordId: string, lang: 'french' | 'english') => {
    if (lang === 'french') {
      setSelectedFrench(prev => 
        prev.includes(wordId) ? prev.filter(id => id !== wordId) : [...prev, wordId]
      );
    } else {
      setSelectedEnglish(prev => 
        prev.includes(wordId) ? prev.filter(id => id !== wordId) : [...prev, wordId]
      );
    }
  };

  const handleLink = (lineId: string) => {
    if (selectedFrench.length === 0 || selectedEnglish.length === 0) return;

    addLinkedPair({
      lineId,
      sourceWordIds: selectedFrench,
      targetWordIds: selectedEnglish
    });
    
    // Clear selection
    setSelectedFrench([]);
    setSelectedEnglish([]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-3/4 h-3/4 flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="font-bold flex items-center gap-2">
            <LinkIcon size={18} />
            Manage Linked Words
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-8">
            <p className="text-sm text-gray-500 mb-4 bg-blue-50 p-3 rounded border border-blue-100">
                Select French words and English words in a line, then click "Link" to create a synchronized pair. 
                Formatting changes to one will apply to the other.
            </p>

            {currentPage.lines.map(line => (
                <div key={line.id} className="border rounded p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                         <span className="text-xs font-mono text-gray-400">Line {line.lineNumber}</span>
                         <button 
                            className="bg-blue-600 text-white px-3 py-1 rounded text-xs disabled:opacity-50 hover:bg-blue-700"
                            disabled={selectedFrench.length === 0 || selectedEnglish.length === 0}
                            onClick={() => handleLink(line.id)}
                         >
                            Link Selected
                         </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        {/* French */}
                        <div className="p-2 bg-gray-50 rounded">
                            {/* We need to render words clickable. 
                                Using a simplified rendering not WordGroupRenderer for custom click logic?
                                Actually WordGroupRenderer is complex. Let's just map words manually here for simplicity of selection.
                            */}
                            <div className="flex flex-wrap gap-1">
                                {line.frenchText.split(' ').map((word, i) => {
                                    const wordId = `${line.id}-french-${i}`;
                                    const isSelected = selectedFrench.includes(wordId);
                                    // Check if already linked
                                    const isLinked = linkedPairs.some(p => p.sourceWordIds.includes(wordId));
                                    
                                    return (
                                        <span 
                                            key={i}
                                            onClick={() => !isLinked && handleWordClick(wordId, 'french')}
                                            className={`
                                                cursor-pointer px-1 rounded transition-colors
                                                ${isSelected ? 'bg-blue-200 text-blue-800 font-bold' : ''}
                                                ${isLinked ? 'text-green-600 bg-green-50 cursor-default border border-green-200' : 'hover:bg-blue-100'}
                                            `}
                                        >
                                            {word}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>

                        {/* English */}
                         <div className="p-2 bg-gray-50 rounded">
                            <div className="flex flex-wrap gap-1">
                                {line.englishText.split(' ').map((word, i) => {
                                    const wordId = `${line.id}-english-${i}`;
                                    const isSelected = selectedEnglish.includes(wordId);
                                    const isLinked = linkedPairs.some(p => p.targetWordIds.includes(wordId));
                                    
                                    return (
                                        <span 
                                            key={i}
                                            onClick={() => !isLinked && handleWordClick(wordId, 'english')}
                                            className={`
                                                cursor-pointer px-1 rounded transition-colors
                                                ${isSelected ? 'bg-indigo-200 text-indigo-800 font-bold' : ''}
                                                ${isLinked ? 'text-green-600 bg-green-50 cursor-default border border-green-200' : 'hover:bg-indigo-100'}
                                            `}
                                        >
                                            {word}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Existing Links List */}
                    <div className="mt-2 space-y-1">
                        {linkedPairs.filter(p => p.lineId === line.id).map(pair => (
                            <div key={pair.id} className="flex items-center text-xs bg-green-50 text-green-800 p-1 rounded border border-green-100 w-fit">
                                <LinkIcon size={10} className="mr-2"/>
                                <span className="mr-2 opacity-70">
                                    {/* Helper to show text would be nice but we only have IDs. 
                                        Skipping text lookup for speed for now, just showing count/IDs 
                                    */}
                                    {pair.sourceWordIds.length} Fr ↔ {pair.targetWordIds.length} En
                                </span>
                                <button onClick={() => removeLinkedPair(pair.id)} className="text-red-400 hover:text-red-600 ml-2">
                                    <Unlink size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
