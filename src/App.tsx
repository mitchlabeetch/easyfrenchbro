import { useState, useRef } from 'react';
import { Workspace } from './components/Workspace';
import { PropertiesPanel } from './components/PropertiesPanel';
import { useStore } from './store';
import { Download, MoveDiagonal, Languages, Highlighter, Check, X, Save, FolderOpen } from 'lucide-react';
import { clsx } from 'clsx';

function App() {
  const {
    parseAndSetText,
    selectionMode,
    selectedColor,
    theme,
    highlightSelection,
    addHighlight,
    clearHighlightSelection,
    setProjectState
  } = useStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputFrench, setInputFrench] = useState("Le chat mange la souris.\nIl fait beau aujourd'hui.");
  const [inputEnglish, setInputEnglish] = useState("The cat eats the mouse.\nIt is nice today.");
  const [showInput, setShowInput] = useState(true);

  const handleParse = () => {
    parseAndSetText(inputFrench, inputEnglish);
    setShowInput(false);
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

  const handleSaveProject = () => {
      const state = useStore.getState();
      const projectData = {
          metadata: state.metadata,
          lines: state.lines,
          highlights: state.highlights,
          arrows: state.arrows,
          sidebars: state.sidebars,
          theme: state.theme
      };

      const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleLoadProject = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const json = JSON.parse(e.target?.result as string);
              // Basic validation could go here
              setProjectState(json);
          } catch (error) {
              console.error("Failed to load project", error);
              alert("Invalid project file");
          }
      };
      reader.readAsText(file);
      // Reset input
      event.target.value = '';
  };

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

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans">
        {/* Left Panel: Input & Controls */}
        <div className="w-80 bg-white border-r flex flex-col shadow-lg z-20 no-print">
            <div className="p-4 border-b bg-gray-50">
                <h1 className="font-bold text-xl flex items-center gap-2">
                    <Languages className="text-blue-600" />
                    Bilingual Layout
                </h1>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-6">

                {/* Project Actions */}
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={handleSaveProject}
                        className="flex items-center justify-center gap-2 p-2 bg-gray-100 rounded hover:bg-gray-200 text-xs font-medium text-gray-700"
                    >
                        <Save size={14} /> Save
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 p-2 bg-gray-100 rounded hover:bg-gray-200 text-xs font-medium text-gray-700"
                    >
                        <FolderOpen size={14} /> Load
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleLoadProject}
                        accept=".json"
                        className="hidden"
                    />
                </div>

                {/* Mode Switcher */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Toolbox</label>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => useStore.setState({ selectionMode: 'none', selectedElementId: null })}
                            className={clsx("p-2 border rounded flex flex-col items-center gap-1 text-xs hover:bg-gray-50", selectionMode === 'none' && "bg-blue-50 border-blue-500 text-blue-700")}
                        >
                            <MoveDiagonal size={16} />
                            <span>Select</span>
                        </button>
                        <button
                            onClick={() => useStore.setState({ selectionMode: 'highlight' })}
                            className={clsx("p-2 border rounded flex flex-col items-center gap-1 text-xs hover:bg-gray-50", selectionMode === 'highlight' && "bg-blue-50 border-blue-500 text-blue-700")}
                        >
                            <Highlighter size={16} />
                            <span>Highlight</span>
                        </button>
                        <button
                            onClick={() => useStore.setState({ selectionMode: 'arrow' })}
                            className={clsx("p-2 border rounded flex flex-col items-center gap-1 text-xs hover:bg-gray-50", selectionMode === 'arrow' && "bg-blue-50 border-blue-500 text-blue-700")}
                        >
                            <MoveDiagonal size={16} className="rotate-90" />
                            <span>Connect</span>
                        </button>
                    </div>
                </div>

                {/* Highlight Confirm/Cancel (Dynamic) */}
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

                {/* Color Picker */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Palette</label>
                    <div className="flex gap-2 flex-wrap">
                        {theme.highlightColors.map(color => (
                            <button
                                key={color}
                                className={clsx("w-8 h-8 rounded-full border-2", selectedColor === color ? "border-blue-500" : "border-transparent")}
                                style={{ backgroundColor: color }}
                                onClick={() => useStore.setState({ selectedColor: color })}
                            />
                        ))}
                         <button
                                className={clsx("w-8 h-8 rounded-full border-2 bg-black", selectedColor === "#000000" ? "border-blue-500" : "border-transparent")}
                                onClick={() => useStore.setState({ selectedColor: "#000000" })}
                            />
                    </div>
                </div>

                {/* Raw Input Toggle */}
                <div className="pt-4 border-t">
                    <button
                        onClick={() => setShowInput(!showInput)}
                        className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium"
                    >
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
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded hover:bg-gray-800"
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
    </div>
  );
}

export default App;
