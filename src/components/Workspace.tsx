import React from 'react';
import { useStore } from '../store';
import { TextRenderer } from './TextRenderer';
import { ArrowLayer } from './ArrowLayer';
import { Xwrapper } from 'react-xarrows';
import { PlusCircle } from 'lucide-react';

export const Workspace: React.FC = () => {
  const { pages, sidebars, theme, setSelectedElement, selectionMode } = useStore();

  const handleBackgroundClick = () => {
      if (selectionMode === 'none') {
          setSelectedElement(null, null);
      }
  };

  return (
    <div
        className="flex-1 overflow-auto bg-gray-50 p-8 relative print:p-0 print:overflow-visible print:bg-white"
        id="workspace-container"
        onClick={handleBackgroundClick}
    >
        <Xwrapper>
            {/* Arrows usually need to be relative to a container, but here they might span pages.
                Positioning might be tricky if not everything is in one flow.
                For now, we wrap everything in Xwrapper. ArrowLayer needs to be absolute over the whole document.
                Since pages are block elements, we might need a global overlay for arrows.
            */}

             {/* This overlay approach for arrows might need adjustment if pages have margins.
                 But let's keep it simple: we render ArrowLayer inside Xwrapper.
                 The ArrowLayer needs to be able to find elements across the entire scrollable area.
             */}

            <ArrowLayer />

            <div className="print:block">
                {pages.map((page) => (
                    <div
                        key={page.id}
                        className="w-[210mm] min-h-[297mm] bg-white shadow-lg mx-auto mb-8 p-[15mm] relative print:w-full print:h-screen print:shadow-none print:m-0 print:break-after-page print:p-[15mm]"
                        style={{ fontSize: theme.fontSize, lineHeight: theme.lineHeight }}
                    >
                        <div className="space-y-6 relative z-0">
                            {page.lines.map((line) => (
                                <div key={line.id} className="grid grid-cols-[3rem_1fr_1fr_12rem] gap-4 group relative">
                                    {/* Line Number / Action */}
                                    <div className="text-gray-300 font-mono text-sm text-right pr-2 pt-1 select-none">
                                        <span className="group-hover:hidden">{line.lineNumber}</span>
                                        <button
                                            className="hidden group-hover:inline-block text-blue-500 hover:text-blue-700 no-print"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                useStore.getState().addSidebarCard({
                                                    type: 'grammar',
                                                    content: 'New Note',
                                                    anchoredLineId: line.id
                                                });
                                            }}
                                        >
                                            <PlusCircle size={16} />
                                        </button>
                                    </div>

                                    {/* French Column */}
                                    <div className="relative">
                                    <TextRenderer text={line.frenchText} language="french" lineId={line.id} />
                                    </div>

                                    {/* English Column */}
                                    <div className="relative border-l border-gray-100 pl-4">
                                        <TextRenderer text={line.englishText} language="english" lineId={line.id} />
                                    </div>

                                    {/* Sidebar Column (Annotations) */}
                                    <div className="relative">
                                        {sidebars.filter(s => s.anchoredLineId === line.id).map(card => (
                                            <div key={card.id} className="bg-yellow-50 border border-yellow-200 p-2 rounded text-sm mb-2 shadow-sm">
                                                <div className="font-bold text-xs text-yellow-800 uppercase mb-1">{card.type}</div>
                                                <textarea
                                                    className="w-full bg-transparent border-none resize-none focus:ring-0 text-gray-700"
                                                    value={card.content}
                                                    onChange={(e) => {
                                                        useStore.getState().updateSidebarCard(card.id, { content: e.target.value });
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </Xwrapper>
    </div>
  );
};
