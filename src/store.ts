import { create } from 'zustand';
import { 
  ProjectState, 
  PageData, 
  LineData, 
  SpanHighlight, 
  ArrowConnector, 
  SidebarCard, 
  ThemeConfig,
  WordGroup,
  ColorPalette,
  Language,
  WordGroupType,
  TextStyle,
  Template,
  LinkedPair,
  AnecdoteType
} from './types';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';

const generateId = () => uuidv4();

// Default color palette (Extended)
const DEFAULT_PALETTE: ColorPalette = {
  id: 'default-palette',
  name: 'Default',
  colors: {
    subject: '#93c5fd',    // Blue
    verb: '#fca5a5',       // Red
    complement: '#86efac', // Green
    article: '#fde047',    // Yellow
    adjective: '#c4b5fd',  // Purple
    adverb: '#fdba74',     // Orange
    
    text: '#000000',

    grammar: '#fef3c7', // Yellow-ish
    spoken: '#dbeafe',  // Blue-ish
    history: '#fee2e2', // Red-ish
    falseFriend: '#ffedd5', // Orange-ish
    pronunciation: '#f3e8ff', // Purple-ish

    custom: ['#e5e7eb', '#d1d5db', '#9ca3af', '#4b5563', '#1f2937']
  },
  isDefault: true
};

interface WordGroupSelection {
  wordIds: string[];
  lineId: string | null;
  language: Language | null;
  startIndex: number | null;
}

interface StoreState extends ProjectState {
  // Actions
  setMetadata: (metadata: Partial<ProjectState['metadata']>) => void;
  setPages: (pages: PageData[]) => void;
  addPage: () => void;
  removePage: (id: string) => void;
  removeLine: (pageId: string, lineId: string) => void; // New action
  setCurrentPageIndex: (index: number) => void;
  // Linked Pair Actions
  addLinkedPair: (pair: Omit<LinkedPair, 'id'>) => void;
  removeLinkedPair: (id: string) => void;
  updateLinkedPair: (id: string, updates: Partial<LinkedPair>) => void;
  syncLinkedStyles: (sourceWordId: string, styles: TextStyle[]) => void;
  
  // Page Layout
  updatePage: (id: string, updates: Partial<PageData>) => void;
  
  // Rich Text Actions
  updateLineStyles: (lineId: string, language: Language, styles: TextStyle[]) => void;

  // Legacy highlight actions (for backwards compatibility)
  addHighlight: (highlight: Omit<SpanHighlight, 'id'>) => void;
  removeHighlight: (id: string) => void;
  updateHighlight: (id: string, updates: Partial<SpanHighlight>) => void;
  
  // Word Group actions (NEW)
  addWordGroup: (group: Omit<WordGroup, 'id'>) => void;
  updateWordGroup: (id: string, updates: Partial<WordGroup>) => void;
  removeWordGroup: (id: string) => void;
  
  // Arrow actions
  addArrow: (arrow: Omit<ArrowConnector, 'id'>) => void;
  updateArrow: (id: string, updates: Partial<ArrowConnector>) => void;
  removeArrow: (id: string) => void;
  
  // Sidebar actions
  addSidebarCard: (card: Omit<SidebarCard, 'id'>) => void;
  updateSidebarCard: (id: string, updates: Partial<SidebarCard>) => void;
  removeSidebarCard: (id: string) => void;
  
  // Extended Palette actions
  updateTheme: (theme: Partial<ThemeConfig>) => void;
  addPalette: (palette: Omit<ColorPalette, 'id'>) => void;
  updatePalette: (id: string, updates: Partial<ColorPalette>) => void;
  removePalette: (id: string) => void;
  setActivePalette: (id: string) => void;
  getColorForType: (type: WordGroupType) => string;
  getColorForAnecdote: (type: AnecdoteType) => string;

  // Template Actions
  addTemplate: (template: Omit<Template, 'id'>) => void;
  removeTemplate: (id: string) => void;

  setProjectState: (state: ProjectState) => void;

  importFromCSV: (csvString: string) => void;
  reflowPages: (linesPerPage: number) => void;

