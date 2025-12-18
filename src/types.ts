export type Language = 'french' | 'english';
export type LayoutMode = 'side-by-side' | 'interlinear';
export type SectionType = 'title' | 'paragraph' | 'note' | 'list' | 'heading';

export interface ProjectMetadata {
  title: string;
  author: string;
  difficultyLevel: string;
  year: number;
}

// For the project list view
export interface ProjectSummary {
  name: string;
  updatedAt: string;
}

// NEW: Rich Text Styling
export interface TextStyle {
  wordId: string; // The ID of the word this style applies to
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
}

export interface LineData {
  id: string;
  frenchText: string;
  englishText: string;
  lineNumber: number;
  type?: string;
  note?: string;
  // NEW: Store styles for words in this line
  frenchStyles?: TextStyle[];
  englishStyles?: TextStyle[];
  sectionType?: SectionType;
}

export interface PageData {
  id: string;
  lines: LineData[];
  splitRatio?: number; // 0.1 to 0.9, overrides theme default
}

// Legacy highlight (kept for backwards compatibility)
export interface SpanHighlight {
  id: string;
  colorCode: string;
  frenchWordIds: string[];
  englishWordIds: string[];
  associatedLineId: string;
}

// NEW: Word Group - represents multiple consecutive words as one unit
export type WordGroupType =
  | 'subject'
  | 'verb'
  | 'complement'
  | 'article'
  | 'adjective'
  | 'adverb'
  | 'custom';

export interface WordGroup {
  id: string;
  wordIds: string[]; // IDs of words in this group
  lineId: string; // Which line this group belongs to
  language: Language;
  type?: WordGroupType; // For quick coloring based on grammar role
  color: string; // Underline/highlight color
  label?: string; // Optional label (e.g., "subject", "S1")
  anecdoteType?: AnecdoteType; // For anecdote categorization
}

// ENHANCED: Arrow Connector - connects word groups, not individual words
export type ArrowStyle = 'solid' | 'dashed' | 'dotted';
export type ArrowHeadStyle = 'arrow' | 'none' | 'dot' | 'diamond';

export interface ArrowConnector {
  id: string;
  // NEW: Support for group-based connections (one-to-many, many-to-one)
  sourceGroupIds: string[]; // Can connect from multiple groups
  targetGroupIds: string[]; // Can connect to multiple groups
  // Legacy support (for migration)
  startElementId?: string;
  endElementId?: string;
  // Styling
  color: string;
  style: ArrowStyle;
  strokeWidth: number;
  headStyle: ArrowHeadStyle;
  curvature: number; // 0 = minimal curve, 1 = max curve below text
  label?: string;
  // Legacy anchors (deprecated but kept for migration)
  startAnchor?: 'top' | 'bottom' | 'left' | 'right' | 'middle' | 'auto';
  endAnchor?: 'top' | 'bottom' | 'left' | 'right' | 'middle' | 'auto';
}

// NEW: Anecdote Types
export type AnecdoteType = 'grammar' | 'spoken' | 'history' | 'falseFriend' | 'pronunciation' | 'vocab';

export interface SidebarCard {
  id: string;
  type: AnecdoteType;
  content: string;
  anchoredLineId: string;
  // New: visual customization
  color?: string; 
}

// NEW: Savable Color Palette
export interface ColorPalette {
  id: string;
  name: string;
  colors: {
    // Word Groups (6)
    subject: string;
    verb: string;
    complement: string;
    article: string;
    adjective: string;
    adverb: string;
    
    // Text Color (1)
    text: string;

    // Anecdotes (6)
    grammar: string;
    spoken: string;
    history: string;
    falseFriend: string;
    pronunciation: string;
    vocab: string;

    custom: string[]; // Additional custom colors
  };
  isDefault?: boolean;
}

// NEW: Page Layout Settings
export type PageSize = 'A4' | 'A3' | 'A5' | 'A6' | 'A7' | 'B4' | 'B5' | 'Letter' | 'Legal' | 'Tabloid' | 'Executive' | 'Statement' | 'HalfLetter' | 'Custom';
export type PageOrientation = 'portrait' | 'landscape';

export interface PageMargins {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

export interface PageLayout {
  size: PageSize;
  width: string; // e.g., '210mm'
  height: string; // e.g., '297mm'
  margins: PageMargins;
  orientation: PageOrientation;
  // NEW: Split ratio for the separation line (0.1 to 0.9, default 0.5)
  splitRatio?: number;
}

// NEW: Linked Pair (Text Equivalents)
export interface LinkedPair {
  id: string;
  lineId: string;
  sourceWordIds: string[]; // e.g. French words
  targetWordIds: string[]; // e.g. English words
  // Logic: if you edit style of one, it syncs to other
}

export interface ThemeConfig {
  frenchFontFamily: string;
  englishFontFamily: string;
  fontSize: string;
  lineHeight: string;
  highlightColors: string[];
  // NEW: Extended theme settings
  pageLayout?: PageLayout;
  activePaletteId?: string;
  layoutMode: LayoutMode;
  pageBackground?: string; // Page background color (N24)
  searchHighlight?: { lineId: string; language: 'french' | 'english'; startIndex: number; endIndex: number } | null; // N14
}

// NEW: UI Settings
export interface UISettings {
  showFrench: boolean;
  showEnglish: boolean;
  focusMode: boolean;
  darkMode: boolean;
}

// Template Data Types
export interface ArrowTemplateData {
  style: ArrowStyle;
  headStyle: ArrowHeadStyle;
  color: string;
  strokeWidth: number;
  curvature: number;
}

export interface LayoutTemplateData {
  pageLayout?: PageLayout;
  fontSize?: string;
  lineHeight?: string;
  frenchFontFamily?: string;
  englishFontFamily?: string;
  layoutMode?: LayoutMode;
}

export interface AnecdoteTemplateData {
  colors: Partial<Record<AnecdoteType, string>>;
}

export type TemplateData = ArrowTemplateData | LayoutTemplateData | AnecdoteTemplateData;

// Template Interface
export interface Template {
  id: string;
  name: string;
  type: 'layout' | 'arrow' | 'project' | 'anecdote';
  data: TemplateData;
}

export interface ProjectState {
  metadata: ProjectMetadata;
  pages: PageData[];
  highlights: SpanHighlight[]; // Legacy, kept for backwards compatibility
  wordGroups: WordGroup[]; // NEW
  arrows: ArrowConnector[];
  sidebars: SidebarCard[];
  theme: ThemeConfig;
  palettes: ColorPalette[]; // NEW
  linkedPairs: LinkedPair[]; // NEW
  templates: Template[]; // NEW
  uiSettings: UISettings; // NEW
}
