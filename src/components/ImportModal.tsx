import React, { useState } from 'react';
import { useStore } from '../store';
import { X, ClipboardPaste } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose }) => {
  const { parseAndSetText } = useStore();
  const [frenchText, setFrenchText] = useState('');
  const [englishText, setEnglishText] = useState('');

  const handleImport = () => {
    if (!frenchText && !englishText) return;
    if (confirm("This will replace current project content. Continue?")) {
      parseAndSetText(frenchText, englishText);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-2xl w-full mx-4 flex flex-col h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <ClipboardPaste size={24} /> Import Text
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-500 mb-1">French Text</label>
            <textarea
              className="flex-1 p-2 border rounded resize-none text-sm dark:bg-gray-700 dark:text-white"
              placeholder="Paste French text here..."
              value={frenchText}
              onChange={e => setFrenchText(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-500 mb-1">English Text</label>
            <textarea
              className="flex-1 p-2 border rounded resize-none text-sm dark:bg-gray-700 dark:text-white"
              placeholder="Paste English text here..."
              value={englishText}
              onChange={e => setEnglishText(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
           <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
           <button onClick={handleImport} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Import Text</button>
        </div>
      </div>
    </div>
  );
};
