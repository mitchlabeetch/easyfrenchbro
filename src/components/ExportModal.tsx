import React, { useState, useCallback } from 'react';
import { X, Download, FileText, Globe, File, Check, Image, Archive, Loader2 } from 'lucide-react';
import { useStore } from '../store';
import { generateInteractiveHTML } from '../utils/htmlExport';
import { exportSinglePageAsPng, exportMultiplePagesAsZip, PngExportOptions } from '../utils/pngExport';
import { clsx } from 'clsx';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExportFormat = 'pdf' | 'html' | 'print' | 'json' | 'png' | 'png-zip';

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { pages, wordGroups, arrows, theme, palettes, metadata, sidebars, linkedPairs, templates, uiSettings } = useStore();
  
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('html');
  const [htmlOptions, setHtmlOptions] = useState({
    hoverReveal: true,
    includeStyles: true,
    includeAnnotations: true,
    theme: 'auto' as 'light' | 'dark' | 'auto'
  });
  const [pngOptions, setPngOptions] = useState<PngExportOptions>({
    transparentBackground: false,
    scale: 2,
    includeUIElements: false,
    backgroundColor: theme.pageBackground || '#ffffff',
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null);

  const activePalette = palettes.find(p => p.id === theme.activePaletteId) || palettes[0];

  // Find page elements in the DOM
  const getPageElements = useCallback((): HTMLElement[] => {
    const workspace = document.querySelector('.workspace-inner');
    if (!workspace) return [];
    
    // Find all page containers (the white page divs)
    const pageContainers = workspace.querySelectorAll('.bg-white.shadow-lg');
    return Array.from(pageContainers) as HTMLElement[];
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(null);
    
    try {
      if (selectedFormat === 'html') {
        const html = generateInteractiveHTML(
          pages,
          wordGroups,
          arrows,
          useStore.getState().sidebars,
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
      } else if (selectedFormat === 'json') {
        const projectData = {
           metadata, pages, highlights: [], wordGroups, arrows, sidebars, theme, palettes, linkedPairs, templates, uiSettings
        };
        const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(metadata.title || 'project').replace(/[^a-z0-9]/gi, '_')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setExported(true);
        setTimeout(() => setExported(false), 2000);
      } else if (selectedFormat === 'print' || selectedFormat === 'pdf') {
        window.print();
      } else if (selectedFormat === 'png') {
        // Export current page as PNG
        const pageElements = getPageElements();
        const currentPageIndex = useStore.getState().currentPageIndex || 0;
        
        if (pageElements.length > 0 && pageElements[currentPageIndex]) {
          const filename = `${(metadata.title || 'page').replace(/[^a-z0-9]/gi, '_')}_page_${currentPageIndex + 1}.png`;
          await exportSinglePageAsPng(pageElements[currentPageIndex], filename, pngOptions);
          
          setExported(true);
          setTimeout(() => setExported(false), 2000);
        } else {
          throw new Error('No page found to export');
        }
      } else if (selectedFormat === 'png-zip') {
        // Export all pages as ZIP of PNGs
        const pageElements = getPageElements();
        
        if (pageElements.length > 0) {
          const zipFilename = `${(metadata.title || 'pages').replace(/[^a-z0-9]/gi, '_')}_all_pages.zip`;
          const basePageName = (metadata.title || 'page').replace(/[^a-z0-9]/gi, '_');
          
          await exportMultiplePagesAsZip(
            pageElements,
            zipFilename,
            basePageName,
            pngOptions,
            (current, total) => setExportProgress({ current, total })
          );
          
          setExported(true);
          setTimeout(() => setExported(false), 2000);
        } else {
          throw new Error('No pages found to export');
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
    
    setIsExporting(false);
    setExportProgress(null);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
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

        {/* Format Selection - Redesigned Grid */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-2 block">
            Export Format
          </label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            <button
              onClick={() => setSelectedFormat('html')}
              className={clsx(
                "p-3 rounded-lg border flex flex-col items-center gap-1 transition-all",
                selectedFormat === 'html'
                  ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600"
              )}
            >
              <Globe size={22} />
              <span className="text-[10px] font-medium">HTML</span>
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
              <FileText size={22} />
              <span className="text-[10px] font-medium">PDF</span>
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
              <File size={22} />
              <span className="text-[10px] font-medium">Print</span>
            </button>
            <button
              onClick={() => setSelectedFormat('png')}
              className={clsx(
                "p-3 rounded-lg border flex flex-col items-center gap-1 transition-all",
                selectedFormat === 'png'
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600"
              )}
            >
              <Image size={22} />
              <span className="text-[10px] font-medium">PNG</span>
            </button>
            <button
              onClick={() => setSelectedFormat('png-zip')}
              className={clsx(
                "p-3 rounded-lg border flex flex-col items-center gap-1 transition-all",
                selectedFormat === 'png-zip'
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600"
              )}
            >
              <Archive size={22} />
              <span className="text-[10px] font-medium">ZIP</span>
            </button>
            <button
              onClick={() => setSelectedFormat('json')}
              className={clsx(
                "p-3 rounded-lg border flex flex-col items-center gap-1 transition-all",
                selectedFormat === 'json'
                  ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600"
              )}
            >
              <FileText size={22} />
              <span className="text-[10px] font-medium">JSON</span>
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

        {/* PNG Export Options */}
        {(selectedFormat === 'png' || selectedFormat === 'png-zip') && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
              <Image size={16} />
              PNG Export Options
            </h3>
            
            {/* Transparent Background Toggle */}
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={pngOptions.transparentBackground}
                onChange={(e) => setPngOptions({ ...pngOptions, transparentBackground: e.target.checked })}
                className="w-4 h-4 rounded accent-emerald-500"
              />
              <span className="flex items-center gap-1">
                Transparent background
                <span className="text-xs text-gray-400">(removes page background)</span>
              </span>
            </label>

            {/* Background Color Picker (when not transparent) */}
            {!pngOptions.transparentBackground && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span>Background color:</span>
                <input
                  type="color"
                  value={pngOptions.backgroundColor}
                  onChange={(e) => setPngOptions({ ...pngOptions, backgroundColor: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer border border-gray-300"
                />
                <span className="text-xs text-gray-400">{pngOptions.backgroundColor}</span>
              </div>
            )}
            
            {/* Scale/Resolution */}
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <span>Resolution:</span>
              <select
                value={pngOptions.scale}
                onChange={(e) => setPngOptions({ ...pngOptions, scale: Number(e.target.value) })}
                className="bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded px-2 py-1 text-sm"
              >
                <option value={1}>1x (Standard)</option>
                <option value={2}>2x (Retina / HD)</option>
                <option value={3}>3x (High Resolution)</option>
                <option value={4}>4x (Ultra HD)</option>
              </select>
            </div>
            
            {/* Include UI Elements */}
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={pngOptions.includeUIElements}
                onChange={(e) => setPngOptions({ ...pngOptions, includeUIElements: e.target.checked })}
                className="w-4 h-4 rounded accent-emerald-500"
              />
              <span className="flex items-center gap-1">
                Include UI elements
                <span className="text-xs text-gray-400">(line numbers, buttons)</span>
              </span>
            </label>

            {/* Page Count Info */}
            {selectedFormat === 'png-zip' && (
              <div className="text-xs text-gray-500 dark:text-gray-400 bg-emerald-50 dark:bg-emerald-900/20 rounded p-2 border border-emerald-200 dark:border-emerald-800">
                📦 Will export <strong>{pages.length}</strong> page{pages.length !== 1 ? 's' : ''} as separate PNG files in a ZIP archive
              </div>
            )}
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
            {selectedFormat === 'png' && (
              <>🖼️ Exports the <strong>current page</strong> as a high-quality PNG image. {pngOptions.transparentBackground ? 'Background will be transparent.' : 'Background will be solid.'}</>
            )}
            {selectedFormat === 'png-zip' && (
              <>📦 Exports <strong>all {pages.length} pages</strong> as PNG images bundled in a ZIP file. {pngOptions.transparentBackground ? 'Backgrounds will be transparent.' : 'Backgrounds will be solid.'}</>
            )}
            {selectedFormat === 'json' && (
              <>💾 Exports the project data as JSON for backup or programmatic access.</>
            )}
          </p>
        </div>

        {/* Progress Bar (for ZIP export) */}
        {exportProgress && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Exporting pages...</span>
              <span>{exportProgress.current} / {exportProgress.total}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-300"
                style={{ width: `${(exportProgress.current / exportProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

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
              : (selectedFormat === 'png' || selectedFormat === 'png-zip')
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
                : "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
          )}
        >
          {exported ? (
            <>
              <Check size={18} /> Exported!
            </>
          ) : isExporting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {exportProgress ? `Exporting ${exportProgress.current}/${exportProgress.total}...` : 'Exporting...'}
            </>
          ) : (
            <>
              {(selectedFormat === 'png' || selectedFormat === 'png-zip') ? <Image size={18} /> : <Download size={18} />}
              Export {selectedFormat === 'png-zip' ? 'ZIP' : selectedFormat.toUpperCase()}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ExportModal;
