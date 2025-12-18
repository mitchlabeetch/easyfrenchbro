import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, ChevronUp, ChevronDown, Replace, ReplaceAll } from 'lucide-react';
import { useStore } from '../store';
import { clsx } from 'clsx';

interface SearchResult {
  pageIndex: number;
  lineId: string;
  language: 'french' | 'english';
  startIndex: number;
  endIndex: number;
  text: string;
}

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ isOpen, onClose }) => {
  const { pages, setCurrentPageIndex, saveToHistory } = useStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [showReplace, setShowReplace] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);

  // Search logic
  const performSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setCurrentResultIndex(0);
      return;
    }

    const searchTerm = caseSensitive ? searchQuery : searchQuery.toLowerCase();
    const foundResults: SearchResult[] = [];

    pages.forEach((page, pageIndex) => {
      page.lines.forEach(line => {
        // Search in French text
        const frenchText = caseSensitive ? line.frenchText : line.frenchText.toLowerCase();
        let frenchIndex = frenchText.indexOf(searchTerm);
        while (frenchIndex !== -1) {
          foundResults.push({
            pageIndex,
            lineId: line.id,
            language: 'french',
            startIndex: frenchIndex,
            endIndex: frenchIndex + searchQuery.length,
            text: line.frenchText.substring(
              Math.max(0, frenchIndex - 20),
              Math.min(line.frenchText.length, frenchIndex + searchQuery.length + 20)
            )
          });
          frenchIndex = frenchText.indexOf(searchTerm, frenchIndex + 1);
        }

        // Search in English text
        const englishText = caseSensitive ? line.englishText : line.englishText.toLowerCase();
        let englishIndex = englishText.indexOf(searchTerm);
        while (englishIndex !== -1) {
          foundResults.push({
            pageIndex,
            lineId: line.id,
            language: 'english',
            startIndex: englishIndex,
            endIndex: englishIndex + searchQuery.length,
            text: line.englishText.substring(
              Math.max(0, englishIndex - 20),
              Math.min(line.englishText.length, englishIndex + searchQuery.length + 20)
            )
          });
          englishIndex = englishText.indexOf(searchTerm, englishIndex + 1);
        }
      });
    });

    setResults(foundResults);
    setCurrentResultIndex(0);

    // Navigate to first result
    if (foundResults.length > 0) {
      setCurrentPageIndex(foundResults[0].pageIndex);
    }
  }, [searchQuery, pages, caseSensitive, setCurrentPageIndex]);

  // Trigger search on query change
  useEffect(() => {
    const debounce = setTimeout(performSearch, 300);
    return () => clearTimeout(debounce);
  }, [performSearch]);

  // Navigate to previous result
  const goToPrevious = () => {
    if (results.length === 0) return;
    const newIndex = currentResultIndex === 0 ? results.length - 1 : currentResultIndex - 1;
    setCurrentResultIndex(newIndex);
    setCurrentPageIndex(results[newIndex].pageIndex);
  };

  // Navigate to next result
  const goToNext = () => {
    if (results.length === 0) return;
    const newIndex = currentResultIndex === results.length - 1 ? 0 : currentResultIndex + 1;
    setCurrentResultIndex(newIndex);
    setCurrentPageIndex(results[newIndex].pageIndex);
  };

  // Replace current occurrence
  const replaceCurrent = () => {
    if (results.length === 0 || !replaceQuery) return;
    
    saveToHistory();
    
    const result = results[currentResultIndex];
    const { pages: currentPages } = useStore.getState();
    
    const newPages = currentPages.map((page, pageIdx) => {
      if (pageIdx !== result.pageIndex) return page;
      
      return {
        ...page,
        lines: page.lines.map(line => {
          if (line.id !== result.lineId) return line;
          
          if (result.language === 'french') {
            const newText = line.frenchText.substring(0, result.startIndex) + 
                           replaceQuery + 
                           line.frenchText.substring(result.endIndex);
            return { ...line, frenchText: newText };
          } else {
            const newText = line.englishText.substring(0, result.startIndex) + 
                           replaceQuery + 
                           line.englishText.substring(result.endIndex);
            return { ...line, englishText: newText };
          }
        })
      };
    });
    
    useStore.setState({ pages: newPages });
    performSearch(); // Re-search to update results
  };

  // Replace all occurrences
  const replaceAll = () => {
    if (results.length === 0 || !replaceQuery) return;
    
    saveToHistory();
    
    const { pages: currentPages } = useStore.getState();
    
    const newPages = currentPages.map(page => ({
      ...page,
      lines: page.lines.map(line => {
        let newFrenchText = line.frenchText;
        let newEnglishText = line.englishText;
        
        // Replace in French text
        if (caseSensitive) {
          newFrenchText = line.frenchText.split(searchQuery).join(replaceQuery);
        } else {
          const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          newFrenchText = line.frenchText.replace(regex, replaceQuery);
        }
        
        // Replace in English text
        if (caseSensitive) {
          newEnglishText = line.englishText.split(searchQuery).join(replaceQuery);
        } else {
          const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          newEnglishText = line.englishText.replace(regex, replaceQuery);
        }
        
        return { ...line, frenchText: newFrenchText, englishText: newEnglishText };
      })
    }));
    
    useStore.setState({ pages: newPages });
    setResults([]);
    setCurrentResultIndex(0);
  };

  // Keyboard handler for Escape and Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && !e.shiftKey) {
        goToNext();
      } else if (e.key === 'Enter' && e.shiftKey) {
        goToPrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, results.length, currentResultIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 w-96">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <Search size={16} /> Find & Replace
        </h3>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X size={18} />
        </button>
      </div>

      {/* Search Input */}
      <div className="relative mb-2">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 pl-8 text-sm border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
          autoFocus
        />
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
      </div>

      {/* Replace Input (Collapsible) */}
      {showReplace && (
        <div className="relative mb-2">
          <input
            type="text"
            placeholder="Replace with..."
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
            className="w-full p-2 pl-8 text-sm border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <Replace size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      )}

      {/* Options Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={(e) => setCaseSensitive(e.target.checked)}
              className="w-3 h-3"
            />
            Case sensitive
          </label>
          <button
            onClick={() => setShowReplace(!showReplace)}
            className={clsx(
              "text-xs px-2 py-1 rounded",
              showReplace ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {showReplace ? 'Hide Replace' : 'Show Replace'}
          </button>
        </div>
      </div>

      {/* Results Count & Navigation */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {results.length === 0 
            ? (searchQuery ? 'No results' : 'Type to search')
            : `${currentResultIndex + 1} of ${results.length} results`
          }
        </span>
        <div className="flex gap-1">
          <button
            onClick={goToPrevious}
            disabled={results.length === 0}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"
            title="Previous (Shift+Enter)"
          >
            <ChevronUp size={16} />
          </button>
          <button
            onClick={goToNext}
            disabled={results.length === 0}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"
            title="Next (Enter)"
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </div>

      {/* Replace Buttons */}
      {showReplace && (
        <div className="flex gap-2">
          <button
            onClick={replaceCurrent}
            disabled={results.length === 0 || !replaceQuery}
            className="flex-1 flex items-center justify-center gap-1 p-2 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Replace size={12} /> Replace
          </button>
          <button
            onClick={replaceAll}
            disabled={results.length === 0 || !replaceQuery}
            className="flex-1 flex items-center justify-center gap-1 p-2 text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ReplaceAll size={12} /> Replace All ({results.length})
          </button>
        </div>
      )}

      {/* Current Result Preview */}
      {results.length > 0 && (
        <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs border">
          <div className="text-gray-400 text-[10px] uppercase mb-1">
            Page {results[currentResultIndex].pageIndex + 1} • {results[currentResultIndex].language}
          </div>
          <div className="text-gray-700 dark:text-gray-200 truncate">
            ...{results[currentResultIndex].text}...
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
