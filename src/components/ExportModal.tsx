import React, { useState } from 'react';
import { X, Download, FileText, Globe, File, Check } from 'lucide-react';
import { useStore } from '../store';
import { generateInteractiveHTML } from '../utils/htmlExport';
import { clsx } from 'clsx';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExportFormat = 'pdf' | 'html' | 'print';

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { pages, wordGroups, arrows, theme, palettes, metadata } = useStore();
  
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('html');
  const [htmlOptions, setHtmlOptions] = useState({
    hoverReveal: true,
    includeStyles: true,
    includeAnnotations: true,
    theme: 'auto' as 'light' | 'dark' | 'auto'
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const activePalette = palettes.find(p => p.id === theme.activePaletteId) || palettes[0];

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      if (selectedFormat === 'html') {
        const html = generateInteractiveHTML(
          pages,
          wordGroups,
          arrows,
          theme,
          activePalette,
          metadata.title || 'Untitled',
          htmlOptions
        );
        
        // Download the HTML file
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(metadata.title || 'export').replace(/[^a-z0-9]/gi, '_')}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setExported(true);
        setTimeout(() => setExported(false), 2000);
      } else if (selectedFormat === 'print' || selectedFormat === 'pdf') {
        window.print();
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
    
    setIsExporting(false);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Download size={20} /> Export Project
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Format Selection */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-2 block">
            Export Format
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setSelectedFormat('html')}
              className={clsx(
                "p-3 rounded-lg border flex flex-col items-center gap-1 transition-all",
                selectedFormat === 'html'
                  ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600"
              )}
            >
              <Globe size={24} />
              <span className="text-xs font-medium">Interactive HTML</span>
            </button>
            <button
              onClick={() => setSelectedFormat('pdf')}
              className={clsx(
                "p-3 rounded-lg border flex flex-col items-center gap-1 transition-all",
                selectedFormat === 'pdf'
                  ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600"
              )}
            >
              <FileText size={24} />
              <span className="text-xs font-medium">PDF</span>
            </button>
            <button
              onClick={() => setSelectedFormat('print')}
              className={clsx(
                "p-3 rounded-lg border flex flex-col items-center gap-1 transition-all",
                selectedFormat === 'print'
                  ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600"
              )}
            >
              <File size={24} />
              <span className="text-xs font-medium">Print</span>
            </button>
          </div>
        </div>

        {/* HTML-specific Options */}
        {selectedFormat === 'html' && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">HTML Options</h3>
            
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={htmlOptions.hoverReveal}
                onChange={(e) => setHtmlOptions({ ...htmlOptions, hoverReveal: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              Hover to reveal translations
            </label>
            
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={htmlOptions.includeAnnotations}
                onChange={(e) => setHtmlOptions({ ...htmlOptions, includeAnnotations: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              Include word group highlights
            </label>
            
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <span>Theme:</span>
              <select
                value={htmlOptions.theme}
                onChange={(e) => setHtmlOptions({ ...htmlOptions, theme: e.target.value as 'light' | 'dark' | 'auto' })}
                className="bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded px-2 py-1 text-sm"
              >
                <option value="auto">Auto (system)</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {selectedFormat === 'html' && (
              <>📱 Creates a standalone HTML file with interactive features. Works offline, no server needed. Perfect for sharing with students.</>
            )}
            {selectedFormat === 'pdf' && (
              <>📄 Opens print dialog for PDF export. Use your browser's "Save as PDF" option for best results.</>
            )}
            {selectedFormat === 'print' && (
              <>🖨️ Opens print dialog. Make sure to enable "Print backgrounds" for colors and highlights.</>
            )}
          </p>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          className={clsx(
            "w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all",
            exported
              ? "bg-green-500 text-white"
              : isExporting
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
          )}
        >
          {exported ? (
            <>
              <Check size={18} /> Exported!
            </>
          ) : isExporting ? (
            <>Exporting...</>
          ) : (
            <>
              <Download size={18} /> Export {selectedFormat.toUpperCase()}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ExportModal;
