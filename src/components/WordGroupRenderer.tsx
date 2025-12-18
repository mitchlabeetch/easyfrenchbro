import React from 'react';
import { useStore } from '../store';
import { clsx } from 'clsx';
import { WordGroupType, TextStyle } from '../types';

interface WordGroupRendererProps {
  text: string;
  language: 'french' | 'english';
  lineId: string;
  styles?: TextStyle[]; // NEW: Accept styles
}

export const WordGroupRenderer: React.FC<WordGroupRendererProps> = ({ text, language, lineId, styles = [] }) => {
  const {
    selectionMode,
    wordGroups,
    wordGroupSelection,
    arrowCreation,
    startWordGroupSelection,
    extendWordGroupSelection,
    confirmWordGroupSelection,
    startArrowFromGroup,
    addArrowTargetGroup,
    selectedElementId,
    setSelectedElement
  } = useStore();

  // Split text into words and non-words (punctuation/spaces)
  const tokens = text.split(/([a-zA-Z0-9À-ÿ'']+)/).filter(Boolean);

  // Get all word groups for this line and language
  const lineGroups = wordGroups.filter(g => g.lineId === lineId && g.language === language);

  // Build a map: wordId -> group (for quick lookup)
  const wordIdToGroup = new Map<string, typeof lineGroups[0]>();
  lineGroups.forEach(group => {
    group.wordIds.forEach(wordId => {
      wordIdToGroup.set(wordId, group);
    });
  });

  // Check if a word is in the current selection
  const isInCurrentSelection = (wordId: string) => {
    return wordGroupSelection.wordIds.includes(wordId);
  };

  // Check if a group is selected as arrow source or target
  const isArrowSource = (groupId: string) => {
    return arrowCreation.sourceGroupIds.includes(groupId);
  };
  const isArrowTarget = (groupId: string) => {
    return arrowCreation.targetGroupIds.includes(groupId);
  };

  const handleWordClick = (wordId: string, wordIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();

    if (selectionMode === 'wordGroup') {
      if (e.shiftKey && wordGroupSelection.lineId === lineId && wordGroupSelection.language === language) {
        // Extend selection
        extendWordGroupSelection(wordId, wordIndex);
      } else {
        // Start new selection
        startWordGroupSelection(wordId, wordIndex, lineId, language);
      }
    } else if (selectionMode === 'arrow') {
      const group = wordIdToGroup.get(wordId);
      if (group) {
        if (!arrowCreation.isSelectingTarget) {
          // If already selected as source, maybe deselect? (Logic for multi-source can be added later)
          // For now, simple start
          startArrowFromGroup(group.id);
        } else {
          // Add as target (accumulate)
           // Prevent self-loop if needed, or allow it
           if (!arrowCreation.sourceGroupIds.includes(group.id)) {
              addArrowTargetGroup(group.id);
           }
        }
      }
    } else if (selectionMode === 'none') {
      const group = wordIdToGroup.get(wordId);
      if (group) {
        setSelectedElement(group.id, 'wordGroup');
      } else {
        setSelectedElement(null, null);
      }
    }
  };

  const handleWordDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectionMode === 'wordGroup' && wordGroupSelection.wordIds.length > 0) {
      confirmWordGroupSelection();
    }
  };

  // Render tokens with grouping
  let wordIndex = 0;
  const renderedTokens: React.ReactNode[] = [];

  tokens.forEach((token, tokenIdx) => {
    const isWord = /^[a-zA-Z0-9À-ÿ'']+$/.test(token);

    if (!isWord) {
      // Logic for contiguous highlighting of spaces/punctuation
      const prevWordId = `${lineId}-${language}-${wordIndex - 1}`;
      const nextWordId = `${lineId}-${language}-${wordIndex}`;
      
      const prevGroup = wordIdToGroup.get(prevWordId);
      const nextGroup = wordIdToGroup.get(nextWordId);
      
      const isContiguousGroup = prevGroup && nextGroup && prevGroup.id === nextGroup.id;
      
      renderedTokens.push(
        <span 
          key={`token-${tokenIdx}`}
          style={{
             borderBottom: isContiguousGroup ? `3px solid ${prevGroup.color}` : undefined,
             paddingBottom: isContiguousGroup ? '2px' : undefined
          }}
          className={clsx(isContiguousGroup && "group-spacer")}
        >
          {token}
        </span>
      );
      return;
    }

    const wordId = `${lineId}-${language}-${wordIndex}`;
    const group = wordIdToGroup.get(wordId);
    const inSelection = isInCurrentSelection(wordId);
    const isSource = group && isArrowSource(group.id);
    const isTarget = group && isArrowTarget(group.id); // Highlight targets too
    const currentWordIndex = wordIndex;
    
    // Get style for this word
    // We match by INDEX in the styles array for now, assuming styles are stored by relative index
    // OR we match by constructed ID.
    // The RichTextEditor saves IDs as "0", "1", "2". We should map validly.
    // Let's assume styles use indices as strings.
    const style = styles.find(s => s.wordId === String(currentWordIndex));

    wordIndex++;

    renderedTokens.push(
      <span
        key={wordId}
        id={wordId}
        onClick={(e) => handleWordClick(wordId, currentWordIndex, e)}
        onDoubleClick={handleWordDoubleClick}
        className={clsx(
          "cursor-pointer transition-all duration-150 select-none relative inline-block",
          "hover:bg-gray-100 rounded-sm px-0.5 -mx-0.5 z-10", // Negative margin to overlap spacer slightly
          // In a group - show underline styling
          group && "group-word",
          // Currently being selected
          inSelection && "bg-yellow-200 ring-1 ring-yellow-400",
          // Arrow interaction
          isSource && "ring-2 ring-blue-500 bg-blue-50",
          isTarget && "ring-2 ring-green-500 bg-green-50",
          // Selected for editing
          selectedElementId === group?.id && "bg-gray-200"
        )}
        style={{
          // Underline with group color
          borderBottom: group ? `3px solid ${group.color}` : undefined,
          paddingBottom: group ? '2px' : undefined,
          // Rich Text Styles
          fontWeight: style?.bold ? 'bold' : 'normal',
          fontStyle: style?.italic ? 'italic' : 'normal',
          textDecoration: `${style?.underline ? 'underline' : ''} ${style?.strikethrough ? 'line-through' : ''}`
        }}
        data-group-id={group?.id}
        data-word-index={currentWordIndex}
      >
        {token}
      </span>
    );
  });

  // Render anchor elements for each group (positioned below the underline)
  const groupAnchors = lineGroups.map(group => (
    <div
      key={`anchor-${group.id}`}
      id={`group-anchor-${group.id}`}
      className="absolute opacity-0 pointer-events-none"
      style={{
        bottom: '-5px',
        left: '50%',
        width: '1px',
        height: '1px'
      }}
      data-group-id={group.id}
    />
  ));

  return (
    <div className={clsx(
      "relative inline-block w-full leading-loose", // Increased leading for arrows
      language === 'french' ? "font-serif" : "font-sans"
    )}>
      <div className="relative whitespace-pre-wrap">
        {renderedTokens}
      </div>
      {groupAnchors}
    </div>
  );
};

export default WordGroupRenderer;