  parseAndSetText: (rawFrench: string, rawEnglish: string) => void;

  // Project Management (Async)
  fetchProjects: () => Promise<any[]>;
  saveProject: (name: string) => Promise<void>;
  loadProject: (name: string) => Promise<void>;

  // Palette Management (Async)
  fetchPalettes: () => Promise<void>;
  
  // Preferences (Async)
  fetchPreferences: () => Promise<void>;
  savePreferences: (prefs: Partial<ThemeConfig>) => Promise<void>;

  // Selection State
  selectionMode: 'highlight' | 'arrow' | 'wordGroup' | 'none';
  selectedSourceId: string | null;
  selectedColor: string;
  selectedWordType: WordGroupType;

  // Word Group Selection (for creating groups by shift+click)
  wordGroupSelection: WordGroupSelection;

  // Legacy Highlight Selection (Multi-step)
  highlightSelection: {
    frenchIds: string[];
    englishIds: string[];
    lineId: string | null;
  };

  // Arrow creation state
  arrowCreation: {
    sourceGroupIds: string[];
    targetGroupIds: string[]; // NEW: Accumulate targets
    isSelectingTarget: boolean;
    // New: for tooltip rendering, maybe we need reference to where we clicked?
    lastInteractedGroupId: string | null;
  };

  // Property Editing
  selectedElementId: string | null;
  selectedElementType: 'arrow' | 'highlight' | 'wordGroup' | 'anecdote' | null;

  setSelectedElement: (id: string | null, type: 'arrow' | 'highlight' | 'wordGroup' | 'anecdote' | null) => void;
  
  // Word group selection actions
  startWordGroupSelection: (wordId: string, wordIndex: number, lineId: string, language: Language) => void;
  extendWordGroupSelection: (wordId: string, wordIndex: number) => void;
  confirmWordGroupSelection: () => void;
  clearWordGroupSelection: () => void;
  
  // Arrow creation actions
  startArrowFromGroup: (groupId: string) => void;
  addArrowSourceGroup: (groupId: string) => void;
  addArrowTargetGroup: (groupId: string) => void; // NEW
  confirmArrowCreation: (styleTemplate?: Partial<ArrowConnector>) => void; // Update to accept template
  cancelArrowCreation: () => void;
  
  currentPageIndex: number;

  // Legacy
  addToHighlightSelection: (wordId: string, lang: 'french' | 'english', lineId: string) => void;
  clearHighlightSelection: () => void;
}

