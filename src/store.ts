import { create } from 'zustand';
import { ProjectState, LineData, SpanHighlight, ArrowConnector, SidebarCard, ThemeConfig } from './types';

const generateId = () => Math.random().toString(36).substring(2, 9);

interface StoreState extends ProjectState {
  // Actions
  setMetadata: (metadata: Partial<ProjectState['metadata']>) => void;
  setLines: (lines: LineData[]) => void;
  addHighlight: (highlight: Omit<SpanHighlight, 'id'>) => void;
  removeHighlight: (id: string) => void;
  updateHighlight: (id: string, updates: Partial<SpanHighlight>) => void;
  addArrow: (arrow: Omit<ArrowConnector, 'id'>) => void;
  updateArrow: (id: string, updates: Partial<ArrowConnector>) => void;
  removeArrow: (id: string) => void;
  addSidebarCard: (card: Omit<SidebarCard, 'id'>) => void;
  updateSidebarCard: (id: string, updates: Partial<SidebarCard>) => void;
  removeSidebarCard: (id: string) => void;
  updateTheme: (theme: Partial<ThemeConfig>) => void;

  parseAndSetText: (rawFrench: string, rawEnglish: string) => void;

  // Selection State
  selectionMode: 'highlight' | 'arrow' | 'none';
  selectedSourceId: string | null;
  selectedColor: string;

  // Highlight Selection (Multi-step)
  highlightSelection: {
    frenchIds: string[];
    englishIds: string[];
    lineId: string | null;
  };

  // Property Editing
  selectedElementId: string | null;
  selectedElementType: 'arrow' | 'highlight' | null;

  setSelectedElement: (id: string | null, type: 'arrow' | 'highlight' | null) => void;
  addToHighlightSelection: (wordId: string, lang: 'french' | 'english', lineId: string) => void;
  clearHighlightSelection: () => void;
}

export const useStore = create<StoreState>((set) => ({
  metadata: {
    title: 'Untitled Project',
    author: '',
    difficultyLevel: 'Intermediate',
    year: new Date().getFullYear(),
  },
  lines: [],
  highlights: [],
  arrows: [],
  sidebars: [],
  theme: {
    frenchFontFamily: 'serif',
    englishFontFamily: 'sans-serif',
    fontSize: '18px',
    lineHeight: '1.6',
    highlightColors: ['#fef3c7', '#dcfce7', '#dbeafe', '#fce7f3'],
  },

  selectionMode: 'none',
  selectedSourceId: null,
  selectedColor: '#fef3c7',

  highlightSelection: {
    frenchIds: [],
    englishIds: [],
    lineId: null
  },

  selectedElementId: null,
  selectedElementType: null,

  setMetadata: (metadata) => set((state) => ({ metadata: { ...state.metadata, ...metadata } })),
  setLines: (lines) => set({ lines }),

  addHighlight: (highlight) => set((state) => ({
    highlights: [...state.highlights, { ...highlight, id: generateId() }]
  })),

  removeHighlight: (id) => set((state) => ({
    highlights: state.highlights.filter(h => h.id !== id),
    selectedElementId: state.selectedElementId === id ? null : state.selectedElementId
  })),

  updateHighlight: (id, updates) => set((state) => ({
    highlights: state.highlights.map(h => h.id === id ? { ...h, ...updates } : h)
  })),

  addArrow: (arrow) => set((state) => ({
    arrows: [...state.arrows, { ...arrow, id: generateId() }]
  })),

  updateArrow: (id, updates) => set((state) => ({
    arrows: state.arrows.map(a => a.id === id ? { ...a, ...updates } : a)
  })),

  removeArrow: (id) => set((state) => ({
    arrows: state.arrows.filter(a => a.id !== id),
    selectedElementId: state.selectedElementId === id ? null : state.selectedElementId
  })),

  addSidebarCard: (card) => set((state) => ({
    sidebars: [...state.sidebars, { ...card, id: generateId() }]
  })),

  updateSidebarCard: (id, updates) => set((state) => ({
    sidebars: state.sidebars.map(s => s.id === id ? { ...s, ...updates } : s)
  })),

  removeSidebarCard: (id) => set((state) => ({
    sidebars: state.sidebars.filter(s => s.id !== id)
  })),

  updateTheme: (theme) => set((state) => ({
    theme: { ...state.theme, ...theme }
  })),

  parseAndSetText: (rawFrench, rawEnglish) => {
    const frLines = rawFrench.split('\n');
    const enLines = rawEnglish.split('\n');
    const max = Math.max(frLines.length, enLines.length);

    const lines: LineData[] = [];
    for (let i = 0; i < max; i++) {
      const frText = frLines[i] ? frLines[i].trim() : '';
      const enText = enLines[i] ? enLines[i].trim() : '';

      // Only add line if at least one language has content, or preserve empty lines for spacing
      // Here we allow empty lines to act as spacers if both are empty strings but present in array
      lines.push({
        id: generateId(),
        lineNumber: i + 1,
        frenchText: frText,
        englishText: enText
      });
    }
    set({ lines, highlights: [], arrows: [], sidebars: [] });
  },

  setSelectedElement: (id, type) => set({ selectedElementId: id, selectedElementType: type }),

  addToHighlightSelection: (wordId, lang, lineId) => set((state) => {
    // If line ID changes, reset selection (enforce per-line highlights for simplicity in this version)
    // Or we can allow multi-line. The requirement doesn't specify. Let's strict it to per-line for sanity.
    const isNewContext = state.highlightSelection.lineId && state.highlightSelection.lineId !== lineId;
    const current = isNewContext ? { frenchIds: [], englishIds: [], lineId: null } : state.highlightSelection;

    const newSelection = {
        frenchIds: lang === 'french' ? [...current.frenchIds, wordId] : current.frenchIds,
        englishIds: lang === 'english' ? [...current.englishIds, wordId] : current.englishIds,
        lineId: lineId
    };

    return { highlightSelection: newSelection };
  }),

  clearHighlightSelection: () => set({ highlightSelection: { frenchIds: [], englishIds: [], lineId: null } })
}));
