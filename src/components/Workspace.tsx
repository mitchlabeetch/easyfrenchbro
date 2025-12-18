import React, { useState } from 'react';
import { useStore } from '../store';
import { WordGroupRenderer } from './WordGroupRenderer';
import { CustomArrowLayer } from './CustomArrowLayer';
import { PlusCircle, Pen, Settings2, Trash2, X, Volume2 } from 'lucide-react';
import { clsx } from 'clsx';
import { RichTextEditor } from './RichTextEditor';
import { ArrowTemplateMenu } from './ArrowTemplateMenu';
import { TextStyle, AnecdoteType } from '../types';

export const Workspace: React.FC = () => {
  const { 
      pages, 
      sidebars, 
      removeSidebarCard,
      addSidebarCard,
      updateSidebarCard,
      getColorForAnecdote,
      removeLine,
      updateWordGroup,
      theme,
      currentPageIndex,
      updatePage,
      arrowCreation,
      selectionMode,
      setSelectedElement,
      clearWordGroupSelection,
      cancelArrowCreation,
      updateLineStyles,
      uiSettings,
      updateLineProperty,
      reorderLines
  } = useStore();



  const [editorState, setEditorState] = useState<{
      isOpen: boolean;
      lineId: string | null;
      language: 'french' | 'english' | null;
      initialText: string;
      initialStyles: TextStyle[];
      position: { x: number, y: number };
  }>({
      isOpen: false,
      lineId: null,
      language: null,
      initialText: '',
      initialStyles: [],
      position: { x: 0, y: 0 }
  });

  // Zoom state for the preview
  const [zoomLevel, setZoomLevel] = useState(1);

  // Drag-drop state for line reordering
  const [draggedLineIndex, setDraggedLineIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Arrow Menu State
  const [arrowMenu, setArrowMenu] = useState<{ isOpen: boolean; x: number; y: number } | null>(null);

  // Anecdote Type Selection State
  const [anecdoteMenu, setAnecdoteMenu] = useState<{ isOpen: boolean; x: number; y: number; wordGroupId: string } | null>(null);

  // Selected line for keyboard operations (N18)
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);

  // Use the currentPageIndex directly from store
  const currentPage = pages[currentPageIndex || 0];
  const splitRatio = currentPage?.splitRatio ?? theme.pageLayout?.splitRatio ?? 0.5;

  // Keyboard shortcuts for line reordering (N18)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentPage || selectedLineIndex === null) return;
      
      if (e.altKey && e.key === 'ArrowUp' && selectedLineIndex > 0) {
        e.preventDefault();
        reorderLines(currentPage.id, selectedLineIndex, selectedLineIndex - 1);
        setSelectedLineIndex(selectedLineIndex - 1);
      } else if (e.altKey && e.key === 'ArrowDown' && selectedLineIndex < currentPage.lines.length - 1) {
        e.preventDefault();
        reorderLines(currentPage.id, selectedLineIndex, selectedLineIndex + 1);
        setSelectedLineIndex(selectedLineIndex + 1);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, selectedLineIndex, reorderLines]);

  // Separation Line Drag Logic
  const isDraggingSplit = React.useRef(false);

  const handleSplitMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      isDraggingSplit.current = true;
      document.body.style.cursor = 'ew-resize'; // Double-ended horizontal arrow
      
      const onMouseMove = (moveEvent: MouseEvent) => {
          if (!isDraggingSplit.current || !currentPage) return;
          
          // Calculate new ratio based on mouse X relative to grid container
          // We need the width of the grid container.
          // Since there are multiple lines, we can pick one or use a parent wrapper ref inside the page loop?
          // Actually, all lines have same width. We can use the Page container width logic.
          // Let's assume the page width is fixed by getPageStyle(). width is in mm.
          // We need px calculations. 
          // Simplification: We track movement relative to window/screen but we need context of the container width.
          
          // Let's find the closest grid row to get its bounding rect
          const row = (e.currentTarget as HTMLElement).closest('.grid'); 
          if (!row) return;
          
          const rect = row.getBoundingClientRect();
          const relativeX = moveEvent.clientX - rect.left;
          
          // The grid has: 3rem (48px) | ratio | ratio | 12rem (192px)
          // Total flexible width = Total Width - 48px - 192px
          const fixedLeft = 48; // 3rem
          const fixedRight = 192; // 12rem
          const flexibleWidth = rect.width - fixedLeft - fixedRight;
          
          if (flexibleWidth <= 0) return;
          
          let newRatio = (relativeX - fixedLeft) / flexibleWidth;
          newRatio = Math.max(0.1, Math.min(0.9, newRatio)); // Clamp 10-90%
          
          // Update strictly local state first? No, update store directly for smoothness?
          // Updating store might be heavy if many lines.
          // Let's debounce or just update? Zustand is fast. Let's try direct update.
          updatePage(currentPage.id, { splitRatio: newRatio });
      };

      const onMouseUp = () => {
          isDraggingSplit.current = false;
          document.body.style.cursor = '';
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
  };

  // Dynamic grid template for lines
  const getGridTemplate = () => {
    const { showFrench, showEnglish } = uiSettings;
    const { layoutMode } = theme;

    if (layoutMode === 'interlinear') {
      return "3rem 1fr 12rem"; // Stacked mode: Line# | Content | Sidebar
    }

    const parts = ["3rem"];
    
    if (showFrench && showEnglish) {
      parts.push(`${splitRatio}fr`);
      parts.push(`${1 - splitRatio}fr`);
    } else if (showFrench || showEnglish) {
      parts.push("1fr");
    }
    
    parts.push("12rem");
    return parts.join(" ");
  };

  const handleBackgroundClick = () => {
    if (selectionMode === 'none') {
      setSelectedElement(null, null);
    }
    // Clear any pending selections
    clearWordGroupSelection();
    cancelArrowCreation();
  };

  const handleLineDoubleClick = (e: React.MouseEvent, lineId: string, language: 'french' | 'english', text: string, styles: TextStyle[] = []) => {
      e.stopPropagation();
      setEditorState({
          isOpen: true,
          lineId,
          language,
          initialText: text,
          initialStyles: styles,
          position: { x: e.clientX, y: e.clientY }
      });
  };

  const saveRichText = (_text: string, styles: TextStyle[], shouldSync?: boolean) => {
      if (editorState.lineId && editorState.language) {
          // Update current line
          updateLineStyles(editorState.lineId, editorState.language, styles);
          
          // Handle Sync
          if (shouldSync) {
              // Sync styles to linked words
              const startSync = async () => {
                  for (const s of styles) {
                      const fullWordId = `${editorState.lineId}-${editorState.language}-${s.wordId}`;
                      useStore.getState().syncLinkedStyles(fullWordId, [s]);
                  }
              };
              startSync();
          }
      }
      setEditorState({ ...editorState, isOpen: false });
  };

  // Calculate page dimensions from theme
  const getPageStyle = () => {
    const layout = theme.pageLayout;
    if (layout) {
      return {
        width: layout.width,
        minHeight: layout.height,
        paddingTop: layout.margins.top,
        paddingRight: layout.margins.right,
        paddingBottom: layout.margins.bottom,
        paddingLeft: layout.margins.left,
        backgroundColor: theme.pageBackground || '#ffffff',
      };
    }
    // Default A4 dimensions
    return {
      width: '210mm',
      minHeight: '297mm',
      padding: '15mm',
      backgroundColor: theme.pageBackground || '#ffffff',
    };
  };

  // Effect: Watch for Arrow Creation ready state (Source + Target selected)
  // This replaces the immediate confirmation in the store
  React.useEffect(() => {
    if (arrowCreation?.sourceGroupIds.length > 0 && arrowCreation?.targetGroupIds.length > 0) {
      // Find the last interacted group to position the menu
      const el = document.getElementById(arrowCreation.lastInteractedGroupId || '');
      const rect = el?.getBoundingClientRect();
      const pos = rect ? { x: rect.right + 10, y: rect.top } : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      
      setArrowMenu({ isOpen: true, x: pos.x, y: pos.y });
    }
  }, [arrowCreation?.sourceGroupIds, arrowCreation?.targetGroupIds]);



  return (
    <div
      className="flex-1 overflow-auto bg-gray-50 p-8 relative print:p-0 print:overflow-visible print:bg-white"
      id="workspace-container"
      onClick={handleBackgroundClick}
    >
      {/* Custom SVG Arrow Layer - renders curved arrows below text */}
      <CustomArrowLayer />

      {/* Arrow Template Menu */}
      <ArrowTemplateMenu 
          isOpen={arrowMenu?.isOpen || false} 
          position={arrowMenu ? { x: arrowMenu.x, y: arrowMenu.y } : undefined}
          onSelect={(template) => {
            // Create the arrow with the selected style template
            useStore.getState().confirmArrowCreation({
              style: template.style,
              headStyle: template.headStyle,
              color: template.color || useStore.getState().selectedColor
            });
            setArrowMenu(null);
          }}
          onClose={() => {
            useStore.getState().cancelArrowCreation();
            setArrowMenu(null);
          }}
      />

      {/* Anecdote Type Selection Menu */}
      {anecdoteMenu && (
          <div 
             className="fixed z-50 bg-white shadow-xl border rounded-lg p-2 grid grid-cols-2 gap-2 w-64"
             style={{ top: anecdoteMenu.y, left: anecdoteMenu.x }}
          >
             <h4 className="col-span-2 text-xs font-bold text-gray-500 mb-1 border-b pb-1">Select Anecdote Type</h4>
             {([
               { type: 'grammar', label: 'Grammar' },
               { type: 'spoken', label: 'Spoken French' },
               { type: 'history', label: 'History' },
               { type: 'falseFriend', label: 'False Friend' },
               { type: 'pronunciation', label: 'Pronunciation' },
               { type: 'vocab', label: 'Vocabulary' },
             ] as { type: AnecdoteType; label: string }[]).map(({ type, label }) => (
                 <button
                    key={type}
                    className="text-left text-xs p-2 hover:bg-blue-50 text-blue-700 rounded border border-transparent hover:border-blue-200"
                    onClick={() => {
                        const color = getColorForAnecdote(type);
                        updateWordGroup(anecdoteMenu.wordGroupId, {
                            color: color,
                            anecdoteType: type
                        });
                        setAnecdoteMenu(null);
                    }}
                 >
                    {label}
                 </button>
             ))}
             <button
                className="col-span-2 text-xs p-1 text-gray-400 hover:text-gray-600 border-t mt-1"
                onClick={() => setAnecdoteMenu(null)}
             >
                Cancel
             </button>
          </div>
      )}

      {/* TTS Utility */}
      {(() => {
        window.speechSynthesis?.cancel(); // Safety cleanup
        return null;
      })()}
      
      {editorState.isOpen && (
          <RichTextEditor
             initialText={editorState.initialText}
             initialStyles={editorState.initialStyles}
             onSave={saveRichText}
             onCancel={() => setEditorState({ ...editorState, isOpen: false })}
             position={editorState.position}
          />
      )}

      <div className="print:block origin-top" style={{ transform: `scale(${zoomLevel})` }}>
        {pages.length > 0 && currentPage ? (
          <div
            key={currentPage.id}
            className="bg-white shadow-lg mx-auto mb-8 relative print:w-full print:h-screen print:shadow-none print:m-0 print:break-after-page cursor-zoom-in"
            style={{ 
              ...getPageStyle(),
              fontSize: theme.fontSize, 
              lineHeight: theme.lineHeight 
            }}
            onClick={(e) => {
              // Only zoom if clicking on the page background, not on interactive elements
              if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.space-y-6')) {
                setZoomLevel(prev => prev >= 1.5 ? 1 : prev + 0.25);
              }
            }}
          >
             {/* Page Header with Navigation Info (not printed) */}
             <div className="absolute -top-8 left-0 right-0 text-center text-gray-400 text-xs no-print flex justify-between px-2">
                 <span>Page {(currentPageIndex || 0) + 1} of {pages.length}</span>
            </div>

            <div className="space-y-6 relative z-0">
              {currentPage.lines.map((line, lineIndex) => (
                <div 
                  key={line.id} 
                  className={clsx(
                    "grid gap-4 group relative transition-all cursor-pointer",
                    dragOverIndex === lineIndex && "ring-2 ring-blue-400 bg-blue-50",
                    draggedLineIndex === lineIndex && "opacity-50",
                    selectedLineIndex === lineIndex && "ring-2 ring-indigo-400 bg-indigo-50"
                  )}
                  style={{ gridTemplateColumns: getGridTemplate() }}
                  onClick={() => setSelectedLineIndex(lineIndex)}
                  draggable
                  onDragStart={(e) => {
                    setDraggedLineIndex(lineIndex);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', String(lineIndex));
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (draggedLineIndex !== null && draggedLineIndex !== lineIndex) {
                      setDragOverIndex(lineIndex);
                    }
                  }}
                  onDragLeave={() => {
                    setDragOverIndex(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedLineIndex !== null && draggedLineIndex !== lineIndex && currentPage) {
                      reorderLines(currentPage.id, draggedLineIndex, lineIndex);
                    }
                    setDraggedLineIndex(null);
                    setDragOverIndex(null);
                  }}
                  onDragEnd={() => {
                    setDraggedLineIndex(null);
                    setDragOverIndex(null);
                  }}
                >
                  
                  {/* Line Number / Action */}
                  <div className="text-gray-300 font-mono text-sm text-right pr-2 pt-1 select-none flex flex-col items-end gap-1">
                    <span className="group-hover:hidden">{line.lineNumber}</span>
                    
                     {/* Hover Actions */}
                    <div className="hidden group-hover:flex flex-col gap-1 no-print">
                         <button
                          className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded"
                          title="Add Anecdote"
                          onClick={(e) => {
                            e.stopPropagation();
                            addSidebarCard({
                              type: 'grammar',
                              content: 'New Note',
                              anchoredLineId: line.id
                            });
                          }}
                        >
                          <PlusCircle size={14} />
                        </button>
                        <button
                          className="text-indigo-500 hover:text-indigo-700 p-1 hover:bg-indigo-50 rounded"
                          title="Speak Selection"
                          onClick={(e) => {
                            e.stopPropagation();
                            const utterance = new SpeechSynthesisUtterance(line.frenchText + " " + line.englishText);
                            utterance.lang = 'fr-FR'; // Default to French for mixed context or just read French
                            window.speechSynthesis.speak(utterance);
                          }}
                        >
                          <Volume2 size={14} />
                        </button>
                        <button
                          className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded relative group/manage"
                          title="Manage Line"
                        >
                           <Settings2 size={14} />
                           
                           {/* Popup Menu */}
                           <div className="absolute left-full top-0 ml-2 bg-white shadow-xl border rounded p-2 w-32 hidden group-focus-within/manage:block z-50">
                               <button 
                                 className="w-full text-left text-xs p-1 hover:bg-red-50 text-red-600 rounded flex gap-2 items-center"
                                 onClick={(e) => {
                                     e.stopPropagation();
                                     if(confirm('Delete this line?')) {
                                         removeLine(currentPage.id, line.id);
                                     }
                                 }}
                               >
                                   <Trash2 size={12} /> Delete
                               </button>
                               
                               <div className="border-t my-1 pt-1">
                                  <div className="text-[10px] text-gray-400 mb-1 px-1 uppercase font-bold">Line Type</div>
                                  {(['paragraph', 'title', 'heading', 'note', 'list'] as const).map(type => (
                                      <button
                                          key={type}
                                          className={clsx(
                                              "w-full text-left text-[10px] p-1 rounded hover:bg-gray-50 capitalize",
                                              line.sectionType === type && "text-blue-600 font-bold bg-blue-50"
                                          )}
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              updateLineProperty(line.id, { sectionType: type });
                                          }}
                                      >
                                          {type}
                                      </button>
                                  ))}
                               </div>
                           </div>
                        </button>
                    </div>
                  </div>

                  {/* Interlinear Mode Rendering */}
                  {theme.layoutMode === 'interlinear' ? (
                    <div className={clsx(
                      "relative p-1 space-y-2",
                      line.sectionType === 'title' && "text-center py-4",
                      line.sectionType === 'heading' && "border-b border-gray-100 py-2"
                    )}>
                      {/* French Row */}
                      {uiSettings.showFrench && (
                        <div 
                          className={clsx(
                            "relative p-1 rounded hover:bg-gray-50 transition-colors",
                            line.sectionType === 'title' && "text-2xl font-bold",
                            line.sectionType === 'heading' && "text-xl font-bold"
                          )}
                          onDoubleClick={(e) => handleLineDoubleClick(e, line.id, 'french', line.frenchText, line.frenchStyles)}
                        >
                           <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                              <Pen size={12} className="text-gray-400" />
                           </div>
                          <WordGroupRenderer 
                            text={line.frenchText} 
                            language="french" 
                            lineId={line.id}
                            styles={line.frenchStyles}
                          />
                        </div>
                      )}
                      
                      {/* English Row */}
                      {uiSettings.showEnglish && (
                        <div 
                          className={clsx(
                            "relative p-1 rounded hover:bg-gray-50 transition-colors text-gray-500",
                            line.sectionType === 'title' && "text-lg italic text-gray-400",
                            line.sectionType === 'heading' && "text-base italic text-gray-400"
                          )}
                          onDoubleClick={(e) => handleLineDoubleClick(e, line.id, 'english', line.englishText, line.englishStyles)}
                        >
                           <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                               <Pen size={12} className="text-gray-400" />
                           </div>
                          <WordGroupRenderer 
                            text={line.englishText} 
                            language="english" 
                            lineId={line.id}
                            styles={line.englishStyles}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* French Column */}
                      {uiSettings.showFrench && (
                        <div 
                          className={clsx(
                            "relative p-1 rounded hover:bg-gray-50 transition-colors",
                            line.sectionType === 'title' && "text-2xl font-bold text-center",
                            line.sectionType === 'heading' && "text-xl font-bold",
                            line.sectionType === 'note' && "text-sm italic text-gray-500 bg-yellow-50 border-l-4 border-yellow-300 pl-3",
                            line.sectionType === 'list' && "pl-6 before:content-['•'] before:absolute before:left-2 before:text-gray-400",
                            line.sectionType === 'paragraph' && "text-base"
                          )}
                          onDoubleClick={(e) => handleLineDoubleClick(e, line.id, 'french', line.frenchText, line.frenchStyles)}
                        >
                           <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                              <Pen size={12} className="text-gray-400" />
                           </div>
                          <WordGroupRenderer 
                            text={line.frenchText} 
                            language="french" 
                            lineId={line.id}
                            styles={line.frenchStyles}
                          />
                        </div>
                      )}

                      {/* Separation Handler (Draggable) - Only show if both columns visible */}
                      {uiSettings.showFrench && uiSettings.showEnglish && (
                        <div 
                           onMouseDown={handleSplitMouseDown}
                           className="absolute top-0 bottom-0 w-2 -ml-1 cursor-ew-resize hover:bg-blue-400 z-20 opacity-0 hover:opacity-50 transition-opacity" 
                           style={{ left: `calc(3rem + ${splitRatio * 100}%)` }}
                           title="Drag to resize columns"
                        />
                      )}

                      {/* English Column */}
                      {uiSettings.showEnglish && (
                        <div 
                          className={clsx(
                            "relative p-1 rounded hover:bg-gray-50 transition-colors",
                            uiSettings.showFrench && "border-l border-gray-100 pl-4",
                            line.sectionType === 'title' && "text-lg italic text-gray-400 text-center",
                            line.sectionType === 'heading' && "text-base italic text-gray-400",
                            line.sectionType === 'note' && "text-sm italic text-gray-400 bg-yellow-50/50",
                            line.sectionType === 'list' && "pl-6",
                            line.sectionType === 'paragraph' && "text-base text-gray-600"
                          )}
                          onDoubleClick={(e) => handleLineDoubleClick(e, line.id, 'english', line.englishText, line.englishStyles)}
                        >
                           <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                               <Pen size={12} className="text-gray-400" />
                           </div>
                          <WordGroupRenderer 
                            text={line.englishText} 
                            language="english" 
                            lineId={line.id}
                            styles={line.englishStyles}
                          />
                        </div>
                      )}
                    </>
                  )}


                  {/* Sidebar Column (Annotations) */}
                  <div className="relative">
                    {sidebars.filter(s => s.anchoredLineId === line.id).map(card => {
                        const typeFn = getColorForAnecdote(card.type as AnecdoteType);
                        return (
                          <div 
                            key={card.id} 
                            className="p-2 rounded text-sm mb-2 shadow-sm group/card relative transition-all hover:scale-105"
                            style={{ backgroundColor: card.color || typeFn || '#fef3c7' }}
                          >
                            {/* Card Hover Actions */}
                            <div className="absolute -right-2 -top-2 hidden group-hover/card:flex bg-white shadow rounded-full border overflow-hidden">
                                <button
                                   onClick={() => removeSidebarCard(card.id)}
                                   className="p-1 hover:bg-red-50 text-red-500"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                            
                            {/* Editable Type Selector */}
                            <div className="mb-1">
                                <select
                                  value={card.type}
                                  onChange={(e) => {
                                    const newType = e.target.value as AnecdoteType;
                                    const newColor = getColorForAnecdote(newType);
                                    updateSidebarCard(card.id, { type: newType, color: newColor });
                                  }}
                                  className="font-bold text-[10px] opacity-70 uppercase bg-transparent border-none p-0 cursor-pointer focus:ring-0 hover:opacity-100"
                                >
                                  {(['grammar', 'spoken', 'history', 'falseFriend', 'pronunciation', 'vocab'] as AnecdoteType[]).map(type => (
                                    <option key={type} value={type}>{type === 'falseFriend' ? 'False Friend' : type}</option>
                                  ))}
                                </select>
                            </div>
                            <textarea
                              className="w-full bg-transparent border-none resize-none focus:ring-0 text-gray-800 p-0 text-xs"
                              value={card.content}
                              onChange={(e) => {
                                updateSidebarCard(card.id, { content: e.target.value });
                              }}
                              rows={3}
                            />
                          </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div >
        ) : (
            <div className="flex items-center justify-center h-full text-gray-400 italic">
                No pages to display. Add content or create a page.
            </div>
        )}
      </div>
    </div >
  );
};
