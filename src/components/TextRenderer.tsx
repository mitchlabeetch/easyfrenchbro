import React from 'react';
import { useStore } from '../store';
import { clsx } from 'clsx';

interface TextRendererProps {
  text: string;
  language: 'french' | 'english';
  lineId: string;
}

export const TextRenderer: React.FC<TextRendererProps> = ({ text, language, lineId }) => {
  const {
    selectionMode,
    selectedSourceId,
    addArrow,
    selectedColor,
    highlights,
    highlightSelection,
    addToHighlightSelection
  } = useStore();

  const words = text.split(/(\s+)/).filter(Boolean);

  const handleWordClick = (wordId: string) => {
    if (selectionMode === 'arrow') {
      if (!selectedSourceId) {
        useStore.setState({ selectedSourceId: wordId });
      } else {
        if (selectedSourceId !== wordId) {
          addArrow({
            startElementId: selectedSourceId,
            endElementId: wordId,
            color: selectedColor,
            curvature: 0.5
          });
          useStore.setState({ selectedSourceId: null });
        }
      }
    } else if (selectionMode === 'highlight') {
        addToHighlightSelection(wordId, language, lineId);
    }
  };

  // Determine if a word is actively selected (pending highlight creation)
  const isSelected = (wordId: string) => {
      if (highlightSelection.lineId !== lineId) return false;
      return language === 'french'
        ? highlightSelection.frenchIds.includes(wordId)
        : highlightSelection.englishIds.includes(wordId);
  };

  return (
    <div className={clsx("relative inline-block w-full", language === 'french' ? "font-serif" : "font-sans")}>
      {words.map((word, idx) => {
        // Skip pure whitespace logic if desired, but we render it.
        // For interactions, we usually ignore pure whitespace clicks.
        if (!word.trim()) return <span key={idx}>{word}</span>;

        const wordId = `${lineId}-${language}-${idx}`;

        // Check if this word is inside any EXISTING highlight
        // We use frenchWordIds / englishWordIds now
        const activeHighlight = highlights.find(h =>
          h.associatedLineId === lineId &&
          (language === 'french'
            ? h.frenchWordIds.includes(wordId)
            : h.englishWordIds.includes(wordId))
        );

        const currentlySelected = isSelected(wordId);

        return (
          <span
            key={wordId}
            id={wordId}
            onClick={() => handleWordClick(wordId)}
            className={clsx(
              "cursor-pointer hover:bg-gray-100 rounded px-0.5 transition-colors select-none",
              // Existing highlight
              activeHighlight && "bg-opacity-50",
              // Arrow source selection
              selectedSourceId === wordId && "ring-2 ring-blue-500 bg-blue-100",
              // Highlight selection pending
              currentlySelected && "bg-yellow-200 ring-1 ring-yellow-400"
            )}
            style={{
              backgroundColor: activeHighlight ? activeHighlight.colorCode : undefined
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
