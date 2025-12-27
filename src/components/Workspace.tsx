import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { WordGroupRenderer } from './WordGroupRenderer';
import { CustomArrowLayer } from './CustomArrowLayer';
import { ContentBlockRenderer } from './ContentBlockRenderer';
import { PlusCircle, Pen, Settings2, Trash2, X, Volume2, Link } from 'lucide-react';
import { clsx } from 'clsx';
import { RichTextEditor } from './RichTextEditor';
import { ArrowTemplateMenu } from './ArrowTemplateMenu';
import { ArrowEditMenu } from './ArrowEditMenu';
import { DraggablePopup } from './DraggablePopup';
import { TextStyle, AnecdoteType, PageContent } from '../types';
import { ViewModeSelector, SpreadNavigator } from './PageSpreadView';
import { createContentFromSnippetId } from './SnippetLibrary';

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
        syncLineStyles,
        updateLineStyles,
        uiSettings,
        updateLineProperty,
        reorderLines,
        saveToHistory,
        zoomLevel,
        selectedElementId,
        selectedElementType,
        updateArrow,
        removeArrow,
        arrows,
        viewMode,
        setViewMode,
        insertContent,
        setCurrentPageIndex
    } = useStore();

    const [editorState, setEditorState] = useState<{
        isOpen: boolean;
        lineId: string | null;
        language: 'french' | 'english' | null;
        initialText: string;
        initialStyles: TextStyle[];
        position: { x: number; y: number };
    }>({
        isOpen: false,
        lineId: null,
        language: null,
        initialText: '',
        initialStyles: [],
        position: { x: 0, y: 0 }
    });

    const workspaceRef = useRef<HTMLDivElement>(null);
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [scrollStart, setScrollStart] = useState({ left: 0, top: 0 });

    const isDraggingSplit = useRef(false);
    const [draggedLineIndex, setDraggedLineIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    // Arrow Menu State
    const [arrowMenu, setArrowMenu] = useState<{ isOpen: boolean; x: number; y: number } | null>(null);
    const [arrowEditMenuPosition, setArrowEditMenuPosition] = useState<{ x: number; y: number } | null>(null);

    // Sidebar Card Creation Menu State
    const [sidebarMenu, setSidebarMenu] = useState<{ isOpen: boolean; x: number; y: number; lineId: string } | null>(null);
    
    // Legacy/WordGroup Anecdote Menu State (Type Selection)
    const [anecdoteMenu, setAnecdoteMenu] = useState<{ isOpen: boolean; x: number; y: number; wordGroupId: string } | null>(null);

    // Selected line for keyboard operations
    const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);
    
    // Spread view state (for two-page spread mode)
    const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);

    const currentPage = pages[currentPageIndex || 0];
    const splitRatio = currentPage?.splitRatio ?? theme.pageLayout?.splitRatio ?? 0.5;
    
    // Get pages for spread view (left = verso/even, right = recto/odd)
    // @ts-expect-error - Will be used for spread view rendering
    const _getSpreadPages = useCallback(() => {
        const leftPageIndex = currentSpreadIndex * 2;
        const rightPageIndex = leftPageIndex + 1;
        return {
            leftPage: pages[leftPageIndex] || null,
            rightPage: pages[rightPageIndex] || null,
            leftPageNumber: leftPageIndex + 1,
            rightPageNumber: rightPageIndex + 1,
        };
    }, [currentSpreadIndex, pages]);
    
    // Handle snippet/image drops on the page
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        
        // Check for snippet drop
        const snippetData = e.dataTransfer.getData('application/x-snippet');
        if (snippetData) {
            try {
                const { id } = JSON.parse(snippetData);
                const content = createContentFromSnippetId(id);
                if (content && currentPage) {
                    insertContent(currentPage.id, content);
                }
            } catch (err) {
                console.error('Failed to parse snippet:', err);
            }
            return;
        }
        
        // Check for image drop
        const imageData = e.dataTransfer.getData('application/x-image');
        if (imageData) {
            try {
                const { path, name } = JSON.parse(imageData);
                if (currentPage) {
                    insertContent(currentPage.id, {
                        id: '',
                        type: 'image',
                        src: `http://localhost:3001${path}`,
                        alt: name,
                        alignment: 'center',
                        width: '80%'
                    } as PageContent);
                }
            } catch (err) {
                console.error('Failed to parse image:', err);
            }
        }
    }, [currentPage, insertContent]);

    // Helper to get coordinates relative to the zoomed workspace-inner
    const getRelativePosition = (clientX: number, clientY: number) => {
        const inner = workspaceRef.current?.querySelector('.workspace-inner');
        if (!inner) return { x: 0, y: 0 };
        const rect = inner.getBoundingClientRect();
        return {
            x: (clientX - rect.left) / zoomLevel,
            y: (clientY - rect.top) / zoomLevel
        };
    };

    // Keyboard shortcuts for line reordering
    useEffect(() => {
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
    }, [currentPage, selectedLineIndex, reorderLines, setSelectedLineIndex]);

    // TTS Utility Logic cleanup
    useEffect(() => {
        return () => window.speechSynthesis?.cancel();
    }, []);

    useEffect(() => {
        if (arrowCreation?.sourceGroupIds.length > 0 && arrowCreation?.targetGroupIds.length > 0) {
            const el = document.getElementById(arrowCreation.lastInteractedGroupId || '');
            const rect = el?.getBoundingClientRect();
            // Use window center as fallback, but relative to inner
            const fallbackX = window.innerWidth / 2;
            const fallbackY = window.innerHeight / 2;
            
            const rawX = rect ? rect.right + 10 : fallbackX;
            const rawY = rect ? rect.top : fallbackY;
            
            const pos = getRelativePosition(rawX, rawY);
            setArrowMenu({ isOpen: true, x: pos.x, y: pos.y });
        }
    }, [arrowCreation?.sourceGroupIds, arrowCreation?.targetGroupIds]);

    const handleBackgroundClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('workspace-inner')) {
            if (selectionMode === 'none') {
                setSelectedElement(null, null);
                setArrowEditMenuPosition(null);
            }
            clearWordGroupSelection();
            cancelArrowCreation();
            setSidebarMenu(null); // Close sidebar menu
        }
    };
    
    const handleSplitMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        isDraggingSplit.current = true;
        document.body.style.cursor = 'col-resize';

        const onMouseMove = (moveEvent: MouseEvent) => {
            if (!isDraggingSplit.current || !currentPage || !workspaceRef.current) return;
            const container = workspaceRef.current.querySelector('.grid');
            if (!container) return;

            const rect = container.getBoundingClientRect();
            
            const fixedLeft = 48; // 3rem
            const fixedRight = 192; // 12rem
            const flexibleWidth = rect.width - fixedLeft - fixedRight;

            if (flexibleWidth <= 0) return;

            const relativeX = moveEvent.clientX - rect.left - fixedLeft;
            
            let newRatio = relativeX / flexibleWidth;
            newRatio = Math.max(0.15, Math.min(0.85, newRatio));
            updatePage(currentPage.id, { splitRatio: newRatio });
        };

        const onMouseUp = () => {
            isDraggingSplit.current = false;
            document.body.style.cursor = 'default';
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            saveToHistory();
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    const handleWorkspaceMouseDown = (e: React.MouseEvent) => {
        if (e.shiftKey || e.button === 1) {
            setIsPanning(true);
            setPanStart({ x: e.clientX, y: e.clientY });
            if (workspaceRef.current) {
                setScrollStart({
                    left: workspaceRef.current.scrollLeft,
                    top: workspaceRef.current.scrollTop
                });
            }
            document.body.style.cursor = 'grabbing';
            e.preventDefault();
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isPanning || !workspaceRef.current) return;
            const dx = e.clientX - panStart.x;
            const dy = e.clientY - panStart.y;
            workspaceRef.current.scrollLeft = scrollStart.left - dx;
            workspaceRef.current.scrollTop = scrollStart.top - dy;
        };

        const handleMouseUp = () => {
            if (isPanning) {
                setIsPanning(false);
                document.body.style.cursor = 'default';
            }
        };

        if (isPanning) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isPanning, panStart, scrollStart]);

    const getGridTemplate = () => {
        const { showFrench, showEnglish } = uiSettings;
        const { layoutMode } = theme;
        if (layoutMode === 'interlinear') return "3rem 1fr 12rem";

        const parts = ["3rem"];
        if (showFrench && showEnglish) {
            // Use minmax to prevent columns from crushing below readable width
            // Each text column gets at least 120px minimum
            const frenchWidth = `minmax(120px, ${splitRatio}fr)`;
            const englishWidth = `minmax(120px, ${1 - splitRatio}fr)`;
            parts.push(frenchWidth);
            parts.push(englishWidth);
        } else if (showFrench || showEnglish) {
            parts.push("minmax(200px, 1fr)");
        }
        parts.push("12rem");
        return parts.join(" ");
    };

    const handleLineDoubleClick = (e: React.MouseEvent, lineId: string, language: 'french' | 'english', text: string, styles: TextStyle[] = []) => {
        e.stopPropagation();
        const pos = getRelativePosition(e.clientX, e.clientY);
        setEditorState({
            isOpen: true,
            lineId,
            language,
            initialText: text,
            initialStyles: styles,
            position: pos
        });
    };

    const saveRichText = (_text: string, styles: TextStyle[], shouldSync?: boolean) => {
        if (editorState.lineId && editorState.language) {
            updateLineStyles(editorState.lineId, editorState.language, styles);
            if (shouldSync) syncLineStyles(editorState.lineId, editorState.language, styles);
        }
        setEditorState({ ...editorState, isOpen: false });
    };

    const getPageStyle = (pageNumber?: number) => {
        const layout = theme.pageLayout;
        if (layout) {
            // Calculate effective margins with gutter support
            const baseMargins = {
                top: layout.margins.top,
                right: layout.margins.right,
                bottom: layout.margins.bottom,
                left: layout.margins.left,
            };
            
            // Apply mirror margins and gutter for book binding
            // Even pages (left/verso): gutter on right
            // Odd pages (right/recto): gutter on left
            const isRecto = (pageNumber || (currentPageIndex || 0) + 1) % 2 === 1;
            const gutter = layout.gutter || '0mm';
            const gutterNum = parseFloat(gutter) || 0;
            const gutterUnit = gutter.replace(/[0-9.]/g, '') || 'mm';
            
            let effectiveLeft = baseMargins.left;
            let effectiveRight = baseMargins.right;
            
            if (layout.mirrorMargins && gutterNum > 0) {
                if (isRecto) {
                    // Odd pages: add gutter to left (inside)
                    const leftNum = parseFloat(baseMargins.left) || 0;
                    effectiveLeft = `${leftNum + gutterNum}${gutterUnit}`;
                } else {
                    // Even pages: add gutter to right (inside)
                    const rightNum = parseFloat(baseMargins.right) || 0;
                    effectiveRight = `${rightNum + gutterNum}${gutterUnit}`;
                }
            }
            
            return {
                width: layout.width,
                minHeight: layout.height,
                paddingTop: baseMargins.top,
                paddingRight: effectiveRight,
                paddingBottom: baseMargins.bottom,
                paddingLeft: effectiveLeft,
                backgroundColor: theme.pageBackground || '#ffffff',
            };
        }
        return {
            width: '210mm',
            minHeight: '297mm',
            padding: '15mm',
            backgroundColor: theme.pageBackground || '#ffffff',
        };
    };
    
    // Helper function to render page content (lines, sidebars, etc.)
    const renderPageContent = (page: typeof pages[0], _pageIdx: number) => (
        <div className="space-y-6 relative z-0">
            {page.lines.map((line, lineIndex) => {
                // Check if this line has polymorphic contentData (non-text type)
                const contentData = (line as { contentData?: PageContent }).contentData;
                const isPolymorphicContent = contentData && contentData.type && contentData.type !== 'text';
                
                // Render polymorphic content (divider, table, callout, image)
                if (isPolymorphicContent) {
                    return (
                        <div 
                            key={line.id}
                            className={clsx(
                                "relative group transition-all",
                                dragOverIndex === lineIndex && "ring-2 ring-blue-400 bg-blue-50",
                                draggedLineIndex === lineIndex && "opacity-50 scale-[0.98]",
                                selectedLineIndex === lineIndex && "ring-2 ring-indigo-400 bg-indigo-50"
                            )}
                            onClick={() => setSelectedLineIndex(lineIndex)}
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (draggedLineIndex !== null && draggedLineIndex !== lineIndex) setDragOverIndex(lineIndex); }}
                            onDragLeave={() => setDragOverIndex(null)}
                            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); if (draggedLineIndex !== null && draggedLineIndex !== lineIndex) { reorderLines(page.id, draggedLineIndex, lineIndex); } setDraggedLineIndex(null); setDragOverIndex(null); }}
                        >
                            {/* Drag handle for polymorphic content */}
                            <div 
                                className="absolute -left-8 top-0 text-gray-300 font-mono text-sm cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                                draggable
                                onDragStart={(e) => { 
                                    e.stopPropagation();
                                    setDraggedLineIndex(lineIndex); 
                                    e.dataTransfer.setData('text/plain', String(lineIndex));
                                    e.dataTransfer.effectAllowed = 'move';
                                }}
                                onDragEnd={() => { setDraggedLineIndex(null); setDragOverIndex(null); }}
                                title="Drag to reorder"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
                                    <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                                    <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
                                </svg>
                            </div>
                            
                            <ContentBlockRenderer
                                content={contentData}
                                showFrench={uiSettings.showFrench}
                                showEnglish={uiSettings.showEnglish}
                                splitRatio={splitRatio}
                                editable={true}
                                onUpdate={(updates) => {
                                    // Update contentData for the line
                                    updatePage(page.id, {
                                        lines: page.lines.map(l => 
                                            l.id === line.id 
                                                ? { ...l, contentData: { ...contentData, ...updates } }
                                                : l
                                        )
                                    });
                                }}
                                onDelete={() => removeLine(page.id, line.id)}
                            />
                        </div>
                    );
                }
                
                // Standard text line rendering
                return (
                <div key={line.id} 
                    className={clsx(
                        "grid gap-4 group relative transition-all",
                        dragOverIndex === lineIndex && "ring-2 ring-blue-400 bg-blue-50",
                        draggedLineIndex === lineIndex && "opacity-50 scale-[0.98]",
                        selectedLineIndex === lineIndex && "ring-2 ring-indigo-400 bg-indigo-50"
                    )}
                    style={{ gridTemplateColumns: getGridTemplate() }}
                    onClick={() => setSelectedLineIndex(lineIndex)}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (draggedLineIndex !== null && draggedLineIndex !== lineIndex) setDragOverIndex(lineIndex); }}
                    onDragLeave={() => setDragOverIndex(null)}
                    onDrop={(e) => { e.preventDefault(); e.stopPropagation(); if (draggedLineIndex !== null && draggedLineIndex !== lineIndex) { reorderLines(page.id, draggedLineIndex, lineIndex); } setDraggedLineIndex(null); setDragOverIndex(null); }}
                >
                    {/* Line Number Column - Acts as drag handle */}
                    <div 
                        className="text-gray-300 font-mono text-sm text-right pr-2 pt-1 select-none flex flex-col items-end gap-1 cursor-grab active:cursor-grabbing"
                        draggable
                        onDragStart={(e) => { 
                            e.stopPropagation();
                            setDraggedLineIndex(lineIndex); 
                            e.dataTransfer.setData('text/plain', String(lineIndex));
                            e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragEnd={() => { setDraggedLineIndex(null); setDragOverIndex(null); }}
                        title="Drag to reorder"
                    >
                        <span className="group-hover:hidden">{line.lineNumber}</span>
                        <div className="hidden group-hover:flex flex-col gap-1 no-print">
                            {/* Drag grip icon */}
                            <div className="text-gray-400 hover:text-gray-600 p-1 cursor-grab" title="Drag to reorder">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
                                    <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                                    <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
                                </svg>
                            </div>
                            <button className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded" title="Add Anecdote"
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const pos = getRelativePosition(rect.right + 10, rect.top);
                                    setSidebarMenu({ isOpen: true, x: pos.x, y: pos.y, lineId: line.id });
                                }}>
                                <PlusCircle size={14} /></button>
                            <button className="text-indigo-500 hover:text-indigo-700 p-1 hover:bg-indigo-50 rounded" title="Speak"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (line.audioUrl) {
                                    const audio = new Audio(line.audioUrl);
                                    audio.play().catch(console.error);
                                  } else {
                                    const u = new SpeechSynthesisUtterance(line.frenchText);
                                    u.lang = 'fr-FR';
                                    window.speechSynthesis.speak(u);
                                  }
                                }}>
                                <Volume2 size={14} /></button>
                            <button className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded relative group/manage no-print" title="Manage">
                                <Settings2 size={14} />
                                <div className="absolute left-full top-0 ml-2 bg-white dark:bg-gray-800 shadow-xl border dark:border-gray-700 rounded p-2 w-32 hidden group-focus-within/manage:block z-[100]">
                                    <button className="w-full text-left text-xs p-1 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded flex gap-2 items-center"
                                        onClick={(e) => { e.stopPropagation(); if (confirm('Delete line?')) removeLine(page.id, line.id); }}>
                                        <Trash2 size={12} /> Delete</button>
                                    <div className="border-t dark:border-gray-700 my-1 pt-1">
                                        {(['paragraph', 'title', 'heading', 'note', 'list'] as const).map(type => (
                                            <button key={type} className={clsx("w-full text-left text-[10px] p-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700 capitalize dark:text-gray-300", line.sectionType === type && "text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/30")}
                                                onClick={(e) => { e.stopPropagation(); updateLineProperty(line.id, { sectionType: type }); }}>{type}</button>
                                        ))}
                                    </div>
                                    <div className="border-t dark:border-gray-700 my-1 pt-1">
                                      <button className="w-full text-left text-[10px] p-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700 flex gap-2 items-center dark:text-gray-300"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const url = prompt("Enter Audio URL (mp3/wav):", line.audioUrl || '');
                                          if (url !== null) {
                                            updateLineProperty(line.id, { audioUrl: url });
                                          }
                                        }}>
                                        <Link size={10} /> {line.audioUrl ? 'Edit Audio' : 'Add Audio'}
                                      </button>
                                    </div>
                                </div></button>
                        </div>
                    </div>
                    {theme.layoutMode === 'interlinear' ? (
                        <div className={clsx("relative p-1 space-y-2", line.sectionType === 'title' && "text-center py-4", line.sectionType === 'heading' && "border-b border-gray-100 py-2")}>
                            {uiSettings.showFrench && (
                                <div className={clsx("relative p-1 rounded hover:bg-gray-50", line.sectionType === 'title' && "text-2xl font-bold", line.sectionType === 'heading' && "text-xl font-bold")}
                                    onDoubleClick={(e) => handleLineDoubleClick(e, line.id, 'french', line.frenchText, line.frenchStyles)}>
                                    <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                        <Pen size={12} className="text-gray-400" />
                                    </div>
                                    <WordGroupRenderer text={line.frenchText} language="french" lineId={line.id} styles={line.frenchStyles} /></div>
                            )}
                            {uiSettings.showEnglish && (
                                <div className={clsx("relative p-1 rounded hover:bg-gray-50 text-gray-500", line.sectionType === 'title' && "text-lg italic text-gray-400", line.sectionType === 'heading' && "text-base italic text-gray-400")}
                                    onDoubleClick={(e) => handleLineDoubleClick(e, line.id, 'english', line.englishText, line.englishStyles)}>
                                    <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                        <Pen size={12} className="text-gray-400" />
                                    </div>
                                    <WordGroupRenderer text={line.englishText} language="english" lineId={line.id} styles={line.englishStyles} /></div>
                            )}
                        </div>
                    ) : (
                        <>
                            {uiSettings.showFrench && (
                                <div className={clsx("relative p-1 rounded hover:bg-gray-50", line.sectionType === 'title' && "text-2xl font-bold text-center", line.sectionType === 'heading' && "text-xl font-bold", line.sectionType === 'note' && "text-sm italic text-gray-500 bg-yellow-50 border-l-4 border-yellow-300 pl-3")}
                                    onDoubleClick={(e) => handleLineDoubleClick(e, line.id, 'french', line.frenchText, line.frenchStyles)}>
                                    <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                        <Pen size={12} className="text-gray-400" />
                                    </div>
                                    <WordGroupRenderer text={line.frenchText} language="french" lineId={line.id} styles={line.frenchStyles} /></div>
                            )}

                            {uiSettings.showFrench && uiSettings.showEnglish && (
                                <div onMouseDown={handleSplitMouseDown}
                                    className="absolute top-0 bottom-0 w-4 -ml-2 cursor-col-resize hover:bg-blue-400/20 z-20 transition-colors flex justify-center no-print"
                                    style={{ left: `calc(3rem + (100% - 3rem - 12rem) * ${splitRatio})` }}>
                                        {/* Visual indicator line */}
                                        <div className="w-px h-full bg-gray-200 group-hover:bg-blue-400"></div>
                                </div>
                            )}

                            {uiSettings.showEnglish && (
                                <div className={clsx("relative p-1 rounded hover:bg-gray-50", uiSettings.showFrench && "border-l border-gray-100 pl-4", line.sectionType === 'title' && "text-lg italic text-gray-400 text-center", line.sectionType === 'heading' && "text-base italic text-gray-400")}
                                    onDoubleClick={(e) => handleLineDoubleClick(e, line.id, 'english', line.englishText, line.englishStyles)}>
                                    <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                        <Pen size={12} className="text-gray-400" />
                                    </div>
                                    <WordGroupRenderer text={line.englishText} language="english" lineId={line.id} styles={line.englishStyles} /></div>
                            )}
                        </>
                    )}
                    <div className="relative">
                    {sidebars.filter(s => s.anchoredLineId === line.id).map(card => {
                            const color = card.color || getColorForAnecdote(card.type as AnecdoteType) || '#fef3c7';
                            
                            // Get type label
                            const typeLabels: Record<string, string> = {
                                grammar: '📘 Grammar',
                                spoken: '💬 Spoken',
                                history: '📜 History',
                                falseFriend: '⚠️ False Friend',
                                pronunciation: '🔊 Pronunciation',
                                vocab: '📚 Vocabulary'
                            };
                            const typeLabel = typeLabels[card.type] || card.type;
                            
                            return (
                                <div key={card.id} className="rounded text-sm mb-2 shadow-sm group/card relative overflow-hidden" style={{ backgroundColor: color }}>
                                    {/* Title/Type Header - darker background */}
                                    <div 
                                        className="px-2 py-1 font-bold text-xs text-gray-800 flex items-center justify-between"
                                        style={{ 
                                            backgroundColor: 'rgba(0,0,0,0.15)',
                                            borderBottom: '1px solid rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        <span>{card.title || typeLabel}</span>
                                        <div className="hidden group-hover/card:flex no-print">
                                            <button onClick={() => removeSidebarCard(card.id)} className="p-0.5 hover:bg-red-100 text-red-600 rounded"><X size={12} /></button>
                                        </div>
                                    </div>
                                    
                                    {/* Card content */}
                                    <div className="p-2">
                                        <textarea 
                                            className="w-full bg-transparent border-none resize-none focus:ring-0 text-gray-800 p-0 text-xs"
                                            value={card.content} 
                                            onChange={(e) => updateSidebarCard(card.id, { content: e.target.value })} 
                                            rows={2} 
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );})}
        </div>
    );
    
    /* 
    // Helper to calculate "Above" position (Available for future use)
    const getAbovePosition = (rect: DOMRect, height: number = 200) => {
        const x = rect.left + rect.width / 2;
        const y = rect.top - height - 10;
        return { x, y };
    }; 
    */

    // Get color profile class
    const colorProfileClass = theme.printSettings?.colorProfile === 'CMYK' 
        ? 'color-profile-cmyk' 
        : theme.printSettings?.colorProfile === 'AdobeRGB' 
            ? 'color-profile-adobergb' 
            : '';

    return (
        <div id="workspace-container" ref={workspaceRef}
            className={clsx(
                "flex-1 overflow-auto bg-gray-200 p-8 relative flex flex-col items-center", 
                uiSettings.focusMode && "p-0",
                colorProfileClass
            )}
            onClick={handleBackgroundClick} 
            onMouseDown={handleWorkspaceMouseDown}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
            onDrop={handleDrop}
        >
            
            {/* View Mode Toolbar */}
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 flex items-center gap-3 no-print">
                <ViewModeSelector 
                    currentMode={viewMode} 
                    onModeChange={setViewMode} 
                />
                
                {/* Spread Navigator (only in spread view) */}
                {viewMode === 'spread' && (
                    <SpreadNavigator
                        currentSpread={currentSpreadIndex}
                        totalPages={pages.length}
                        onNavigate={setCurrentSpreadIndex}
                    />
                )}
                
                {/* Page Navigation (only in single view) */}
                {viewMode === 'single' && pages.length > 1 && (
                    <div className="flex items-center gap-2 bg-white rounded-lg shadow px-3 py-2">
                        <button
                            onClick={() => currentPageIndex > 0 && setCurrentPageIndex(currentPageIndex - 1)}
                            disabled={currentPageIndex === 0}
                            className={clsx(
                                'px-2 py-1 rounded text-sm',
                                currentPageIndex > 0 
                                    ? 'text-gray-700 hover:bg-gray-100' 
                                    : 'text-gray-300 cursor-not-allowed'
                            )}
                        >
                            ← Prev
                        </button>
                        <div className="text-xs text-gray-500 px-2">
                            Page {(currentPageIndex || 0) + 1} of {pages.length}
                        </div>
                        <button
                            onClick={() => currentPageIndex < pages.length - 1 && setCurrentPageIndex(currentPageIndex + 1)}
                            disabled={currentPageIndex >= pages.length - 1}
                            className={clsx(
                                'px-2 py-1 rounded text-sm',
                                currentPageIndex < pages.length - 1 
                                    ? 'text-gray-700 hover:bg-gray-100' 
                                    : 'text-gray-300 cursor-not-allowed'
                            )}
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
            
            {/* Color Picker for Legacy Highlight Mode */}
            {selectionMode === 'highlight' && (
                <DraggablePopup
                    initialPosition={{ x: window.innerWidth / 2 - 100, y: 80 }}
                    title="Pick Color"
                    onClose={() => useStore.setState({ selectionMode: 'none' })}
                >
                    <div className="flex gap-2 p-1">
                        {theme.highlightColors.map(color => (
                            <button
                                key={color}
                                className={clsx("w-6 h-6 rounded-full border border-gray-200 dark:border-gray-600 hover:scale-110 transition-transform", useStore.getState().selectedColor === color && "ring-2 ring-blue-500")}
                                style={{ backgroundColor: color }}
                                onClick={() => useStore.setState({ selectedColor: color })}
                            />
                        ))}
                    </div>
                </DraggablePopup>
            )}

            <div className="workspace-inner relative shadow-2xl origin-top transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel})`, marginBottom: `${(zoomLevel - 1) * 100}%` }}>
                <div style={{ zIndex: draggedLineIndex !== null ? -1 : 10, position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    <CustomArrowLayer 
                        onArrowClick={(_id, pos) => {
                            // Position helper above the arrow click
                            // pos is already clientX/Y from the event
                            const relPos = getRelativePosition(pos.x, pos.y);
                            setArrowEditMenuPosition({ x: relPos.x, y: relPos.y - 120 }); // Adjust offset as needed
                        }} 
                    />
                </div>
                
                {selectedElementId && selectedElementType === 'arrow' && arrowEditMenuPosition && (
                    <ArrowEditMenu
                        arrowId={selectedElementId}
                        currentStyle={arrows.find(a => a.id === selectedElementId)?.style || 'solid'}
                        currentHeadStyle={arrows.find(a => a.id === selectedElementId)?.headStyle || 'arrow'}
                        currentWidth={arrows.find(a => a.id === selectedElementId)?.strokeWidth || 2}
                        currentColor={arrows.find(a => a.id === selectedElementId)?.color || '#000000'}
                        position={arrowEditMenuPosition}
                        onUpdate={(id, updates) => updateArrow(id, updates)}
                        onDelete={(id) => {
                            removeArrow(id);
                            setArrowEditMenuPosition(null);
                            setSelectedElement(null, null);
                        }}
                        onClose={() => {
                            setArrowEditMenuPosition(null);
                            setSelectedElement(null, null);
                        }}
                    />
                )}
                <ArrowTemplateMenu
                    isOpen={arrowMenu?.isOpen || false}
                    position={arrowMenu ? { x: arrowMenu.x, y: arrowMenu.y - 200 } : undefined} // Spawn above
                    onSelect={(template) => {
                        useStore.getState().confirmArrowCreation({ style: template.style, headStyle: template.headStyle, color: template.color || useStore.getState().selectedColor });
                        setArrowMenu(null);
                    }}
                    onClose={() => {
                        useStore.getState().cancelArrowCreation();
                        setArrowMenu(null);
                    }}
                />
                {/* Anecdote TYPE selection menu for Word Groups (existing) */}
                {anecdoteMenu && (
                    <DraggablePopup
                        initialPosition={{ x: anecdoteMenu.x, y: anecdoteMenu.y - 180 }}
                        title="Select Word Type"
                        onClose={() => setAnecdoteMenu(null)}
                    >
                        <div className="grid grid-cols-2 gap-2 w-60">
                            {([
                                { type: 'grammar', label: 'Grammar' },
                                { type: 'spoken', label: 'Spoken' },
                                { type: 'history', label: 'History' },
                                { type: 'falseFriend', label: 'False Friend' },
                                { type: 'pronunciation', label: 'Pronunciation' },
                                { type: 'vocab', label: 'Vocab' },
                            ] as const).map(({ type, label }) => (
                                <button key={type} className="text-left text-xs p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
                                    onClick={() => {
                                        updateWordGroup(anecdoteMenu.wordGroupId, { color: getColorForAnecdote(type), anecdoteType: type });
                                        setAnecdoteMenu(null);
                                    }}>{label}</button>
                            ))}
                        </div>
                    </DraggablePopup>
                )}
                
                {/* NEW: Sidebar Card Creation Menu */}
                {sidebarMenu && (
                    <DraggablePopup
                        initialPosition={{ x: sidebarMenu.x, y: sidebarMenu.y }}
                        title="Add Anecdote"
                        onClose={() => setSidebarMenu(null)}
                    >
                        <div className="grid grid-cols-2 gap-2 w-60">
                            {([
                                { type: 'grammar', label: 'Grammar' },
                                { type: 'spoken', label: 'Spoken' },
                                { type: 'history', label: 'History' },
                                { type: 'falseFriend', label: 'False Friend' },
                                { type: 'pronunciation', label: 'Pronunciation' },
                                { type: 'vocab', label: 'Vocab' },
                            ] as const).map(({ type, label }) => (
                                <button key={type} className="text-left text-xs p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
                                    onClick={() => {
                                        addSidebarCard({ type: type, content: 'New Note', anchoredLineId: sidebarMenu.lineId });
                                        setSidebarMenu(null);
                                    }}>{label}</button>
                            ))}
                        </div>
                    </DraggablePopup>
                )}

                {editorState.isOpen && (
                    <RichTextEditor initialText={editorState.initialText} initialStyles={editorState.initialStyles}
                        onSave={saveRichText} onCancel={() => setEditorState({ ...editorState, isOpen: false })} 
                        // Ensure editor spawns somewhat above or near pointer but safely
                        position={{ x: editorState.position.x, y: Math.max(10, editorState.position.y - 250) }} />
                )}
                <div className="print:block origin-top">
                    {pages.length > 0 ? (
                        <>
                            {/* ═══════════════════════════════════════════════════════════
                                SINGLE PAGE VIEW MODE
                                ═══════════════════════════════════════════════════════════ */}
                            {viewMode === 'single' && currentPage && (
                                <div key={currentPage.id} className="bg-white shadow-lg mx-auto mb-8 relative print:w-full print:h-screen print:shadow-none"
                                    style={{ ...getPageStyle((currentPageIndex || 0) + 1), fontSize: theme.fontSize, lineHeight: theme.lineHeight }}>
                                    <div className="absolute -top-8 left-0 right-0 text-center text-gray-400 text-xs no-print flex justify-between px-2">
                                        <span>Page {(currentPageIndex || 0) + 1} of {pages.length}</span>
                                    </div>
                                    {renderPageContent(currentPage, currentPageIndex || 0)}
                                </div>
                            )}
                            
                            {/* ═══════════════════════════════════════════════════════════
                                TWO-PAGE SPREAD VIEW MODE
                                ═══════════════════════════════════════════════════════════ */}
                            {viewMode === 'spread' && (
                                <div className="flex gap-4 items-start justify-center">
                                    {/* Left page (verso/even) */}
                                    {(() => {
                                        const leftPageIndex = currentSpreadIndex * 2;
                                        const leftPage = pages[leftPageIndex];
                                        if (!leftPage) return <div className="bg-gray-100 shadow-inner" style={{ ...getPageStyle(leftPageIndex + 1), opacity: 0.3 }} />;
                                        return (
                                            <div key={leftPage.id} className="bg-white shadow-lg relative"
                                                style={{ ...getPageStyle(leftPageIndex + 1), fontSize: theme.fontSize, lineHeight: theme.lineHeight }}>
                                                <div className="absolute -top-6 left-0 right-0 text-center text-gray-400 text-xs no-print">
                                                    Page {leftPageIndex + 1}
                                                </div>
                                                {renderPageContent(leftPage, leftPageIndex)}
                                            </div>
                                        );
                                    })()}
                                    
                                    {/* Gutter visualization */}
                                    <div className="w-2 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 self-stretch rounded opacity-50 no-print" />
                                    
                                    {/* Right page (recto/odd) */}
                                    {(() => {
                                        const rightPageIndex = currentSpreadIndex * 2 + 1;
                                        const rightPage = pages[rightPageIndex];
                                        if (!rightPage) return <div className="bg-gray-100 shadow-inner" style={{ ...getPageStyle(rightPageIndex + 1), opacity: 0.3 }} />;
                                        return (
                                            <div key={rightPage.id} className="bg-white shadow-lg relative"
                                                style={{ ...getPageStyle(rightPageIndex + 1), fontSize: theme.fontSize, lineHeight: theme.lineHeight }}>
                                                <div className="absolute -top-6 left-0 right-0 text-center text-gray-400 text-xs no-print">
                                                    Page {rightPageIndex + 1}
                                                </div>
                                                {renderPageContent(rightPage, rightPageIndex)}
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                            
                            {/* ═══════════════════════════════════════════════════════════
                                CONTINUOUS SCROLL VIEW MODE
                                ═══════════════════════════════════════════════════════════ */}
                            {viewMode === 'continuous' && (
                                <div className="space-y-8">
                                    {pages.map((page, pageIndex) => (
                                        <div key={page.id} className="bg-white shadow-lg mx-auto relative print:w-full print:h-screen print:shadow-none"
                                            style={{ ...getPageStyle(pageIndex + 1), fontSize: theme.fontSize, lineHeight: theme.lineHeight }}>
                                            <div className="absolute -top-6 left-0 right-0 text-center text-gray-400 text-xs no-print flex justify-between px-2">
                                                <span>Page {pageIndex + 1}</span>
                                            </div>
                                            {renderPageContent(page, pageIndex)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 italic">No pages to display.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Workspace;
