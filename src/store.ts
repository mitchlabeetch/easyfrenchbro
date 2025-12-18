import { create } from 'zustand';
import { ProjectState, PageData, LineData, SpanHighlight, ArrowConnector, SidebarCard, ThemeConfig } from './types';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';

const generateId = () => uuidv4();

interface StoreState extends ProjectState {
  // Actions
  setMetadata: (metadata: Partial<ProjectState['metadata']>) => void;
  setPages: (pages: PageData[]) => void;
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

  setProjectState: (state: ProjectState) => void;

  importFromCSV: (csvString: string) => void;
  reflowPages: (linesPerPage: number) => void;

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
  pages: [{ id: 'page-1', lines: [] }],
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
  setPages: (pages) => set({ pages }),

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

  setProjectState: (projectState) => set({
      ...projectState,
      selectionMode: 'none',
      selectedElementId: null,
      selectedElementType: null,
      highlightSelection: { frenchIds: [], englishIds: [], lineId: null }
  }),

  importFromCSV: (csvString) => {
    Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[];
        const allLines: LineData[] = rows.map((row, index) => ({
          id: generateId(),
          lineNumber: index + 1,
          frenchText: row['French'] || '',
          englishText: row['English'] || '',
          type: row['Type'] || '',
          note: row['Note'] || ''
        }));

        // Default pagination: 25 lines per page
        const linesPerPage = 25;
        const pages: PageData[] = [];
        for (let i = 0; i < allLines.length; i += linesPerPage) {
          pages.push({
            id: generateId(),
            lines: allLines.slice(i, i + linesPerPage)
          });
        }

        if (pages.length === 0) {
            pages.push({ id: generateId(), lines: [] });
        }

        set({ pages, highlights: [], arrows: [], sidebars: [] });
      },
      error: (error: any) => {
        console.error("CSV Parse Error:", error);
        alert("Failed to parse CSV");
      }
    });
  },

  reflowPages: (linesPerPage) => set((state) => {
    const allLines = state.pages.flatMap(p => p.lines);
    const newPages: PageData[] = [];

    for (let i = 0; i < allLines.length; i += linesPerPage) {
      newPages.push({
        id: generateId(),
        lines: allLines.slice(i, i + linesPerPage)
      });
    }

    if (newPages.length === 0) {
        newPages.push({ id: generateId(), lines: [] });
    }

    return { pages: newPages };
  }),

  parseAndSetText: (rawFrench, rawEnglish) => {
    const frLines = rawFrench.split('\n');
    const enLines = rawEnglish.split('\n');
    const max = Math.max(frLines.length, enLines.length);

    const lines: LineData[] = [];
    for (let i = 0; i < max; i++) {
      const frText = frLines[i] ? frLines[i].trim() : '';
      const enText = enLines[i] ? enLines[i].trim() : '';

      lines.push({
        id: generateId(),
        lineNumber: i + 1,
        frenchText: frText,
        englishText: enText
      });
    }
    // Put everything in one page by default or use standard pagination?
    // Let's use standard 25 to be consistent
    const linesPerPage = 25;
    const pages: PageData[] = [];
    for (let i = 0; i < lines.length; i += linesPerPage) {
        pages.push({
            id: generateId(),
            lines: lines.slice(i, i + linesPerPage)
        });
    }

    if (pages.length === 0) {
        pages.push({ id: generateId(), lines: [] });
    }

    set({ pages, highlights: [], arrows: [], sidebars: [] });
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
