import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { WordGroupRenderer } from './WordGroupRenderer';
import { CustomArrowLayer } from './CustomArrowLayer';
import { PlusCircle, Pen, Settings2, Trash2, X, Volume2 } from 'lucide-react';
import { clsx } from 'clsx';
import { RichTextEditor } from './RichTextEditor';
import { ArrowTemplateMenu } from './ArrowTemplateMenu';
import { ArrowEditMenu } from './ArrowEditMenu';
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
        arrows
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

    // Anecdote Type Selection State
    const [anecdoteMenu, setAnecdoteMenu] = useState<{ isOpen: boolean; x: number; y: number; wordGroupId: string } | null>(null);

    // Selected line for keyboard operations
    const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);

    const currentPage = pages[currentPageIndex || 0];
    const splitRatio = currentPage?.splitRatio ?? theme.pageLayout?.splitRatio ?? 0.5;

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

    const handleBackgroundClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('workspace-inner')) {
            if (selectionMode === 'none') {
                setSelectedElement(null, null);
                setArrowEditMenuPosition(null);
            }
            clearWordGroupSelection();
            cancelArrowCreation();
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
            // Calculate relative to the flexible area
            // Total width = rect.width
            // Fixed widths = 3rem (48px) + 12rem (192px) = 240px
            // Flexible width = rect.width - 240px
            
            const fixedLeft = 48; // 3rem
            const fixedRight = 192; // 12rem
            const flexibleWidth = rect.width - fixedLeft - fixedRight;

            if (flexibleWidth <= 0) return;

            // Mouse position relative to the START of flexible area
            const relativeX = moveEvent.clientX - rect.left - fixedLeft;
            
            let newRatio = relativeX / flexibleWidth;
            newRatio = Math.max(0.1, Math.min(0.9, newRatio));
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
        // Allow panning with Shift + Click (or Middle click if requested, but user said Shift+Hold)
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
            parts.push(`${splitRatio}fr`);
            parts.push(`${1 - splitRatio}fr`);
        } else if (showFrench || showEnglish) {
            parts.push("1fr");
        }
        parts.push("12rem");
        return parts.join(" ");
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
            updateLineStyles(editorState.lineId, editorState.language, styles);
            if (shouldSync) syncLineStyles(editorState.lineId, editorState.language, styles);
        }
        setEditorState({ ...editorState, isOpen: false });
    };

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
        return {
            width: '210mm',
            minHeight: '297mm',
            padding: '15mm',
            backgroundColor: theme.pageBackground || '#ffffff',
        };
    };

    useEffect(() => {
        if (arrowCreation?.sourceGroupIds.length > 0 && arrowCreation?.targetGroupIds.length > 0) {
            const el = document.getElementById(arrowCreation.lastInteractedGroupId || '');
            const rect = el?.getBoundingClientRect();
            const pos = rect ? { x: rect.right + 10, y: rect.top } : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
            setArrowMenu({ isOpen: true, x: pos.x, y: pos.y });
        }
    }, [arrowCreation?.sourceGroupIds, arrowCreation?.targetGroupIds]);

    return (
        <div id="workspace-container" ref={workspaceRef}
            className={clsx("flex-1 overflow-auto bg-gray-200 p-8 relative flex flex-col items-center", uiSettings.focusMode && "p-0")}
            onClick={handleBackgroundClick} onMouseDown={handleWorkspaceMouseDown}>
            <div className="workspace-inner relative shadow-2xl origin-top transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel})`, marginBottom: `${(zoomLevel - 1) * 100}%` }}>
                <CustomArrowLayer 
                    onArrowClick={(_id, pos) => setArrowEditMenuPosition(pos)} 
                />
                
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
                    position={arrowMenu ? { x: arrowMenu.x, y: arrowMenu.y } : undefined}
                    onSelect={(template) => {
                        useStore.getState().confirmArrowCreation({ style: template.style, headStyle: template.headStyle, color: template.color || useStore.getState().selectedColor });
                        setArrowMenu(null);
                    }}
                    onClose={() => {
                        useStore.getState().cancelArrowCreation();
                        setArrowMenu(null);
                    }}
                />
                {anecdoteMenu && (
                    <div className="fixed z-50 bg-white shadow-xl border rounded-lg p-2 grid grid-cols-2 gap-2 w-64" style={{ top: anecdoteMenu.y, left: anecdoteMenu.x }}>
                        <h4 className="col-span-2 text-xs font-bold text-gray-500 mb-1 border-b pb-1">Select Anecdote Type</h4>
                        {([
                            { type: 'grammar', label: 'Grammar' },
                            { type: 'spoken', label: 'Spoken' },
                            { type: 'history', label: 'History' },
                            { type: 'falseFriend', label: 'False Friend' },
                            { type: 'pronunciation', label: 'Pronunciation' },
                            { type: 'vocab', label: 'Vocab' },
                        ] as const).map(({ type, label }) => (
                            <button key={type} className="text-left text-xs p-2 hover:bg-blue-50 text-blue-700 rounded border border-transparent hover:border-blue-200"
                                onClick={() => {
                                    updateWordGroup(anecdoteMenu.wordGroupId, { color: getColorForAnecdote(type), anecdoteType: type });
                                    setAnecdoteMenu(null);
                                }}>{label}</button>
                        ))}
                    </div>
                )}
                {editorState.isOpen && (
                    <RichTextEditor initialText={editorState.initialText} initialStyles={editorState.initialStyles}
                        onSave={saveRichText} onCancel={() => setEditorState({ ...editorState, isOpen: false })} position={editorState.position} />
                )}
                <div className="print:block origin-top">
                    {pages.length > 0 && currentPage ? (
                        <div key={currentPage.id} className="bg-white shadow-lg mx-auto mb-8 relative print:w-full print:h-screen print:shadow-none"
                            style={{ ...getPageStyle(), fontSize: theme.fontSize, lineHeight: theme.lineHeight }}>
                            <div className="absolute -top-8 left-0 right-0 text-center text-gray-400 text-xs no-print flex justify-between px-2">
                                <span>Page {(currentPageIndex || 0) + 1} of {pages.length}</span>
                            </div>
                            <div className="space-y-6 relative z-0">
                                {currentPage.lines.map((line, lineIndex) => (
                                    <div key={line.id} className={clsx("grid gap-4 group relative transition-all cursor-pointer", dragOverIndex === lineIndex && "ring-2 ring-blue-400 bg-blue-50", draggedLineIndex === lineIndex && "opacity-50", selectedLineIndex === lineIndex && "ring-2 ring-indigo-400 bg-indigo-50")}
                                        style={{ gridTemplateColumns: getGridTemplate() }} onClick={() => setSelectedLineIndex(lineIndex)} draggable
                                        onDragStart={(e) => { setDraggedLineIndex(lineIndex); e.dataTransfer.setData('text/plain', String(lineIndex)); }}
                                        onDragOver={(e) => { e.preventDefault(); if (draggedLineIndex !== null && draggedLineIndex !== lineIndex) setDragOverIndex(lineIndex); }}
                                        onDrop={(e) => { e.preventDefault(); if (draggedLineIndex !== null && draggedLineIndex !== lineIndex && currentPage) reorderLines(currentPage.id, draggedLineIndex, lineIndex); setDraggedLineIndex(null); setDragOverIndex(null); }}
                                        onDragEnd={() => { setDraggedLineIndex(null); setDragOverIndex(null); }}>
                                        <div className="text-gray-300 font-mono text-sm text-right pr-2 pt-1 select-none flex flex-col items-end gap-1">
                                            <span className="group-hover:hidden">{lineIndex + 1}</span>
                                            <div className="hidden group-hover:flex flex-col gap-1 no-print">
                                                <button className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded" title="Add Anecdote"
                                                    onClick={(e) => { e.stopPropagation(); addSidebarCard({ type: 'grammar', content: 'New Note', anchoredLineId: line.id }); }}>
                                                    <PlusCircle size={14} /></button>
                                                <button className="text-indigo-500 hover:text-indigo-700 p-1 hover:bg-indigo-50 rounded" title="Speak"
                                                    onClick={(e) => { e.stopPropagation(); const u = new SpeechSynthesisUtterance(line.frenchText); u.lang = 'fr-FR'; window.speechSynthesis.speak(u); }}>
                                                    <Volume2 size={14} /></button>
                                                <button className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded relative group/manage" title="Manage">
                                                    <Settings2 size={14} />
                                                    <div className="absolute left-full top-0 ml-2 bg-white shadow-xl border rounded p-2 w-32 hidden group-focus-within/manage:block z-50">
                                                        <button className="w-full text-left text-xs p-1 hover:bg-red-50 text-red-600 rounded flex gap-2 items-center"
                                                            onClick={(e) => { e.stopPropagation(); if (confirm('Delete line?')) removeLine(currentPage.id, line.id); }}>
                                                            <Trash2 size={12} /> Delete</button>
                                                        <div className="border-t my-1 pt-1">
                                                            {(['paragraph', 'title', 'heading', 'note', 'list'] as const).map(type => (
                                                                <button key={type} className={clsx("w-full text-left text-[10px] p-1 rounded hover:bg-gray-50 capitalize", line.sectionType === type && "text-blue-600 font-bold bg-blue-50")}
                                                                    onClick={(e) => { e.stopPropagation(); updateLineProperty(line.id, { sectionType: type }); }}>{type}</button>
                                                            ))}
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
                                                        className="absolute top-0 bottom-0 w-4 -ml-2 cursor-col-resize hover:bg-blue-400/20 z-20 transition-colors flex justify-center"
                                                        style={{ left: `calc(3rem + (100% - 15rem) * ${splitRatio})` }}>
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
                                                const color = getColorForAnecdote(card.type as AnecdoteType);
                                                return (
                                                    <div key={card.id} className="p-2 rounded text-sm mb-2 shadow-sm group/card relative" style={{ backgroundColor: card.color || color || '#fef3c7' }}>
                                                        <div className="absolute -right-2 -top-2 hidden group-hover/card:flex bg-white shadow rounded-full border no-print">
                                                            <button onClick={() => removeSidebarCard(card.id)} className="p-1 hover:bg-red-50 text-red-500"><X size={12} /></button>
                                                        </div>
                                                        <textarea className="w-full bg-transparent border-none resize-none focus:ring-0 text-gray-800 p-0 text-xs"
                                                            value={card.content} onChange={(e) => updateSidebarCard(card.id, { content: e.target.value })} rows={3} />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 italic">No pages to display.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Workspace;
