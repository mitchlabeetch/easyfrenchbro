import React from 'react';
import { useStore } from '../store';
import { X, BarChart2 } from 'lucide-react';

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatisticsModal: React.FC<StatisticsModalProps> = ({ isOpen, onClose }) => {
  const { pages, wordGroups, arrows, sidebars, metadata } = useStore();

  if (!isOpen) return null;

  const totalPages = pages.length;
  const totalLines = pages.reduce((acc, page) => acc + page.lines.length, 0);
  const totalWordsFrench = pages.reduce((acc, page) => acc + page.lines.reduce((lAcc, line) => lAcc + line.frenchText.split(/\s+/).filter(Boolean).length, 0), 0);
  const totalWordsEnglish = pages.reduce((acc, page) => acc + page.lines.reduce((lAcc, line) => lAcc + line.englishText.split(/\s+/).filter(Boolean).length, 0), 0);
  const totalGroups = wordGroups.length;
  const totalArrows = arrows.length;
  const totalAnecdotes = sidebars.length;
  const totalCharacters = pages.reduce((acc, page) => acc + page.lines.reduce((lAcc, line) => lAcc + line.frenchText.length + line.englishText.length, 0), 0);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <BarChart2 size={24} /> Project Statistics
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalPages}</div>
              <div className="text-xs text-blue-600 dark:text-blue-400 uppercase font-medium">Pages</div>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{totalLines}</div>
              <div className="text-xs text-indigo-600 dark:text-indigo-400 uppercase font-medium">Lines</div>
            </div>
          </div>

          <div className="border-t dark:border-gray-700 pt-4 space-y-2">
             <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">French Words</span>
                <span className="font-mono font-medium dark:text-gray-200">{totalWordsFrench}</span>
             </div>
             <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">English Words</span>
                <span className="font-mono font-medium dark:text-gray-200">{totalWordsEnglish}</span>
             </div>
             <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Total Characters</span>
                <span className="font-mono font-medium dark:text-gray-200">{totalCharacters}</span>
             </div>
          </div>

          <div className="border-t dark:border-gray-700 pt-4 space-y-2">
             <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Word Groups</span>
                <span className="font-mono font-medium dark:text-gray-200">{totalGroups}</span>
             </div>
             <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Arrows</span>
                <span className="font-mono font-medium dark:text-gray-200">{totalArrows}</span>
             </div>
             <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Anecdotes</span>
                <span className="font-mono font-medium dark:text-gray-200">{totalAnecdotes}</span>
             </div>
          </div>

          <div className="mt-4 pt-4 border-t dark:border-gray-700 text-xs text-center text-gray-400">
             Project: {metadata.title} ({metadata.year})
          </div>
        </div>
      </div>
    </div>
  );
};
