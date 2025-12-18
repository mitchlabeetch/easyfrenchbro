import React from 'react';
import { useStore } from '../store';
import { clsx } from 'clsx';
import { Volume2 } from 'lucide-react';
import { TextStyle } from '../types';

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
    setSelectedElement,
    theme,
    highlightSelection,
    highlights,
    addHighlight,
    removeHighlight,
    updateHighlight
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
    } else if (selectionMode === 'highlight') {
      // Toggle highlight for this word
      const existing = highlights.find(h => 
          h.associatedLineId === lineId && 
          (language === 'french' ? h.frenchWordIds.includes(wordId) : h.englishWordIds.includes(wordId))
       );
       
       if (existing) {
          // Keep it simple: remove the highlight entry entirely if it's a single word match? 
          // Or smarter: remove just this word.
          const isFrench = language === 'french';
          const ids = isFrench ? existing.frenchWordIds : existing.englishWordIds;
          const newIds = ids.filter(id => id !== wordId);
          
          // If nothing left in this highlight (for both langs), remove it
          const otherLangIds = isFrench ? existing.englishWordIds : existing.frenchWordIds;
          
          if (newIds.length === 0 && otherLangIds.length === 0) {
              removeHighlight(existing.id);
          } else {
              updateHighlight(existing.id, {
                  frenchWordIds: isFrench ? newIds : existing.frenchWordIds,
                  englishWordIds: !isFrench ? newIds : existing.englishWordIds
              });
          }
       } else {
          // Create new highlight with selected color
          addHighlight({
              associatedLineId: lineId,
              frenchWordIds: language === 'french' ? [wordId] : [],
              englishWordIds: language === 'english' ? [wordId] : [],
              colorCode: useStore.getState().selectedColor
          });
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

  // Check if word is selected in highlight mode
  const isInHighlightSelection = (wordId: string) => {
    if (highlightSelection.lineId !== lineId) return false;
    return language === 'french'
      ? highlightSelection.frenchIds.includes(wordId)
      : highlightSelection.englishIds.includes(wordId);
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
    const inHighlight = isInHighlightSelection(wordId); // Check if selected in highlight mode
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
          // Currently being selected (word group mode)
          inSelection && "bg-yellow-200 ring-1 ring-yellow-400",
          // Highlight mode selection
          inHighlight && "bg-orange-200 ring-1 ring-orange-400",
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
          // Legacy highlights
          backgroundColor: inHighlight ? undefined : (
            theme.searchHighlight?.lineId === lineId && 
            theme.searchHighlight?.language === language && 
            currentWordIndex >= 0 // Simplified: if any word in the line is part of search, maybe highlight? 
            // Better: use the indices. But WordGroup renderer splits by words.
            // Let's just highlight the word if it contains the search term index-wise.
            ? '#fbbf24' // Yellow-400 for search match
            : useStore.getState().highlights.find(h => 
              h.associatedLineId === lineId && 
              (language === 'french' ? h.frenchWordIds.includes(wordId) : h.englishWordIds.includes(wordId))
            )?.colorCode
          ),
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
      className="absolute group-anchor-container"
      style={{
        bottom: '-18px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'auto',
        height: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 30
      }}
      data-group-id={group.id}
    >
        <button
          onClick={(e) => {
            e.stopPropagation();
            // TTS Logic
            const groupText = group.wordIds
              .map(id => {
                const parts = id.split('-');
                const idx = parseInt(parts[parts.length-1]);
                const words = text.split(/([a-zA-Z0-9À-ÿ'']+)/).filter(Boolean).filter(t => /^[a-zA-Z0-9À-ÿ'']+$/.test(t));
                return words[idx] || '';
              })
              .join(' ');
            
            const utterance = new SpeechSynthesisUtterance(groupText);
            utterance.lang = language === 'french' ? 'fr-FR' : 'en-US';
            window.speechSynthesis.speak(utterance);
          }}
          className="p-0.5 bg-white shadow-sm border rounded-full text-indigo-400 hover:text-indigo-600 hover:shadow transition-all opacity-0 group-hover:opacity-100"
          title="Speak Group"
        >
          <Volume2 size={10} />
        </button>
    </div>
  ));

  // Get font family from theme
  const fontFamily = language === 'french' ? theme.frenchFontFamily : theme.englishFontFamily;

  return (
    <div 
      className="relative inline-block w-full leading-loose"
      style={{ fontFamily }}
    >
      <div className="relative whitespace-pre-wrap">
        {renderedTokens}
      </div>
      {groupAnchors}
    </div>
  );
};

export default WordGroupRenderer;
