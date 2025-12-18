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
  Trash2,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Moon,
  Sun,
  Keyboard,
  Undo2,
  Redo2
} from 'lucide-react';
import { clsx } from 'clsx';
import { LinkingModal } from './components/LinkingModal';
import { SearchBar } from './components/SearchBar';
import { ExportModal } from './components/ExportModal';

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
    fetchPalettes,
    uiSettings,
    toggleFrench,
    toggleEnglish,
    toggleFocusMode,
    toggleDarkMode,
    currentPageIndex,
    setCurrentPageIndex,
    pages,
    undo,
    redo,
    saveToHistory,
    canUndo,
    canRedo
  } = useStore();

  const csvInputRef = useRef<HTMLInputElement>(null);

  const [view, setView] = useState<'dashboard' | 'workspace'>('dashboard');
  const [currentProjectName, setCurrentProjectName] = useState<string | null>(null);

  const [inputFrench, setInputFrench] = useState("Le chat mange la souris.\nIl fait beau aujourd'hui.");
  const [inputEnglish, setInputEnglish] = useState("The cat eats the mouse.\nIt is nice today.");
  const [showInput, setShowInput] = useState(false);
  const [linesPerPage, setLinesPerPage] = useState(25);
  const [showLinkingModal, setShowLinkingModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Sync dark mode with body class
  useEffect(() => {
    if (uiSettings.darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [uiSettings.darkMode]);

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
         theme: theme,
         uiSettings: { showFrench: true, showEnglish: true, focusMode: false, darkMode: false }
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

  // State for shortcuts panel visibility
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Comprehensive Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey; // Support Mac Cmd key

      // Ctrl+S: Save project
      if (ctrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (currentProjectName) {
          saveProject(currentProjectName);
        }
        return;
      }

      // Ctrl+Z: Undo
      if (ctrl && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
        return;
      }

      // Ctrl+Y or Ctrl+Shift+Z: Redo
      if (ctrl && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (canRedo) redo();
        return;
      }

      // Ctrl+G: Enter word group mode
      if (ctrl && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        useStore.setState({ selectionMode: 'wordGroup' });
        return;
      }

      // Ctrl+Shift+A: Enter arrow mode (Ctrl+A is reserved for select-all)
      if (ctrl && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        useStore.setState({ selectionMode: 'arrow' });
        return;
      }

      // Ctrl+1 through Ctrl+6: Quick word type selection
      if (ctrl && e.key >= '1' && e.key <= '6') {
        e.preventDefault();
        const typeIndex = parseInt(e.key) - 1;
        const types: WordGroupType[] = ['subject', 'verb', 'complement', 'article', 'adjective', 'adverb'];
        if (typeIndex < types.length) {
          const type = types[typeIndex];
          handleWordTypeSelect(type);
          useStore.setState({ selectionMode: 'wordGroup' });
        }
        return;
      }

      // Escape: Cancel current selection mode or exit focus mode
      if (e.key === 'Escape') {
        if (uiSettings.focusMode) {
          toggleFocusMode();
        } else if (selectionMode !== 'none') {
          useStore.setState({ selectionMode: 'none' });
          clearWordGroupSelection();
          cancelArrowCreation();
        }
        return;
      }

      // Ctrl+F: Open search
      if (ctrl && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowSearch(true);
        return;
      }

      // F (without Ctrl): Toggle focus mode
      if (e.key.toLowerCase() === 'f' && !ctrl) {
        toggleFocusMode();
        return;
      }

      // [ and ]: Page navigation
      if (e.key === '[') {
        const prev = Math.max(0, (currentPageIndex || 0) - 1);
        setCurrentPageIndex(prev);
        return;
      }
      if (e.key === ']') {
        const next = Math.min(pages.length - 1, (currentPageIndex || 0) + 1);
        setCurrentPageIndex(next);
        return;
      }

      // ?: Toggle shortcuts help
      if (e.key === '?') {
        setShowShortcuts(prev => !prev);
        return;
      }

      // Enter: Confirm word group selection if any
      if (e.key === 'Enter' && wordGroupSelection.wordIds.length > 0) {
        confirmWordGroupSelection();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [uiSettings.focusMode, toggleFocusMode, currentProjectName, selectionMode, wordGroupSelection.wordIds.length]);

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
    <div className="flex h-screen w-screen overflow-hidden font-sans bg-gray-100">
      {/* Left Panel: Input & Controls */}
      {!uiSettings.focusMode && (
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
                // Simple save trigger - also save history
                onClick={() => {
                  if (currentProjectName) {
                    saveToHistory(); // Save state before any changes
                    saveProject(currentProjectName);
                  }
                }}
                className="w-full flex items-center justify-center gap-2 p-2 bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 text-xs font-medium"
            >
                <FolderOpen size={14} /> Save Project
            </button>

            {/* Undo/Redo Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => canUndo && undo()}
                disabled={!canUndo}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-1 p-2 rounded text-xs font-medium transition-colors",
                  canUndo 
                    ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100" 
                    : "bg-gray-50 text-gray-300 border border-gray-200 cursor-not-allowed"
                )}
                title="Undo (Ctrl+Z)"
              >
                <Undo2 size={14} /> Undo
              </button>
              <button
                onClick={() => canRedo && redo()}
                disabled={!canRedo}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-1 p-2 rounded text-xs font-medium transition-colors",
                  canRedo 
                    ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100" 
                    : "bg-gray-50 text-gray-300 border border-gray-200 cursor-not-allowed"
                )}
                title="Redo (Ctrl+Y)"
              >
                <Redo2 size={14} /> Redo
              </button>
            </div>

            <button
              onClick={() => setShowExportModal(true)}
              className="w-full flex items-center justify-center gap-2 p-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded hover:from-blue-700 hover:to-purple-700 text-xs font-medium"
            >
              <Download size={14} /> Export
            </button>

            <button
              onClick={handleNativePrint}
              className="w-full flex items-center justify-center gap-2 p-2 bg-gray-800 text-white rounded hover:bg-gray-700 text-xs font-medium"
            >
              <Printer size={14} /> Quick Print
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
              <button
                onClick={() => setShowLinkingModal(true)}
                className="p-2 border rounded flex flex-col items-center gap-1 text-xs hover:bg-gray-50 bg-green-50 border-green-200 text-green-700"
                title="Link French/English words for synchronized styling"
              >
                <Languages size={16} />
                <span>Link Words</span>
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
                  
                  // Calculate contrasting text color for better readability
                  const getContrastColor = (hexColor: string) => {
                    if (typeof hexColor !== 'string') return '#000000';
                    const hex = hexColor.replace('#', '');
                    const r = parseInt(hex.substr(0, 2), 16);
                    const g = parseInt(hex.substr(2, 2), 16);
                    const b = parseInt(hex.substr(4, 2), 16);
                    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                    return luminance > 0.5 ? '#000000' : '#ffffff';
                  };
                  
                  return (
                    <button
                      key={type}
                      onClick={() => handleWordTypeSelect(type)}
                      className={clsx(
                        "p-2 border rounded text-xs font-medium transition-all text-left flex items-center gap-2",
                        isActive && "ring-2 ring-offset-1 ring-blue-500 shadow-md"
                      )}
                      style={{ 
                        backgroundColor: isActive ? color : `${color}20`,
                        borderColor: color,
                        color: isActive ? getContrastColor(color as string) : (typeof color === 'string' ? color : undefined)
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

            {/* Palette display */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                   <label className="text-xs font-bold text-gray-500 uppercase">Palette: {activePalette?.name}</label>
                   <button 
                     onClick={() => {
                       // Scroll to right panel and highlight palette tab
                       const paletteTab = document.querySelector('[data-tab="palette"]');
                       if (paletteTab) {
                         (paletteTab as HTMLButtonElement).click();
                       }
                       // Alternatively, scroll the properties panel into view
                       const rightPanel = document.querySelector('.no-print:last-child');
                       if (rightPanel) {
                         rightPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                       }
                     }}
                     className="text-[10px] text-blue-500 hover:text-blue-700 hover:underline cursor-pointer transition-colors"
                   >
                     Manage →
                   </button>
              </div>
              <div className="grid grid-cols-6 gap-1 bg-gray-50 p-2 rounded border">
                {Object.entries(activePalette?.colors || {}).map(([key, color]) => {
                    if (key === 'custom' || typeof color !== 'string') return null;
                    return <div key={key} className="w-full aspect-square rounded border" style={{ backgroundColor: color }} title={`Role: ${key}`} />;
                })}
                {activePalette?.colors.custom.map((color, idx) => (
                   <div key={`cust-${idx}`} className="w-full aspect-square rounded-full border" style={{ backgroundColor: color }} title={`Custom ${idx+1}`} />
                ))}
              </div>
            </div>

            <div className="border-t my-2"></div>

            {/* View Settings (NEW) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">View & Learning</label>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={toggleFrench}
                    className={clsx(
                      "flex-1 flex items-center justify-center gap-2 p-2 rounded border text-xs font-medium transition-colors",
                      uiSettings.showFrench ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-gray-50 border-gray-200 text-gray-400"
                    )}
                  >
                    {uiSettings.showFrench ? <Eye size={14} /> : <EyeOff size={14} />} French
                  </button>
                  <button
                    onClick={toggleEnglish}
                    className={clsx(
                      "flex-1 flex items-center justify-center gap-2 p-2 rounded border text-xs font-medium transition-colors",
                      uiSettings.showEnglish ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-gray-50 border-gray-200 text-gray-400"
                    )}
                  >
                    {uiSettings.showEnglish ? <Eye size={14} /> : <EyeOff size={14} />} English
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={toggleFocusMode}
                    className="flex-1 flex items-center justify-center gap-2 p-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded hover:bg-indigo-100 text-xs font-medium"
                  >
                    <Maximize2 size={14} /> Focus
                  </button>
                  <button
                    onClick={toggleDarkMode}
                    className={clsx(
                      "flex-1 flex items-center justify-center gap-2 p-2 rounded border text-xs font-medium transition-colors",
                      uiSettings.darkMode ? "bg-gray-700 border-gray-600 text-yellow-400" : "bg-gray-50 border-gray-200 text-gray-600"
                    )}
                  >
                    {uiSettings.darkMode ? <Sun size={14} /> : <Moon size={14} />}
                    {uiSettings.darkMode ? 'Light' : 'Dark'}
                  </button>
                </div>
                <button
                  onClick={() => setShowShortcuts(true)}
                  className="w-full flex items-center justify-center gap-2 p-2 bg-gray-50 text-gray-600 border border-gray-200 rounded hover:bg-gray-100 text-xs font-medium"
                >
                  <Keyboard size={14} /> Shortcuts (?)
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

        </div>
      )}

      {/* Center: Workspace */}
      <div className="flex-1 relative flex flex-col overflow-hidden">
        {uiSettings.focusMode && (
          <button 
            onClick={toggleFocusMode}
            className="absolute top-4 left-4 z-[100] p-2 bg-white/80 backdrop-blur shadow rounded-full hover:bg-white text-indigo-600 border border-indigo-100 no-print"
            title="Exit Focus Mode"
          >
            <Minimize2 size={24} />
          </button>
        )}
        <Workspace />
      </div>

      {/* Right: Properties */}
      {!uiSettings.focusMode && (
        <div className="no-print">
          <PropertiesPanel />
        </div>
      )}

      {showLinkingModal && (
        <LinkingModal 
          isOpen={showLinkingModal} 
          onClose={() => setShowLinkingModal(false)} 
        />
      )}

      {/* Search Bar */}
      <SearchBar 
        isOpen={showSearch} 
        onClose={() => setShowSearch(false)} 
      />

      {/* Export Modal */}
      <ExportModal 
        isOpen={showExportModal} 
        onClose={() => setShowExportModal(false)} 
      />

      {/* Keyboard Shortcuts Help Panel */}
      {showShortcuts && (
        <div 
          className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center"
          onClick={() => setShowShortcuts(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">⌨️ Keyboard Shortcuts</h2>
              <button 
                onClick={() => setShowShortcuts(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Word Types</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between"><span>⌘/Ctrl + 1</span><span className="text-gray-500">Subject</span></div>
                  <div className="flex justify-between"><span>⌘/Ctrl + 2</span><span className="text-gray-500">Verb</span></div>
                  <div className="flex justify-between"><span>⌘/Ctrl + 3</span><span className="text-gray-500">Complement</span></div>
                  <div className="flex justify-between"><span>⌘/Ctrl + 4</span><span className="text-gray-500">Article</span></div>
                  <div className="flex justify-between"><span>⌘/Ctrl + 5</span><span className="text-gray-500">Adjective</span></div>
                  <div className="flex justify-between"><span>⌘/Ctrl + 6</span><span className="text-gray-500">Adverb</span></div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Actions</h3>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between"><span>⌘/Ctrl + S</span><span className="text-gray-500">Save Project</span></div>
                  <div className="flex justify-between"><span>⌘/Ctrl + Z</span><span className="text-gray-500">Undo</span></div>
                  <div className="flex justify-between"><span>⌘/Ctrl + Y</span><span className="text-gray-500">Redo</span></div>
                  <div className="flex justify-between"><span>⌘/Ctrl + G</span><span className="text-gray-500">Group Mode</span></div>
                  <div className="flex justify-between"><span>⌘/Ctrl + ⇧ + A</span><span className="text-gray-500">Arrow Mode</span></div>
                  <div className="flex justify-between"><span>Enter</span><span className="text-gray-500">Confirm Selection</span></div>
                  <div className="flex justify-between"><span>Escape</span><span className="text-gray-500">Cancel / Exit Focus</span></div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Navigation</h3>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between"><span>⌘/Ctrl + F</span><span className="text-gray-500">Find & Replace</span></div>
                  <div className="flex justify-between"><span>F</span><span className="text-gray-500">Focus Mode</span></div>
                  <div className="flex justify-between"><span>[ / ]</span><span className="text-gray-500">Previous / Next Page</span></div>
                  <div className="flex justify-between"><span>?</span><span className="text-gray-500">Toggle This Help</span></div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t text-center text-xs text-gray-400">
              Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-600">?</kbd> anytime to toggle this panel
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
