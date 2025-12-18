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

  // Split by word characters (letters, numbers, accents) capturing the delimiter
  // This produces: ["word", " punctuation ", "word2"]
  // Adjust regex to be more inclusive of international characters if needed
  const words = text.split(/([a-zA-Z0-9À-ÿ]+)/).filter(Boolean);

  const handleWordClick = (wordId: string, isWord: boolean) => {
    if (!isWord) return;

    if (selectionMode === 'arrow') {
      if (!selectedSourceId) {
        useStore.setState({ selectedSourceId: wordId });
      } else {
        if (selectedSourceId !== wordId) {
          addArrow({
            sourceGroupIds: [],
            targetGroupIds: [],
            startElementId: selectedSourceId,
            endElementId: wordId,
            color: selectedColor,
            style: 'solid',
            strokeWidth: 2,
            headStyle: 'arrow',
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
      {words.map((part, idx) => {
        const isWord = /^[a-zA-Z0-9À-ÿ]+$/.test(part);
        const wordId = `${lineId}-${language}-${idx}`;

        // If it's punctuation or whitespace, just render it plain
        if (!isWord) {
            return <span key={idx}>{part}</span>;
        }

        // Check if this word is inside any EXISTING highlight
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
            onClick={() => handleWordClick(wordId, isWord)}
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
            {part}
          </span>
        );
      })}
    </div>
  );
};