export const useStore = create<StoreState>((set, get) => ({
  metadata: {
    title: 'Untitled Project',
    author: '',
    difficultyLevel: 'Intermediate',
    year: new Date().getFullYear(),
  },
  pages: [{ id: 'page-1', lines: [] }],
  currentPageIndex: 0,
  highlights: [],
  wordGroups: [],
  arrows: [],
  sidebars: [],
  palettes: [DEFAULT_PALETTE],
  linkedPairs: [],
  templates: [],
  theme: {
    frenchFontFamily: 'serif',
    englishFontFamily: 'sans-serif',
    fontSize: '18px',
    lineHeight: '1.6',
    highlightColors: ['#fef3c7', '#dcfce7', '#dbeafe', '#fce7f3'],
    activePaletteId: 'default-palette'
  },

  selectionMode: 'none',
  selectedSourceId: null,
  selectedColor: '#93c5fd',
  selectedWordType: 'subject',

  wordGroupSelection: {
    wordIds: [],
    lineId: null,
    language: null,
    startIndex: null
  },

  highlightSelection: {
    frenchIds: [],
    englishIds: [],
    lineId: null
  },

  arrowCreation: {
    sourceGroupIds: [],
    targetGroupIds: [],
    isSelectingTarget: false,
    lastInteractedGroupId: null
  },

  selectedElementId: null,
  selectedElementType: null,

  setMetadata: (metadata) => set((state) => ({ metadata: { ...state.metadata, ...metadata } })),
  setPages: (pages) => set({ pages }),
  
  addPage: () => set((state) => ({
      pages: [...state.pages, { id: `page-${generateId()}`, lines: [] }]
  })),

  removePage: (id) => set((state) => ({
      pages: state.pages.filter(p => p.id !== id)
  })),

  setCurrentPageIndex: (index) => set({ currentPageIndex: index }),

  // Rich Text Actions
  updateLineStyles: (lineId, language, styles) => set((state) => {
    const updatedPages = state.pages.map(page => ({
        ...page,
        lines: page.lines.map(line => {
            if (line.id === lineId) {
                return language === 'french' 
                   ? { ...line, frenchStyles: styles }
                   : { ...line, englishStyles: styles };
            }
            return line;
        })
    }));
    return { pages: updatedPages };
  }),

  // Legacy highlight actions
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

  // Word Group actions
  addWordGroup: (group) => set((state) => ({
    wordGroups: [...state.wordGroups, { ...group, id: generateId() }]
  })),

  updateWordGroup: (id, updates) => set((state) => ({
    wordGroups: state.wordGroups.map(g => g.id === id ? { ...g, ...updates } : g)
  })),

  removeWordGroup: (id) => set((state) => {
    // Also remove any arrows that reference this group
    const updatedArrows = state.arrows.filter(a => 
      !a.sourceGroupIds.includes(id) && !a.targetGroupIds.includes(id)
    );
    return {
      wordGroups: state.wordGroups.filter(g => g.id !== id),
      arrows: updatedArrows,
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId
    };
  }),

  // Arrow actions
  addArrow: (arrow) => set((state) => ({
    arrows: [...state.arrows, { 
      ...arrow, 
      id: generateId(),
      // Ensure new arrow format defaults
      sourceGroupIds: arrow.sourceGroupIds || [],
      targetGroupIds: arrow.targetGroupIds || [],
      style: arrow.style || 'solid',
      strokeWidth: arrow.strokeWidth || 2,
      headStyle: arrow.headStyle || 'arrow',
      curvature: arrow.curvature ?? 0.5
    }]
  })),

  updateArrow: (id, updates) => set((state) => ({
    arrows: state.arrows.map(a => a.id === id ? { ...a, ...updates } : a)
  })),

  removeArrow: (id) => set((state) => ({
    arrows: state.arrows.filter(a => a.id !== id),
    selectedElementId: state.selectedElementId === id ? null : state.selectedElementId
  })),

  // Sidebar actions
  addSidebarCard: (card) => set((state) => {
      // Auto-assign color based on type if not provided
      const type = card.type as AnecdoteType;
      const activePalette = state.palettes.find(p => p.id === state.theme.activePaletteId) || DEFAULT_PALETTE;
      const color = activePalette.colors[type] || '#ffffff';
      
      return {
        sidebars: [...state.sidebars, { ...card, id: generateId(), color }]
      };
  }),

  updateSidebarCard: (id, updates) => set((state) => ({
    sidebars: state.sidebars.map(s => s.id === id ? { ...s, ...updates } : s)
  })),

  removeSidebarCard: (id) => set((state) => ({
    sidebars: state.sidebars.filter(s => s.id !== id)
  })),

  // Theme & Palette actions
  updateTheme: (theme) => set((state) => ({
    theme: { ...state.theme, ...theme }
  })),

  updatePalette: (id, updates) => set((state) => ({
    palettes: state.palettes.map(p => p.id === id ? { ...p, ...updates } : p)
  })),

  removePalette: (id) => set((state) => ({
    palettes: state.palettes.filter(p => p.id !== id)
  })),

  setActivePalette: (id) => set((state) => ({
    theme: { ...state.theme, activePaletteId: id }
  })),

  // Template Actions
  addTemplate: (template) => set((state) => ({
      templates: [...state.templates, { ...template, id: generateId() }]
  })),

  removeTemplate: (id) => set((state) => ({
      templates: state.templates.filter(t => t.id !== id)
  })),

  // Linking Actions
  addLinkedPair: (pair) => set((state) => ({
      linkedPairs: [...state.linkedPairs, { ...pair, id: generateId() }]
  })),

  removeLinkedPair: (id) => set((state) => ({
      linkedPairs: state.linkedPairs.filter(p => p.id !== id)
  })),

  syncLinkedStyles: (sourceWordId, styles) => set((state) => {
    // Find pairs containing this word
    const affectedPairs = state.linkedPairs.filter(p => p.sourceWordIds.includes(sourceWordId) || p.targetWordIds.includes(sourceWordId));
    
    if (affectedPairs.length === 0) return state;

    // Deep copy pages to update styles
    // Note: optimization possible, but deep cloning full pages array is safest for immutability
    const newPages = state.pages.map(p => ({
        ...p,
        lines: p.lines.map(l => ({ ...l }))
    }));

    affectedPairs.forEach(pair => {
       const isSource = pair.sourceWordIds.includes(sourceWordId);
       const targetIds = isSource ? pair.targetWordIds : pair.sourceWordIds;
       const lineId = pair.lineId;

       // Find line
       const pageIndex = newPages.findIndex(p => p.lines.some(l => l.id === lineId));
       if (pageIndex === -1) return;

       const page = newPages[pageIndex];
       const lineIndex = page.lines.findIndex(l => l.id === lineId);
       const line = page.lines[lineIndex];

       // Update styles for target words
       const targetLang = isSource ? 'english' : 'french';
       const currentStyles = targetLang === 'french' ? (line.frenchStyles || []) : (line.englishStyles || []);
       
       let updatedStyles = [...currentStyles];
       
       targetIds.forEach(targetId => {
          // Remove existing style entry for this word if exists
          updatedStyles = updatedStyles.filter(s => s.wordId !== targetId);
          // Add new style (merging properties from source style)
          // We assume 'styles' param contains the FULL style set for the source word.
          // So we replicate it for the target word.
          styles.forEach(s => {
             updatedStyles.push({ ...s, wordId: targetId }); 
          });
       });

       if (targetLang === 'french') {
         line.frenchStyles = updatedStyles;
       } else {
         line.englishStyles = updatedStyles;
       }
    });

    return { pages: newPages };
  }),


  fetchPalettes: async () => {
    try {
      const response = await fetch('http://localhost:3001/palettes');
      if (response.ok) {
        const palettes = await response.json();
        set({ palettes: palettes.length > 0 ? palettes : [DEFAULT_PALETTE] });
      }
    } catch (e) {
      console.error("Failed to fetch palettes", e);
    }
  },

  addPalette: async (palette) => {
    const newPalette = { ...palette, id: generateId() };
    set((state) => ({
      palettes: [...state.palettes, newPalette]
    }));
    
    // Async save
    try {
      await fetch('http://localhost:3001/palettes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPalette)
      });
    } catch (e) {
      console.error("Failed to save palette", e);
    }
  },

  fetchPreferences: async () => {
      try {
        const response = await fetch('http://localhost:3001/preferences');
        if (response.ok) {
            const prefs = await response.json();
            // Merge preferences into theme (e.g. pageLayout)
            if (Object.keys(prefs).length > 0) {
                 set((state) => ({
                     theme: { ...state.theme, ...prefs }
                 }));
            }
        }
      } catch (e) {
          console.error("Failed to fetch preferences", e);
      }
  },

  savePreferences: async (prefs) => {
       // Optimistic update
      set((state) => ({
          theme: { ...state.theme, ...prefs }
      }));

      // In a real app we might want to debounce this or only save specific fields
      // For now, we save the entire "theme" part that constitutes preferences
      const state = get();
      const newTheme = { ...state.theme, ...prefs };
      
      try {
          await fetch('http://localhost:3001/preferences', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(newTheme) // We essentially save the theme as prefs
          });
      } catch (e) {
          console.error("Failed to save preferences", e);
      }
  },

  getColorForType: (type: WordGroupType) => {
    const state = get();
    const activePalette = state.palettes.find(p => p.id === state.theme.activePaletteId) || DEFAULT_PALETTE;
    if (type === 'custom') {
      return activePalette.colors.custom[0] || '#777777';
    }
    return activePalette.colors[type] || '#777777';
  },

  getColorForAnecdote: (type: AnecdoteType) => {
    const state = get();
    const activePalette = state.palettes.find(p => p.id === state.theme.activePaletteId) || DEFAULT_PALETTE;
    return activePalette.colors[type] || '#f3f4f6';
  },

  setProjectState: (projectState) => {
    // Migration: handle old format projects
    const migratedState = migrateProjectState(projectState);
    set({
      ...migratedState,
      selectionMode: 'none',
      selectedElementId: null,
      selectedElementType: null,
      highlightSelection: { frenchIds: [], englishIds: [], lineId: null },
      wordGroupSelection: { wordIds: [], lineId: null, language: null, startIndex: null },
      arrowCreation: { sourceGroupIds: [], targetGroupIds: [], isSelectingTarget: false, lastInteractedGroupId: null }
    });
  },

  // Project Management Actions
  fetchProjects: async () => {
    try {
      const response = await fetch('http://localhost:3001/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      return await response.json();
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  },

  saveProject: async (name: string) => {
    const state = get();
    const projectData = {
      metadata: state.metadata,
      pages: state.pages,
      highlights: state.highlights,
      wordGroups: state.wordGroups,
      arrows: state.arrows,
      sidebars: state.sidebars,
      theme: state.theme,
      palettes: state.palettes
    };

    try {
      const response = await fetch('http://localhost:3001/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, data: projectData })
      });
      if (!response.ok) throw new Error('Failed to save project');
    } catch (error) {
      console.error('Error saving project:', error);
      throw error;
    }
  },

  loadProject: async (name: string) => {
    try {
      const response = await fetch(`http://localhost:3001/projects/${name}`);
      if (!response.ok) throw new Error('Failed to load project');
      const data = await response.json();
      get().setProjectState(data);
    } catch (error) {
      console.error('Error loading project:', error);
      throw error;
    }
  },

  importFromCSV: (csvString) => {
    Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[];
        const allLines: LineData[] = rows.map((row, index) => ({
          id: generateId(),
          lineNumber: index + 1,
          frenchText: row['French'] || row['lines-fr'] || '', // Added alias for better compatibility
          englishText: row['English'] || row['lines-en'] || '', // Added alias
          type: row['Type'] || '',
          note: row['Note'] || ''
        }));

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

        set({ pages, highlights: [], wordGroups: [], arrows: [], sidebars: [] });
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

    set({ pages, highlights: [], wordGroups: [], arrows: [], sidebars: [] });
  },

  removeLine: (pageId, lineId) => set((state) => ({
    pages: state.pages.map(p => {
      if (p.id !== pageId) return p;
      return {
        ...p,
        lines: p.lines.filter(l => l.id !== lineId)
      };
    })
  })),

  updatePage: (id, updates) => set((state) => ({
    pages: state.pages.map(p => p.id === id ? { ...p, ...updates } : p)
  })),

  setSelectedElement: (id, type) => set({ selectedElementId: id, selectedElementType: type }),

  // Word Group Selection actions
  startWordGroupSelection: (wordId, wordIndex, lineId, language) => set({
    wordGroupSelection: {
      wordIds: [wordId],
      lineId,
      language,
      startIndex: wordIndex
    }
  }),

  extendWordGroupSelection: (_wordId, wordIndex) => set((state) => {
    const { wordGroupSelection } = state;
    if (!wordGroupSelection.lineId || wordGroupSelection.startIndex === null) {
      return state;
    }

    // Build range of word IDs from start to current
    const startIdx = wordGroupSelection.startIndex;
    const endIdx = wordIndex;
    const minIdx = Math.min(startIdx, endIdx);
    const maxIdx = Math.max(startIdx, endIdx);

    // We need to generate the word IDs for the range
    // Word IDs follow the pattern: `${lineId}-${language}-${idx}`
    const wordIds: string[] = [];
    for (let i = minIdx; i <= maxIdx; i++) {
      wordIds.push(`${wordGroupSelection.lineId}-${wordGroupSelection.language}-${i}`);
    }

    return {
      wordGroupSelection: {
        ...wordGroupSelection,
        wordIds
      }
    };
  }),

  confirmWordGroupSelection: () => {
    const state = get();
    const { wordGroupSelection, selectedColor, selectedWordType } = state;
    
    if (wordGroupSelection.wordIds.length === 0 || !wordGroupSelection.lineId || !wordGroupSelection.language) {
      return;
    }

    const newGroup: Omit<WordGroup, 'id'> = {
      wordIds: wordGroupSelection.wordIds,
      lineId: wordGroupSelection.lineId,
      language: wordGroupSelection.language,
      type: selectedWordType,
      color: selectedColor
    };

    set((s) => ({
      wordGroups: [...s.wordGroups, { ...newGroup, id: generateId() }],
      wordGroupSelection: { wordIds: [], lineId: null, language: null, startIndex: null }
    }));
  },

  clearWordGroupSelection: () => set({
    wordGroupSelection: { wordIds: [], lineId: null, language: null, startIndex: null }
  }),

  // Arrow creation actions
  startArrowFromGroup: (groupId) => set({
    arrowCreation: {
      sourceGroupIds: [groupId],
      targetGroupIds: [],
      isSelectingTarget: true,
      lastInteractedGroupId: groupId
    }
  }),

  addArrowSourceGroup: (groupId) => set((state) => ({
    arrowCreation: {
      ...state.arrowCreation,
      sourceGroupIds: [...state.arrowCreation.sourceGroupIds, groupId],
      lastInteractedGroupId: groupId
    }
  })),

  addArrowTargetGroup: (groupId) => set((state) => ({
    arrowCreation: {
      ...state.arrowCreation,
      targetGroupIds: [...state.arrowCreation.targetGroupIds, groupId],
      lastInteractedGroupId: groupId
    }
  })),

  confirmArrowCreation: (styleTemplate) => {
    const state = get();
    const { arrowCreation, selectedColor } = state;

    if (arrowCreation.sourceGroupIds.length === 0 || arrowCreation.targetGroupIds.length === 0) {
      return;
    }

    const newArrow: Omit<ArrowConnector, 'id'> = {
      sourceGroupIds: arrowCreation.sourceGroupIds,
      targetGroupIds: arrowCreation.targetGroupIds,
      color: selectedColor,
      style: 'solid',
      strokeWidth: 2,
      headStyle: 'arrow',
      curvature: 0.5,
      ...styleTemplate // Allow overriding defaults with template
    };

    set((s) => ({
      arrows: [...s.arrows, { ...newArrow, id: generateId() }],
      arrowCreation: { sourceGroupIds: [], targetGroupIds: [], isSelectingTarget: false, lastInteractedGroupId: null }
    }));
  },

  confirmArrowTarget: (targetGroupIds) => { 
      const state = get();
      // Just add target, let component handle the "Ready" state to show menu
      state.addArrowTargetGroup(targetGroupIds[0]); 
  },

  cancelArrowCreation: () => set({
    arrowCreation: { sourceGroupIds: [], targetGroupIds: [], isSelectingTarget: false, lastInteractedGroupId: null }
  }),

  // Legacy highlight selection
  addToHighlightSelection: (wordId, lang, lineId) => set((state) => {
    const isNewContext = state.highlightSelection.lineId && state.highlightSelection.lineId !== lineId;
    const current = isNewContext ? { frenchIds: [], englishIds: [], lineId: null } : state.highlightSelection;

    const newSelection = {
      frenchIds: lang === 'french' ? [...current.frenchIds, wordId] : current.frenchIds,
      englishIds: lang === 'english' ? [...current.englishIds, wordId] : current.englishIds,
      lineId: lineId
    };

    return { highlightSelection: newSelection };
  }),

  clearHighlightSelection: () => set({ highlightSelection: { frenchIds: [], englishIds: [], lineId: null } }),

  // Linked Pairs Implementation
  addLinkedPair: (pair) => set((state) => ({
    linkedPairs: [...state.linkedPairs, { ...pair, id: generateId() }]
  })),

  removeLinkedPair: (id) => set((state) => ({
    linkedPairs: state.linkedPairs.filter(p => p.id !== id)
  })),

  updateLinkedPair: (id, updates) => set((state) => ({
    linkedPairs: state.linkedPairs.map(p => p.id === id ? { ...p, ...updates } : p)
  })),

  syncLinkedStyles: (sourceWordId, styles) => set((state) => {
    // Find pairs containing this word
    const affectedPairs = state.linkedPairs.filter(p => p.sourceWordIds.includes(sourceWordId) || p.targetWordIds.includes(sourceWordId));
    
    if (affectedPairs.length === 0) return state;

    // Deep copy pages to update styles
    const newPages = [...state.pages];

    affectedPairs.forEach(pair => {
       // Determine target words (if source is in sourceWords, target is targetWords, and vice versa)
       // This logic assumes 1-to-1 or Group-to-Group style syncing
       // For simplicity, we apply the style to ALL words in the pair, or just the counterparts?
       // Let's apply to counterparts.
       
       const isSource = pair.sourceWordIds.includes(sourceWordId);
       const targetIds = isSource ? pair.targetWordIds : pair.sourceWordIds;
       const lineId = pair.lineId;

       // Find line
       const pageIndex = newPages.findIndex(p => p.lines.some(l => l.id === lineId));
       if (pageIndex === -1) return;

       const page = { ...newPages[pageIndex] };
       const lineIndex = page.lines.findIndex(l => l.id === lineId);
       const line = { ...page.lines[lineIndex] };

       // Update styles for target words
       // We need to merge styles or replace? Replace for now (syncing)
       const targetLang = isSource ? 'english' : 'french'; // Assumption based on standard pair structure
       const currentStyles = targetLang === 'french' ? (line.frenchStyles || []) : (line.englishStyles || []);
       
       let updatedStyles = [...currentStyles];
       
       targetIds.forEach(targetId => {
          // Remove existing style for this word
          updatedStyles = updatedStyles.filter(s => s.wordId !== targetId);
          // Add new style
          updatedStyles.push({ ...styles[0], wordId: targetId }); // Assuming single style object per word for now
       });

       if (targetLang === 'french') {
         line.frenchStyles = updatedStyles;
       } else {
         line.englishStyles = updatedStyles;
       }

       page.lines[lineIndex] = line;
       newPages[pageIndex] = page;
    });

    return { pages: newPages };
  })
}));

