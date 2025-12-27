import React from 'react';
import { clsx } from 'clsx';
import type { CalloutType, PageContent } from '../types';
import { DEFAULT_STAMP_TEMPLATES } from '../types';
import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────────────────────────
// SNIPPET LIBRARY COMPONENT
// Provides drag-and-drop access to pre-built content blocks
// ─────────────────────────────────────────────────────────────────

interface SnippetLibraryProps {
  onInsertSnippet: (content: PageContent) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

// Pre-defined snippets based on the stamp templates
const BUILTIN_SNIPPETS: Array<{
  id: string;
  name: string;
  category: 'callout' | 'divider' | 'table';
  icon: string;
  description: string;
  createContent: () => PageContent;
}> = [
  // Callout snippets from stamp templates
  ...DEFAULT_STAMP_TEMPLATES.map(stamp => ({
    id: `snippet-${stamp.id}`,
    name: stamp.name,
    category: 'callout' as const,
    icon: stamp.icon,
    description: 'Styled callout box',
    createContent: (): PageContent => ({
      id: uuidv4(),
      type: 'callout',
      calloutType: stamp.type as CalloutType,
      title: stamp.name,
      content: stamp.defaultContent || 'Enter content here...',
      icon: stamp.icon,
      color: stamp.headerColor,
    }),
  })),
  
  // Divider snippets
  {
    id: 'snippet-divider-line',
    name: 'Line Divider',
    category: 'divider',
    icon: '─',
    description: 'Simple horizontal line',
    createContent: (): PageContent => ({
      id: uuidv4(),
      type: 'divider',
      dividerStyle: 'line',
      spacing: '10mm',
    }),
  },
  {
    id: 'snippet-divider-dots',
    name: 'Dot Divider',
    category: 'divider',
    icon: '•••',
    description: 'Three dots separator',
    createContent: (): PageContent => ({
      id: uuidv4(),
      type: 'divider',
      dividerStyle: 'dots',
      spacing: '10mm',
    }),
  },
  {
    id: 'snippet-divider-asterisks',
    name: 'Asterisk Divider',
    category: 'divider',
    icon: '***',
    description: 'Three asterisks separator',
    createContent: (): PageContent => ({
      id: uuidv4(),
      type: 'divider',
      dividerStyle: 'asterisks',
      spacing: '10mm',
    }),
  },
  {
    id: 'snippet-divider-fleuron',
    name: 'Fleuron',
    category: 'divider',
    icon: '❧',
    description: 'Decorative fleuron',
    createContent: (): PageContent => ({
      id: uuidv4(),
      type: 'divider',
      dividerStyle: 'fleuron',
      spacing: '10mm',
    }),
  },
  
  // Table snippets
  {
    id: 'snippet-table-2col',
    name: 'Vocabulary Table',
    category: 'table',
    icon: '📊',
    description: 'Two-column vocabulary list',
    createContent: (): PageContent => ({
      id: uuidv4(),
      type: 'table',
      headers: ['French', 'English'],
      rows: [
        ['mot', 'word'],
        ['phrase', 'sentence'],
        ['exemple', 'example'],
      ],
      caption: 'Vocabulary list',
    }),
  },
  {
    id: 'snippet-table-conjugation',
    name: 'Verb Conjugation',
    category: 'table',
    icon: '📋',
    description: 'Verb conjugation table',
    createContent: (): PageContent => ({
      id: uuidv4(),
      type: 'table',
      headers: ['Pronoun', 'Present', 'Past'],
      rows: [
        ['je', 'parle', 'parlais'],
        ['tu', 'parles', 'parlais'],
        ['il/elle', 'parle', 'parlait'],
        ['nous', 'parlons', 'parlions'],
        ['vous', 'parlez', 'parliez'],
        ['ils/elles', 'parlent', 'parlaient'],
      ],
      caption: 'Conjugation: parler (to speak)',
    }),
  },
];

// Snippet item component
interface SnippetItemProps {
  snippet: typeof BUILTIN_SNIPPETS[0];
  onInsert: () => void;
}

const SnippetItem: React.FC<SnippetItemProps> = ({ snippet, onInsert }) => {
  const handleDragStart = (e: React.DragEvent) => {
    // Store snippet data for drop handling
    e.dataTransfer.setData('application/x-snippet', JSON.stringify({
      id: snippet.id,
      type: 'snippet',
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onInsert}
      className="snippet-item flex items-center gap-2 p-2 rounded border border-gray-200 
                 hover:border-blue-300 hover:bg-blue-50 cursor-grab active:cursor-grabbing
                 transition-all group"
      title={snippet.description}
    >
      <span className="text-lg flex-shrink-0">{snippet.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-700 truncate">{snippet.name}</div>
        <div className="text-[10px] text-gray-400 truncate hidden group-hover:block">
          {snippet.description}
        </div>
      </div>
    </div>
  );
};

export const SnippetLibrary: React.FC<SnippetLibraryProps> = ({
  onInsertSnippet,
  collapsed = false,
  onToggleCollapse,
}) => {
  const [activeCategory, setActiveCategory] = React.useState<'callout' | 'divider' | 'table' | 'all'>('all');
  
  const filteredSnippets = activeCategory === 'all' 
    ? BUILTIN_SNIPPETS 
    : BUILTIN_SNIPPETS.filter(s => s.category === activeCategory);

  const handleInsert = (snippet: typeof BUILTIN_SNIPPETS[0]) => {
    const content = snippet.createContent();
    onInsertSnippet(content);
  };

  if (collapsed) {
    return (
      <div className="border-b bg-gray-50 p-2">
        <button
          onClick={onToggleCollapse}
          className="w-full text-left text-xs font-medium text-gray-600 flex items-center gap-2"
        >
          <span>📚</span>
          <span>Snippet Library</span>
          <span className="ml-auto">▼</span>
        </button>
      </div>
    );
  }

  return (
    <div className="border-b bg-gray-50">
      {/* Header */}
      <div className="p-2 border-b bg-white flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-700 flex items-center gap-1">
          <span>📚</span>
          Snippet Library
        </h3>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="text-gray-400 hover:text-gray-600 text-xs"
          >
            ▲
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex border-b bg-white">
        {(['all', 'callout', 'divider', 'table'] as const).map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={clsx(
              'flex-1 px-2 py-1 text-xs capitalize transition-colors',
              activeCategory === category
                ? 'text-blue-600 border-b-2 border-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            {category === 'all' ? 'All' : category}
          </button>
        ))}
      </div>

      {/* Snippet Grid */}
      <div className="p-2 max-h-64 overflow-y-auto">
        <div className="grid grid-cols-1 gap-2">
          {filteredSnippets.map(snippet => (
            <SnippetItem
              key={snippet.id}
              snippet={snippet}
              onInsert={() => handleInsert(snippet)}
            />
          ))}
        </div>
        
        {filteredSnippets.length === 0 && (
          <div className="text-center text-gray-400 text-xs py-4">
            No snippets in this category
          </div>
        )}
      </div>

      {/* Help text */}
      <div className="p-2 text-[10px] text-gray-400 border-t bg-white">
        💡 Click or drag snippets to insert into your document
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// HELPER: Get snippet by ID for drop handling
// ─────────────────────────────────────────────────────────────────
export const getSnippetById = (snippetId: string): typeof BUILTIN_SNIPPETS[0] | undefined => {
  return BUILTIN_SNIPPETS.find(s => s.id === snippetId);
};

export const createContentFromSnippetId = (snippetId: string): PageContent | undefined => {
  const snippet = getSnippetById(snippetId);
  return snippet?.createContent();
};

export default SnippetLibrary;
