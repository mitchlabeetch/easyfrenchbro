import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Download,
  Copy,
  ClipboardPaste,
  ArrowLeft,
  GripVertical,
  FileText,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Upload,
  RotateCcw
} from 'lucide-react';
import { DraggablePopup } from './DraggablePopup';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface CSVRow {
  id: string;
  french: string;
  english: string;
  type: string;
  note: string;
}

interface CSVCreatorProps {
  onClose: () => void;
  onImportToProject?: (csvString: string) => void;
}

// ─────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────

const generateId = () => `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const createEmptyRow = (): CSVRow => ({
  id: generateId(),
  french: '',
  english: '',
  type: '',
  note: ''
});

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export const CSVCreator: React.FC<CSVCreatorProps> = ({ onClose, onImportToProject }) => {
  // ─── STATE ────────────────────────────────────────────────
  const [rows, setRows] = useState<CSVRow[]>([createEmptyRow(), createEmptyRow(), createEmptyRow()]);
  const [projectName, setProjectName] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── EFFECTS ──────────────────────────────────────────────
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // ─── HANDLERS ─────────────────────────────────────────────
  const addRow = () => {
    setRows([...rows, createEmptyRow()]);
  };

  const addMultipleRows = (count: number) => {
    const newRows = Array.from({ length: count }, () => createEmptyRow());
    setRows([...rows, ...newRows]);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) {
      setNotification({ type: 'error', message: 'At least one row is required' });
      return;
    }
    setRows(rows.filter(r => r.id !== id));
  };

  const updateRow = (id: string, field: keyof CSVRow, value: string) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const clearAll = () => {
    if (window.confirm('Clear all rows? This cannot be undone.')) {
      setRows([createEmptyRow()]);
      setProjectName('');
      setNotification({ type: 'success', message: 'All rows cleared' });
    }
  };

  // ─── DRAG & DROP ──────────────────────────────────────────
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newRows = [...rows];
    const [dragged] = newRows.splice(draggedIndex, 1);
    newRows.splice(index, 0, dragged);
    setRows(newRows);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // ─── PASTE FROM CLIPBOARD ─────────────────────────────────
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setNotification({ type: 'error', message: 'Clipboard is empty' });
        return;
      }

      // Try to parse as tab-separated or comma-separated
      const lines = text.split('\n').filter(l => l.trim());
      const parsedRows: CSVRow[] = [];

      for (const line of lines) {
        // Try tab first (common from spreadsheets), then comma
        let parts = line.includes('\t') ? line.split('\t') : line.split(',');
        parts = parts.map(p => p.trim().replace(/^["']|["']$/g, '')); // Remove quotes

        parsedRows.push({
          id: generateId(),
          french: parts[0] || '',
          english: parts[1] || '',
          type: parts[2] || '',
          note: parts[3] || ''
        });
      }

      if (parsedRows.length > 0) {
        setRows([...rows.filter(r => r.french || r.english), ...parsedRows]);
        setNotification({ type: 'success', message: `Imported ${parsedRows.length} rows from clipboard` });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to read clipboard' });
    }
  };

  // ─── IMPORT CSV FILE ──────────────────────────────────────
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').filter(l => l.trim());
      const parsedRows: CSVRow[] = [];
      let isFirstLine = true;

      for (const line of lines) {
        const parts = line.includes('\t') ? line.split('\t') : line.split(',');
        const cleaned = parts.map(p => p.trim().replace(/^["']|["']$/g, ''));

        // Skip header row if detected
        if (isFirstLine) {
          const lower = cleaned.map(c => c.toLowerCase());
          if (lower.includes('french') || lower.includes('english') || lower.includes('lines-fr')) {
            isFirstLine = false;
            continue;
          }
        }
        isFirstLine = false;

        parsedRows.push({
          id: generateId(),
          french: cleaned[0] || '',
          english: cleaned[1] || '',
          type: cleaned[2] || '',
          note: cleaned[3] || ''
        });
      }

      if (parsedRows.length > 0) {
        setRows(parsedRows);
        setProjectName(file.name.replace(/\.csv$/i, ''));
        setNotification({ type: 'success', message: `Imported ${parsedRows.length} rows from file` });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ─── GENERATE CSV ─────────────────────────────────────────
  const generateCSV = useCallback((): string => {
    const header = 'French,English,Type,Note';
    const lines = rows
      .filter(r => r.french.trim() || r.english.trim()) // Skip empty rows
      .map(r => {
        // Escape quotes and wrap in quotes if contains comma
        const escape = (s: string) => {
          if (s.includes(',') || s.includes('"') || s.includes('\n')) {
            return `"${s.replace(/"/g, '""')}"`;
          }
          return s;
        };
        return [escape(r.french), escape(r.english), escape(r.type), escape(r.note)].join(',');
      });
    
    return [header, ...lines].join('\n');
  }, [rows]);

  // ─── DOWNLOAD CSV ─────────────────────────────────────────
  const handleDownload = () => {
    const validRows = rows.filter(r => r.french.trim() || r.english.trim());
    if (validRows.length === 0) {
      setNotification({ type: 'error', message: 'No content to export' });
      return;
    }

    const csv = generateCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName || 'french-content'}.csv`;
    link.click();
    
    URL.revokeObjectURL(url);
    setNotification({ type: 'success', message: 'CSV downloaded successfully!' });
  };

  // ─── COPY TO CLIPBOARD ────────────────────────────────────
  const handleCopyToClipboard = async () => {
    const validRows = rows.filter(r => r.french.trim() || r.english.trim());
    if (validRows.length === 0) {
      setNotification({ type: 'error', message: 'No content to copy' });
      return;
    }

    try {
      await navigator.clipboard.writeText(generateCSV());
      setNotification({ type: 'success', message: 'CSV copied to clipboard!' });
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to copy to clipboard' });
    }
  };

  // ─── IMPORT TO PROJECT ────────────────────────────────────
  const handleImportToProject = () => {
    if (!onImportToProject) return;
    
    const validRows = rows.filter(r => r.french.trim() || r.english.trim());
    if (validRows.length === 0) {
      setNotification({ type: 'error', message: 'No content to import' });
      return;
    }

    const csv = generateCSV();
    onImportToProject(csv);
    setNotification({ type: 'success', message: 'Content imported to project!' });
  };

  // ─── QUICK ADD SENTENCE PAIRS ─────────────────────────────
  const handleQuickAdd = () => {
    const input = window.prompt(
      'Enter French and English sentences separated by " | " (pipe):\n\nExample:\nLe chat dort. | The cat sleeps.'
    );
    
    if (!input) return;
    
    const parts = input.split('|').map(s => s.trim());
    if (parts.length >= 2) {
      const newRow = createEmptyRow();
      newRow.french = parts[0];
      newRow.english = parts[1];
      setRows([...rows.filter(r => r.french || r.english), newRow]);
      setNotification({ type: 'success', message: 'Sentence pair added!' });
    } else {
      setNotification({ type: 'error', message: 'Invalid format. Use "French | English"' });
    }
  };

  // ─── STATS ────────────────────────────────────────────────
  const validRowCount = rows.filter(r => r.french.trim() || r.english.trim()).length;
  const totalWords = rows.reduce((acc, r) => {
    const frWords = r.french.trim().split(/\s+/).filter(Boolean).length;
    const enWords = r.english.trim().split(/\s+/).filter(Boolean).length;
    return acc + frWords + enWords;
  }, 0);

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* ─── HEADER ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft size={20} />
            </button>
            <FileSpreadsheet size={28} />
            <div>
              <h2 className="text-xl font-bold">CSV Creator</h2>
              <p className="text-sm text-white/70">Create bilingual content files for import</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right mr-4">
              <div className="text-sm font-medium">{validRowCount} rows</div>
              <div className="text-xs text-white/70">{totalWords} words</div>
            </div>
            <button
              onClick={() => setShowHelpModal(true)}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors text-white/80 hover:text-white"
              title="Help"
            >
              ?
            </button>
          </div>
        </div>

        {/* ─── TOOLBAR ────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 px-6 py-3 bg-gray-50 border-b">
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="File name (optional)"
            className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none w-48"
          />
          
          <div className="h-6 w-px bg-gray-300 mx-2" />
          
          <button
            onClick={addRow}
            className="flex items-center gap-1.5 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors text-sm font-medium"
          >
            <Plus size={16} /> Add Row
          </button>
          
          <button
            onClick={() => addMultipleRows(5)}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            <Plus size={16} /> +5 Rows
          </button>

          <button
            onClick={handleQuickAdd}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm"
            title="Quick add sentence pair"
          >
            <Sparkles size={16} /> Quick Add
          </button>

          <div className="h-6 w-px bg-gray-300 mx-2" />

          <button
            onClick={handlePasteFromClipboard}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors text-sm"
            title="Paste from clipboard"
          >
            <ClipboardPaste size={16} /> Paste
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
            title="Import existing CSV file"
          >
            <Upload size={16} /> Import CSV
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileImport}
            className="hidden"
          />

          <div className="flex-1" />

          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
            title="Clear all"
          >
            <RotateCcw size={16} /> Clear
          </button>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              showAdvanced ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {showAdvanced ? 'Hide' : 'Show'} Type/Note
          </button>
        </div>

        {/* ─── TABLE ──────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="w-8 p-2"></th>
                <th className="w-8 p-2 text-center">#</th>
                <th className="p-2">French 🇫🇷</th>
                <th className="p-2">English 🇬🇧</th>
                {showAdvanced && (
                  <>
                    <th className="p-2 w-32">Type</th>
                    <th className="p-2 w-48">Note</th>
                  </>
                )}
                <th className="w-12 p-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={row.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`group border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    draggedIndex === index ? 'bg-teal-50 opacity-70' : ''
                  }`}
                >
                  <td className="p-1">
                    <div className="cursor-grab text-gray-300 hover:text-gray-500 transition-colors">
                      <GripVertical size={16} />
                    </div>
                  </td>
                  <td className="p-2 text-center text-sm text-gray-400 font-mono">{index + 1}</td>
                  <td className="p-1">
                    <textarea
                      value={row.french}
                      onChange={(e) => updateRow(row.id, 'french', e.target.value)}
                      placeholder="French text..."
                      rows={2}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                    />
                  </td>
                  <td className="p-1">
                    <textarea
                      value={row.english}
                      onChange={(e) => updateRow(row.id, 'english', e.target.value)}
                      placeholder="English translation..."
                      rows={2}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                    />
                  </td>
                  {showAdvanced && (
                    <>
                      <td className="p-1">
                        <select
                          value={row.type}
                          onChange={(e) => updateRow(row.id, 'type', e.target.value)}
                          className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                        >
                          <option value="">—</option>
                          <option value="title">Title</option>
                          <option value="heading">Heading</option>
                          <option value="paragraph">Paragraph</option>
                          <option value="dialogue">Dialogue</option>
                          <option value="note">Note</option>
                        </select>
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={row.note}
                          onChange={(e) => updateRow(row.id, 'note', e.target.value)}
                          placeholder="Optional note..."
                          className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                      </td>
                    </>
                  )}
                  <td className="p-1">
                    <button
                      onClick={() => removeRow(row.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove row"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Empty state */}
          {rows.length === 1 && !rows[0].french && !rows[0].english && (
            <div className="text-center py-12 text-gray-400">
              <FileText size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Start adding your bilingual content</p>
              <p className="text-sm">Add French-English sentence pairs for your learning material</p>
            </div>
          )}
        </div>

        {/* ─── FOOTER / ACTIONS ───────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t">
          <div className="text-sm text-gray-500">
            {validRowCount > 0 ? (
              <span className="flex items-center gap-1.5">
                <CheckCircle size={16} className="text-green-500" />
                {validRowCount} row{validRowCount !== 1 ? 's' : ''} ready for export
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <AlertCircle size={16} className="text-amber-500" />
                Add content to enable export
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyToClipboard}
              disabled={validRowCount === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              <Copy size={16} /> Copy CSV
            </button>

            <button
              onClick={handleDownload}
              disabled={validRowCount === 0}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              <Download size={16} /> Download CSV
            </button>

            {onImportToProject && (
              <button
                onClick={handleImportToProject}
                disabled={validRowCount === 0}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
              >
                <FileSpreadsheet size={16} /> Import to Project
              </button>
            )}
          </div>
        </div>

        {/* ─── NOTIFICATION TOAST ─────────────────────────────── */}
        {notification && (
          <div
            className={`absolute bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-in slide-in-from-bottom duration-200 ${
              notification.type === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {notification.message}
          </div>
        )}

        {/* ─── HELP MODAL ─────────────────────────────────────── */}
        {showHelpModal && (
          <DraggablePopup
            title="CSV Creator Help"
            onClose={() => setShowHelpModal(false)}
            initialPosition={{ x: window.innerWidth / 2 - 200, y: 100 }}
          >
            <div className="p-4 space-y-4 max-w-md">
              <div>
                <h4 className="font-semibold text-gray-800 mb-1">📝 Adding Content</h4>
                <p className="text-sm text-gray-600">
                  Enter French text and its English translation for each row. Use the "Quick Add" button for fast entry with the format: <code className="bg-gray-100 px-1 rounded">French | English</code>
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-1">📋 Paste from Spreadsheet</h4>
                <p className="text-sm text-gray-600">
                  Copy cells from Excel/Sheets and use the "Paste" button. Supports tab and comma-separated values.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-1">📤 Export Options</h4>
                <ul className="text-sm text-gray-600 list-disc ml-4 space-y-1">
                  <li><strong>Download CSV:</strong> Save as a .csv file</li>
                  <li><strong>Copy CSV:</strong> Copy to clipboard</li>
                  <li><strong>Import to Project:</strong> Directly load into current project</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-1">🔀 Reordering</h4>
                <p className="text-sm text-gray-600">
                  Drag rows using the grip handle (⋮⋮) to reorder.
                </p>
              </div>
              <div className="pt-2 border-t">
                <h4 className="font-semibold text-gray-800 mb-1">📁 CSV Format</h4>
                <code className="block text-xs bg-gray-100 p-2 rounded">
                  French,English,Type,Note<br/>
                  "Le chat dort.","The cat sleeps.",,"<br/>
                  "Bonjour!","Hello!","greeting",
                </code>
              </div>
            </div>
          </DraggablePopup>
        )}
      </div>
    </div>
  );
};