// Migration function to handle old project format
function migrateProjectState(state: any): ProjectState {
  const migrated = { ...state };

  // Ensure wordGroups exists
  if (!migrated.wordGroups) {
    migrated.wordGroups = [];
  }

  // Ensure palettes exists
  if (!migrated.palettes || migrated.palettes.length === 0) {
    migrated.palettes = [DEFAULT_PALETTE];
  }

  // Migrate old arrows (startElementId/endElementId -> sourceGroupIds/targetGroupIds)
  if (migrated.arrows) {
    migrated.arrows = migrated.arrows.map((arrow: any) => {
      if (arrow.startElementId && !arrow.sourceGroupIds) {
        // Old format: single word connections
        // For now, keep legacy fields and add empty new fields
        // Full migration would require creating word groups for single words
        return {
          ...arrow,
          sourceGroupIds: [],
          targetGroupIds: [],
          style: arrow.style || 'solid',
          strokeWidth: arrow.strokeWidth || 2,
          headStyle: arrow.headStyle || 'arrow'
        };
      }
      return arrow;
    });
  }

  // Migrate old pages format (lines array at root)
  if (migrated.lines && Array.isArray(migrated.lines) && !migrated.pages) {
    const allLines = migrated.lines;
    const linesPerPage = 25;
    const pages = [];
    for (let i = 0; i < allLines.length; i += linesPerPage) {
      pages.push({
        id: `migrated-page-${i}`,
        lines: allLines.slice(i, i + linesPerPage)
      });
    }
    if (pages.length === 0) {
      pages.push({ id: 'migrated-page-empty', lines: [] });
    }
    migrated.pages = pages;
    delete migrated.lines;
  }

  return migrated as ProjectState;
}
