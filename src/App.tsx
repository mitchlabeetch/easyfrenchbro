import { useState, useRef, useEffect } from 'react';
import { Workspace } from './components/Workspace';
import { PropertiesPanel } from './components/PropertiesPanel';
import { Dashboard } from './components/Dashboard';
import { useStore } from './store';
import { WordGroupType } from './types';
import { 
  Download, 
  MoveDiagonal, 
  Languages, 
  Highlighter, 
  Check, 
  X, 
  FileSpreadsheet, 
  Printer, 
  RefreshCw,
  Link2,
  Group,
  FolderOpen,
  ArrowLeft,
  Settings,
  FilePlus,
  ChevronLeft,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { clsx } from 'clsx';
import { LinkingModal } from './components/LinkingModal';

// Word type configuration with colors and labels
const WORD_TYPES: { type: WordGroupType; label: string; shortLabel: string }[] = [
  { type: 'subject', label: 'Subject', shortLabel: 'S' },
  { type: 'verb', label: 'Verb', shortLabel: 'V' },
  { type: 'complement', label: 'Complement', shortLabel: 'C' },
  { type: 'article', label: 'Article', shortLabel: 'A' },
  { type: 'adjective', label: 'Adjective', shortLabel: 'Adj' },
  { type: 'adverb', label: 'Adverb', shortLabel: 'Adv' },
];

function App() {
  const {
    parseAndSetText,
    importFromCSV,
    reflowPages,
    selectionMode,
    selectedColor,
    selectedWordType,
    theme,
    palettes,
    highlightSelection,
    wordGroupSelection,
    arrowCreation,
    addHighlight,
    clearHighlightSelection,
    confirmWordGroupSelection,
    clearWordGroupSelection,
    cancelArrowCreation,
    getColorForType,
    loadProject,
    saveProject,
    fetchPalettes
  } = useStore();

  const csvInputRef = useRef<HTMLInputElement>(null);

  const [view, setView] = useState<'dashboard' | 'workspace'>('dashboard');
  const [currentProjectName, setCurrentProjectName] = useState<string | null>(null);

  const [inputFrench, setInputFrench] = useState("Le chat mange la souris.\nIl fait beau aujourd'hui.");
  const [inputEnglish, setInputEnglish] = useState("The cat eats the mouse.\nIt is nice today.");
  const [showInput, setShowInput] = useState(false);
  const [linesPerPage, setLinesPerPage] = useState(25);
  const [showLinkingModal, setShowLinkingModal] = useState(false);

  useEffect(() => {
    fetchPalettes();
  }, []);

  // Get active palette
  const activePalette = palettes.find(p => p.id === theme.activePaletteId) || palettes[0];

  const handleOpenProject = async (name: string) => {
    try {
        await loadProject(name);
        setCurrentProjectName(name);
        setView('workspace');
    } catch (e) {
        console.error("Failed to load", e);
        alert("Failed to load project");
    }
  };

  const handleCreateProject = async (name: string) => {
     // Initialize empty project
     // For now just set state and save blank
     useStore.getState().setProjectState({
         metadata: { title: name, author: '', difficultyLevel: 'Intermediate', year: new Date().getFullYear() },
         pages: [{ id: 'page-1', lines: [] }],
         highlights: [],
         wordGroups: [],
         arrows: [],
         sidebars: [],
         linkedPairs: [],
         templates: [],
         palettes: [palettes[0]], // preserve defaults
         theme: theme
     });
     
     try {
         await saveProject(name);
         setCurrentProjectName(name);
         setView('workspace');
     } catch(e) {
         console.error("Failed to create", e);
         alert("Failed to create project");
     }
  };

  const handleParse = () => {
    parseAndSetText(inputFrench, inputEnglish);
    setShowInput(false);
  };

  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      importFromCSV(csv);
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleReflow = () => {
    reflowPages(linesPerPage);
  };

  const handleNativePrint = () => {
    window.print();
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: window.location.href,
          options: { format: 'A4' }
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "layout-export.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (e) {
      console.error("Export failed", e);
      alert("Export failed. Make sure the server is running (npm run server).");
    }
  };

  // Legacy highlight confirm
  const confirmHighlight = () => {
    if (highlightSelection.frenchIds.length === 0 && highlightSelection.englishIds.length === 0) return;

    addHighlight({
      colorCode: selectedColor,
      frenchWordIds: highlightSelection.frenchIds,
      englishWordIds: highlightSelection.englishIds,
      associatedLineId: highlightSelection.lineId!
    });
    clearHighlightSelection();
    useStore.setState({ selectionMode: 'none' });
  };

  // Handle word type quick select
  const handleWordTypeSelect = (type: WordGroupType) => {
    const color = getColorForType(type);
    useStore.setState({ 
      selectedWordType: type,
      selectedColor: color,
      selectionMode: 'wordGroup'
    });
  };

  if (view === 'dashboard') {
      return (
          <Dashboard 
             onOpenProject={handleOpenProject}
             onCreateProject={handleCreateProject}
          />
      );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans">
      {/* Left Panel: Input & Controls */}
      <div className="w-80 bg-white border-r flex flex-col shadow-lg z-20 no-print">
        <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex items-center gap-2 mb-2">
             <button onClick={() => setView('dashboard')} className="text-white hover:bg-white/20 p-1 rounded">
                <ArrowLeft size={20} />
             </button>
             <h1 className="font-bold text-xl flex items-center gap-2 text-white">
                <Languages />
                EasyFrench Pro
             </h1>
          </div>
          <p className="text-blue-100 text-xs ml-9">{currentProjectName || 'Untitled Project'}</p>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-6">

          {/* Data Toolbar */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Data & Structure</label>

            <button
              onClick={() => csvInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 p-2 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 text-xs font-medium"
            >
              <FileSpreadsheet size={14} /> Import CSV
            </button>
            <input
              type="file"
              ref={csvInputRef}
              onChange={handleCSVImport}
              accept=".csv"
              className="hidden"
            />

            <div className="flex gap-2 items-center">
               <button
                  onClick={() => useStore.getState().addPage()}
                  className="flex-1 flex items-center justify-center gap-2 p-2 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 text-xs font-medium"
               >
                  <FilePlus size={14} /> Add Page
               </button>
                <button
                  onClick={() => {
                        const s = useStore.getState();
                        if (s.pages.length > 0 && s.currentPageIndex !== undefined) {
                            s.removePage(s.pages[s.currentPageIndex].id);
                            // Adjust index safely
                            const newPages = useStore.getState().pages;
                            if (s.currentPageIndex >= newPages.length) {
                                s.setCurrentPageIndex(Math.max(0, newPages.length - 1));
                            }
                        }
                  }}
                  className="flex-none p-2 bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 text-xs"
                  title="Remove Current Page"
               >
                  <Trash2 size={14} />
               </button>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between bg-gray-50 border rounded p-1">
                <button 
                    disabled={(useStore.getState().currentPageIndex || 0) <= 0}
                    onClick={() => useStore.getState().setCurrentPageIndex((useStore.getState().currentPageIndex || 0) - 1)}
                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                >
                    <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-mono">
                    Page {(useStore.getState().currentPageIndex || 0) + 1} / {useStore.getState().pages.length}
                </span>
                <button 
                    disabled={(useStore.getState().currentPageIndex || 0) >= useStore.getState().pages.length - 1}
                    onClick={() => useStore.getState().setCurrentPageIndex((useStore.getState().currentPageIndex || 0) + 1)}
                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
            
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={linesPerPage}
                onChange={(e) => setLinesPerPage(Number(e.target.value))}
                className="w-16 p-1 text-xs border rounded"
                title="Lines per page"
              />
              <button
                onClick={handleReflow}
                className="flex-1 flex items-center justify-center gap-2 p-2 bg-gray-100 rounded hover:bg-gray-200 text-xs font-medium text-gray-700"
              >
                <RefreshCw size={14} /> Reflow
              </button>
            </div>
            
            <button
                // Simple save trigger
                onClick={() => currentProjectName && saveProject(currentProjectName)}
                className="w-full flex items-center justify-center gap-2 p-2 bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 text-xs font-medium"
            >
                <FolderOpen size={14} /> Save Project
            </button>

            <button
              onClick={handleNativePrint}
              className="w-full flex items-center justify-center gap-2 p-2 bg-gray-800 text-white rounded hover:bg-gray-700 text-xs font-medium"
            >
              <Printer size={14} /> Print / PDF
            </button>
          </div>

          <div className="border-t my-2"></div>

          {/* Mode Switcher - Updated with Word Group mode */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Toolbox</label>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => useStore.setState({ selectionMode: 'none', selectedElementId: null })}
                className={clsx("p-2 border rounded flex flex-col items-center gap-1 text-xs hover:bg-gray-50", selectionMode === 'none' && "bg-blue-50 border-blue-500 text-blue-700")}
                title="Select & Edit"
              >
                <MoveDiagonal size={16} />
                <span>Select</span>
              </button>
              <button
                onClick={() => useStore.setState({ selectionMode: 'wordGroup' })}
                className={clsx("p-2 border rounded flex flex-col items-center gap-1 text-xs hover:bg-gray-50", selectionMode === 'wordGroup' && "bg-blue-50 border-blue-500 text-blue-700")}
                title="Create Word Groups (Shift+Click to select range)"
              >
                <Group size={16} />
                <span>Group</span>
              </button>
              <button
                onClick={() => useStore.setState({ selectionMode: 'arrow' })}
                className={clsx("p-2 border rounded flex flex-col items-center gap-1 text-xs hover:bg-gray-50", selectionMode === 'arrow' && "bg-blue-50 border-blue-500 text-blue-700")}
                title="Connect Groups with Arrows"
              >
                <Link2 size={16} />
                <span>Arrow</span>
              </button>
              <button
                onClick={() => useStore.setState({ selectionMode: 'highlight' })}
                className={clsx("p-2 border rounded flex flex-col items-center gap-1 text-xs hover:bg-gray-50", selectionMode === 'highlight' && "bg-blue-50 border-blue-500 text-blue-700")}
                title="Legacy Highlight Mode"
              >
                <Highlighter size={16} />
                <span>Highlight</span>
              </button>
            </div>
          </div>

          {/* Word Type Quick Select (shown in wordGroup mode) */}
          {selectionMode === 'wordGroup' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Word Type</label>
              <div className="grid grid-cols-2 gap-2"> 
                {WORD_TYPES.map(({ type, label }) => {
                  const paletteColors = activePalette?.colors;
                  const color = paletteColors && type !== 'custom' ? paletteColors[type] : '#888888';
                  const isActive = selectedWordType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => handleWordTypeSelect(type)}
                      className={clsx(
                        "p-2 border rounded text-xs font-medium transition-all text-left flex items-center gap-2",
                        isActive && "ring-2 ring-blue-500"
                      )}
                      style={{ 
                        backgroundColor: isActive ? color : `${color}20`,
                        borderColor: color,
                        color: typeof color === 'string' ? color : undefined
                      }}
                      title={label}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      {label}
                    </button>
                  );
                })}
              </div>
              
              {/* Instructions */}
              <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                <p className="text-blue-800 mb-1">
                  <strong>Click</strong> first word, <strong>Shift+Click</strong> last word, then <strong>Double-click</strong> to confirm.
                </p>
              </div>

              {/* Selection status */}
              {wordGroupSelection.wordIds.length > 0 && (
                <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                  <p className="text-green-800 mb-2">
                    {wordGroupSelection.wordIds.length} word(s) selected
                  </p>
                  <div className="flex gap-2">
                    <button 
                      onClick={confirmWordGroupSelection} 
                      className="flex-1 bg-green-500 text-white py-1 rounded flex items-center justify-center gap-1 text-xs"
                    >
                      <Check size={14} /> Create Group
                    </button>
                    <button 
                      onClick={clearWordGroupSelection} 
                      className="flex-1 bg-gray-200 text-gray-700 py-1 rounded flex items-center justify-center gap-1 text-xs"
                    >
                      <X size={14} /> Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Arrow Creation Status */}
          {selectionMode === 'arrow' && (
            <div className="space-y-2">
              <div className="p-2 bg-purple-50 border border-purple-200 rounded text-xs">
                {!arrowCreation.isSelectingTarget ? (
                  <p className="text-purple-800">
                    Click on a <strong>word group</strong> to start an arrow.
                  </p>
                ) : (
                  <div>
                    <p className="text-purple-800 mb-2">
                      Source selected! Now click a <strong>target group</strong>.
                    </p>
                    <button 
                      onClick={cancelArrowCreation} 
                      className="w-full bg-gray-200 text-gray-700 py-1 rounded flex items-center justify-center gap-1"
                    >
                      <X size={14} /> Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Legacy Highlight Confirm/Cancel */}
          {selectionMode === 'highlight' && (
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
              <p className="mb-2 text-yellow-800">Select words in both columns, then confirm.</p>
              <div className="flex gap-2">
                <button onClick={confirmHighlight} className="flex-1 bg-green-500 text-white py-1 rounded flex items-center justify-center gap-1">
                  <Check size={14} /> Apply
                </button>
                <button onClick={clearHighlightSelection} className="flex-1 bg-gray-200 text-gray-700 py-1 rounded flex items-center justify-center gap-1">
                  <X size={14} /> Clear
                </button>
              </div>
            </div>
          )}

          {/* Current Palette Display */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
                 <label className="text-xs font-bold text-gray-500 uppercase">Palette: {activePalette?.name}</label>
                 {/* Visual indicator pointing to right panel */}
                 <span className="text-[10px] text-blue-500 cursor-help" title="Manage Palettes in Right Panel">Manage →</span>
            </div>
            
            <div className="grid grid-cols-6 gap-1 bg-gray-50 p-2 rounded border">
              {/* Main Roles */}
              {Object.entries(activePalette?.colors || {}).map(([key, color]) => {
                  if (key === 'custom' || typeof color !== 'string') return null;
                  return (
                    <div 
                        key={key} 
                        className="w-full aspect-square rounded border" 
                        style={{ backgroundColor: color }}
                        title={`Role: ${key}`} 
                    />
                  );
              })}
              {/* Custom Colors */}
              {activePalette?.colors.custom.map((color, idx) => (
                 <div 
                    key={`cust-${idx}`} 
                    className="w-full aspect-square rounded-full border" 
                    style={{ backgroundColor: color }}
                    title={`Custom ${idx+1}`} 
                 />
              ))}
              {/* Linking Button */}
              <button
                onClick={() => setShowLinkingModal(true)}
                className="p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 text-left transition-colors"
                title="Manage Text Linking"
              >
                 <div className="flex items-center gap-2 mb-1 text-indigo-700">
                   <Link2 size={16} />
                   <span className="font-bold text-sm">Link Text</span>
                 </div>
                 <div className="text-[10px] text-gray-500 leading-tight">
                   Sync styles
                 </div>
              </button>
            </div>
          </div>

          {/* Raw Input Toggle */}
          <div className="pt-4 border-t">
            <button
              onClick={() => setShowInput(!showInput)}
              className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium"
            >
              <Settings size={14} className="inline mr-2" />
              {showInput ? "Hide Raw Inputs" : "Edit Raw Text"}
            </button>
          </div>

          {showInput && (
            <div className="space-y-4 animate-in slide-in-from-left duration-300">
              <div>
                <label className="block text-xs font-medium mb-1">French Text</label>
                <textarea
                  className="w-full h-32 p-2 border rounded text-sm font-serif"
                  value={inputFrench}
                  onChange={e => setInputFrench(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">English Text</label>
                <textarea
                  className="w-full h-32 p-2 border rounded text-sm font-sans"
                  value={inputEnglish}
                  onChange={e => setInputEnglish(e.target.value)}
                />
              </div>
              <button
                onClick={handleParse}
                className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
              >
                Parse & Update Workspace
              </button>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded hover:from-gray-700 hover:to-gray-800"
          >
            <Download size={18} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Center: Workspace */}
      <Workspace />

      {/* Right: Properties */}
      <div className="no-print">
        <PropertiesPanel />
      </div>

      {showLinkingModal && (
        <LinkingModal 
          isOpen={showLinkingModal} 
          onClose={() => setShowLinkingModal(false)} 
        />
      )}
    </div>
  );
}

export default App;
