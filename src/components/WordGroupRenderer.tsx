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

import { HighlightTooltip } from './HighlightTooltip';

export const WordGroupRenderer: React.FC<WordGroupRendererProps> = React.memo(({ text, language, lineId, styles = [] }) => {
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
    highlightRanges,
    addHighlightRange,
    updateHighlightRange,
    selectedColor
  } = useStore();

  const [hoveredHighlightId, setHoveredHighlightId] = React.useState<string | null>(null);
  const [dragStartWordIndex, setDragStartWordIndex] = React.useState<number | null>(null);
  const [currentDragEndIndex, setCurrentDragEndIndex] = React.useState<number | null>(null);

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

  const handleWordClick = React.useCallback((wordId: string, wordIndex: number, e: React.MouseEvent) => {
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
          startArrowFromGroup(group.id);
        } else {
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
  }, [selectionMode, wordGroupSelection, lineId, language, wordIdToGroup, arrowCreation, startWordGroupSelection, extendWordGroupSelection, startArrowFromGroup, addArrowTargetGroup, setSelectedElement]);

  // Highlight Drag Handlers
  const handleHighlightMouseDown = (e: React.MouseEvent, index: number) => {
    if (selectionMode === 'highlight') {
        e.stopPropagation();
        e.preventDefault(); // Prevent text selection
        setDragStartWordIndex(index);
        setCurrentDragEndIndex(index);
    }
  };

  const handleHighlightMouseEnter = (index: number) => {
      if (selectionMode === 'highlight' && dragStartWordIndex !== null) {
          setCurrentDragEndIndex(index);
      }
  };

  const handleHighlightMouseUp = () => {
      if (selectionMode === 'highlight' && dragStartWordIndex !== null && currentDragEndIndex !== null) {
          const start = Math.min(dragStartWordIndex, currentDragEndIndex);
          const end = Math.max(dragStartWordIndex, currentDragEndIndex);

          addHighlightRange({
              lineId,
              language,
              startWordIndex: start,
              endWordIndex: end,
              color: selectedColor
          });

          setDragStartWordIndex(null);
          setCurrentDragEndIndex(null);
      }
  };

  // Global mouse up to catch dragging release outside word boundaries
  React.useEffect(() => {
      const globalUp = () => {
          if (dragStartWordIndex !== null) {
             handleHighlightMouseUp();
          }
      };
      window.addEventListener('mouseup', globalUp);
      return () => window.removeEventListener('mouseup', globalUp);
  }, [dragStartWordIndex, currentDragEndIndex, selectionMode, selectedColor, lineId, language]);

  const handleWordDoubleClick = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectionMode === 'wordGroup' && wordGroupSelection.wordIds.length > 0) {
      confirmWordGroupSelection();
    }
  }, [selectionMode, wordGroupSelection, confirmWordGroupSelection]);

  // Determine active highlights for this line/language
  const activeHighlights = highlightRanges?.filter(h => h.lineId === lineId && h.language === language) || [];

  // Temporary highlight during drag
  let dragHighlight = null;
  if (selectionMode === 'highlight' && dragStartWordIndex !== null && currentDragEndIndex !== null) {
      const start = Math.min(dragStartWordIndex, currentDragEndIndex);
      const end = Math.max(dragStartWordIndex, currentDragEndIndex);
      dragHighlight = { startWordIndex: start, endWordIndex: end, color: selectedColor };
  }

  // Render tokens with grouping
  let wordIndex = 0;
  const renderedTokens: React.ReactNode[] = [];

  // LAYER 1: FOREGROUND (Text & Underlines)
  tokens.forEach((token, tokenIdx) => {
    const isWord = /^[a-zA-Z0-9À-ÿ'']+$/.test(token);

    if (!isWord) {
      // Logic for contiguous underlining of spaces/punctuation
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
             paddingBottom: isContiguousGroup ? '2px' : undefined,
             position: 'relative',
             zIndex: 20
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
    const isTarget = group && isArrowTarget(group.id);
    const currentWordIndex = wordIndex;
    
    const style = styles.find(s => s.wordId === String(currentWordIndex));

    wordIndex++;

    renderedTokens.push(
      <span
        key={wordId}
        id={wordId}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleWordClick(wordId, currentWordIndex, e as any);
            }
        }}
        onClick={(e) => handleWordClick(wordId, currentWordIndex, e)}
        onDoubleClick={handleWordDoubleClick}
        onMouseDown={(e) => handleHighlightMouseDown(e, currentWordIndex)}
        onMouseEnter={() => handleHighlightMouseEnter(currentWordIndex)}
        className={clsx(
          "cursor-pointer transition-all duration-150 select-none relative inline-block z-20", // z-20 for foreground
          "hover:bg-black/5 rounded-sm px-0.5 -mx-0.5",
          group && "group-word",
          inSelection && "bg-yellow-200 ring-1 ring-yellow-400",
          isSource && "ring-2 ring-blue-500 bg-blue-50",
          isTarget && "ring-2 ring-green-500 bg-green-50",
          selectedElementId === group?.id && "bg-gray-200"
        )}
        style={{
          borderBottom: group ? `3px solid ${group.color}` : undefined,
          paddingBottom: group ? '2px' : undefined,
          fontWeight: style?.bold ? 'bold' : 'normal',
          fontStyle: style?.italic ? 'italic' : 'normal',
          textDecoration: `${style?.underline ? 'underline' : ''} ${style?.strikethrough ? 'line-through' : ''}`.trim()
        }}
        data-group-id={group?.id}
        data-word-index={currentWordIndex}
      >
        {token}
      </span>
    );
  });

  // LAYER 0: BACKGROUND (Highlights)
  // We need to render highlights *behind* the text.
  // We can do this by overlaying divs based on word index positions,
  // but since we are inside a text flow, using absolute positioning is tricky without precise coordinates.
  // A robust way in a text flow is to render spans that mirror the text structure or
  // use a "mark" equivalent behind.

  // Strategy:
  // We can't easily calculate pixel widths here without refs to every span.
  // But wait, the previous code applied background color directly to the span.
  // The requirement says "Layer 0 (Background): <div> blocks representing highlights. These must render behind the text."
  // "Calculate width and left position dynamically".
  // This implies we need a ref to the container and maybe the word spans.
  // Given the complexity of "exact pixel calculation" in a reactive flow without causing layout thrashing,
  // I will use a simplified approach: Render highlight backgrounds on the words themselves but via a separate loop or
  // applying it to the span with z-index.
  // BUT the prompt says "contiguous selection" covering spaces.
  // So checking if a space is "between" highlighted words is key.

  // Let's re-render the text stream just for highlights in a layer behind?
  // No, that doubles DOM nodes and sync issues.
  // Better: The spans above are Z-20. We can put absolute div layers behind them if we know geometry.

  // Alternative: Just color the words and the spaces between them if both neighbors are highlighted.
  // This is what I did in the "Foregound" loop logic for groups.
  // Let's adapt that logic for highlights in the loop, but using a lower Z-index pseudo-element or sibling?
  // Actually, the prompt explicitly asks for "Layer 0" as `div` blocks.

  // Let's implement the "Background Layer" by calculating ranges.
  // We can simply render the highlighting logic ON the spans but ensure it looks like a layer.
  // OR, we stick to the prompt: "Split the render into two absolute layers".

  // Let's try to map the highlight ranges to visual blocks.
  // If we can't easily do absolute positioning without measuring refs (which causes re-renders),
  // we might stick to modifying the spans but ensuring visual continuity.

  // COMPROMISE: I will use the "Token Stream" approach but render a BACKGROUND layer first,
  // then the text layer on top.
  // The background layer will contain spans with background colors only (transparent text).
  // The foreground layer will have text and underlines.
  // Both layers will be absolute on top of each other? No, relative container.

  // Let's do: Container (relative) -> Background Layer (absolute, z-0) -> Foreground Layer (relative, z-10)
  // Background layer mirrors the text content exactly but colors backgrounds.

  const renderBackgroundLayer = () => {
      let wIdx = 0;
      return tokens.map((token, tIdx) => {
          const isWord = /^[a-zA-Z0-9À-ÿ'']+$/.test(token);
          if (!isWord) {
             // Check if surrounded by same highlight to bridge the gap
             const prevIdx = wIdx - 1;
             const nextIdx = wIdx;

             // Find a highlight that covers BOTH prevIdx and nextIdx
             const coveringHighlight = activeHighlights.find(h =>
                 h.startWordIndex <= prevIdx && h.endWordIndex >= nextIdx
             ) || (dragHighlight && dragHighlight.startWordIndex <= prevIdx && dragHighlight.endWordIndex >= nextIdx ? dragHighlight : null);

             return (
                 <span key={`bg-${tIdx}`} style={{
                     backgroundColor: coveringHighlight ? coveringHighlight.color : 'transparent',
                     color: 'transparent'
                 }}>{token}</span>
             );
          }

          const currentIdx = wIdx;
          wIdx++;

          const highlight = activeHighlights.find(h => h.startWordIndex <= currentIdx && h.endWordIndex >= currentIdx)
             || (dragHighlight && dragHighlight.startWordIndex <= currentIdx && dragHighlight.endWordIndex >= currentIdx ? dragHighlight : null);

          // Handle hover interaction for existing highlights
          const isHovered = highlight && hoveredHighlightId === (highlight as any).id; // dragHighlight has no id

          return (
              <span
                key={`bg-${tIdx}`}
                className="relative"
                onMouseEnter={() => (highlight as any).id && setHoveredHighlightId((highlight as any).id)}
                onMouseLeave={() => setHoveredHighlightId(null)}
                style={{
                  backgroundColor: highlight ? highlight.color : 'transparent',
                  color: 'transparent',
                  opacity: 0.5 // Marker pen effect
              }}>
                {token}
                {/* Tooltip anchor */}
                {isHovered && (highlight as any).id && (
                     <HighlightTooltip
                        highlightId={(highlight as any).id}
                        currentColor={highlight.color}
                        onColorChange={(id, color) => updateHighlightRange(id, { color })}
                        onDelete={(id) => removeHighlightRange(id)}
                     />
                )}
              </span>
          );
      });
  };

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
      {/* Layer 0: Background Highlights */}
      <div className="absolute inset-0 z-0 whitespace-pre-wrap select-none pointer-events-none" style={{ color: 'transparent' }} aria-hidden="true">
          {/* We need pointer-events-auto on the children to catch hovers for tooltips?
              Actually, the foreground catches events.
              But tooltips need to be interactive.
              Let's make this layer pointer-events-auto but text transparent.
          */}
          <div className="pointer-events-auto">
             {renderBackgroundLayer()}
          </div>
      </div>

      {/* Layer 1: Foreground Text */}
      <div className="relative z-10 whitespace-pre-wrap pointer-events-none">
          {/* We need interactive elements inside to be pointer-events-auto */}
          <div className="pointer-events-auto">
            {renderedTokens}
          </div>
      </div>

      {groupAnchors}
    </div>
  );
});

export default WordGroupRenderer;
