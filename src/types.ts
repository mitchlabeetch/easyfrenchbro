export type Language = 'french' | 'english';
export type LayoutMode = 'side-by-side' | 'interlinear';
export type SectionType = 'title' | 'paragraph' | 'note' | 'list' | 'heading';
export type ViewMode = 'single' | 'spread' | 'continuous';

// ─────────────────────────────────────────────────────────────
// PROJECT METADATA & BOOK STRUCTURE
// ─────────────────────────────────────────────────────────────

export interface ProjectMetadata {
  title: string;
  author: string;
  difficultyLevel: string;
  year: number;
  // NEW: Extended book metadata
  subtitle?: string;
  publisher?: string;
  isbn?: string;
  language?: string;
  targetLanguage?: string;
}

// For the project list view
export interface ProjectSummary {
  name: string;
  updatedAt: string;
}

// NEW: Book Front/Back Matter
export interface FrontMatter {
  titlePage?: boolean;
  copyrightPage?: boolean;
  tableOfContents?: boolean;
  dedication?: string;
  preface?: string;
}

export interface BackMatter {
  glossary?: boolean;
  index?: boolean;
  acknowledgments?: string;
  aboutAuthor?: string;
}

// NEW: Chapter Structure
export interface Chapter {
  id: string;
  title: string;
  pageIds: string[]; // References to PageData ids
  startingPageNumber?: number;
}

export interface BookStructure {
  frontMatter: FrontMatter;
  chapters: Chapter[];
  backMatter: BackMatter;
}

// ─────────────────────────────────────────────────────────────
// WORD-LEVEL DATA (UUID-Based)
// ─────────────────────────────────────────────────────────────

// NEW: Individual word with stable UUID
export interface WordData {
  id: string; // UUID - stable across edits
  text: string;
  index: number; // Current position (mutable)
}

// NEW: Rich Text Styling
export interface TextStyle {
  wordId: string; // The ID of the word this style applies to
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  color?: string; // Text color override
  backgroundColor?: string; // Highlight color
}

// ─────────────────────────────────────────────────────────────
// CONTENT TYPES (Polymorphic Blocks)
// ─────────────────────────────────────────────────────────────

export type ContentType = 'text' | 'image' | 'table' | 'divider' | 'callout';

// Base content interface
export interface BaseContent {
  id: string;
  type: ContentType;
  lineNumber?: number;
  manualLineNumber?: number; // Override auto-numbering
  skipNumbering?: boolean; // Exclude from line count
}

// Text content (bilingual line)
export interface TextContent extends BaseContent {
  type: 'text';
  frenchText: string;
  englishText: string;
  frenchWords?: WordData[]; // NEW: Structured words with UUIDs
  englishWords?: WordData[];
  frenchStyles?: TextStyle[];
  englishStyles?: TextStyle[];
  sectionType?: SectionType;
  note?: string;
}

// Image content
export interface ImageContent extends BaseContent {
  type: 'image';
  src: string; // '/assets/image.png' or full path
  alt: string;
  width?: string; // e.g., '100%', '150mm'
  height?: string;
  caption?: string;
  captionFrench?: string;
  alignment?: 'left' | 'center' | 'right';
}

// Table content
export interface TableContent extends BaseContent {
  type: 'table';
  headers: string[];
  rows: string[][];
  caption?: string;
  captionFrench?: string;
  borderStyle?: 'solid' | 'dashed' | 'none';
}

// Divider content
export interface DividerContent extends BaseContent {
  type: 'divider';
  dividerStyle: 'line' | 'dots' | 'ornament' | 'asterisks' | 'fleuron';
  spacing?: string; // e.g., '10mm'
}

// Callout/Stamp content
export type CalloutType = 'grammar' | 'culture' | 'falseFriend' | 'pronunciation' | 'note' | 'spoken' | 'vocab' | 'history' | 'background';

export interface CalloutContent extends BaseContent {
  type: 'callout';
  calloutType: CalloutType;
  title: string;
  content: string;
  icon?: string;
  color?: string; // Override default color
}

// Union type for all content
export type PageContent = TextContent | ImageContent | TableContent | DividerContent | CalloutContent;

// Legacy LineData (for backwards compatibility, maps to TextContent)
export interface LineData {
  id: string;
  frenchText: string;
  englishText: string;
  lineNumber: number;
  type?: string;
  note?: string;
  frenchStyles?: TextStyle[];
  englishStyles?: TextStyle[];
  sectionType?: SectionType;
  // NEW: UUID-based words
  frenchWords?: WordData[];
  englishWords?: WordData[];
  // NEW: Line numbering control
  manualLineNumber?: number;
  skipNumbering?: boolean;
  restartNumberingAt?: number;
}

// ─────────────────────────────────────────────────────────────
// PAGE-LEVEL DATA
// ─────────────────────────────────────────────────────────────

export interface PageData {
  id: string;
  lines: LineData[];
  content?: PageContent[]; // NEW: Mixed content support
  splitRatio?: number; // 0.1 to 0.9, overrides theme default
  // NEW: Page-level settings
  overrideMargins?: PageMargins;
  pageNumber?: number; // Explicit page number
  isBlank?: boolean; // Intentionally blank page
  chapterId?: string; // Which chapter this page belongs to
  // NEW: Line numbering
  lineNumberingStart?: number; // Restart numbering at this value
  showLineNumbers?: boolean;
}

// Legacy highlight (kept for backwards compatibility)
export interface SpanHighlight {
  id: string;
  colorCode: string;
  frenchWordIds: string[];
  englishWordIds: string[];
  associatedLineId: string;
}

// ─────────────────────────────────────────────────────────────
// WORD GROUPS & ANNOTATIONS
// ─────────────────────────────────────────────────────────────

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
  wordIds: string[]; // IDs of words in this group (UUIDs)
  lineId: string;
  language: Language;
  type?: WordGroupType;
  color: string;
  label?: string;
  anecdoteType?: AnecdoteType;
}

// ─────────────────────────────────────────────────────────────
// ARROWS & CONNECTORS
// ─────────────────────────────────────────────────────────────

export type ArrowStyle = 'solid' | 'dashed' | 'dotted';
export type ArrowHeadStyle = 'arrow' | 'none' | 'dot' | 'diamond';

export interface ArrowConnector {
  id: string;
  sourceGroupIds: string[];
  targetGroupIds: string[];
  // Legacy support
  startElementId?: string;
  endElementId?: string;
  // Styling
  color: string;
  style: ArrowStyle;
  strokeWidth: number;
  headStyle: ArrowHeadStyle;
  curvature: number;
  label?: string;
  startAnchor?: 'top' | 'bottom' | 'left' | 'right' | 'middle' | 'auto';
  endAnchor?: 'top' | 'bottom' | 'left' | 'right' | 'middle' | 'auto';
}

// ─────────────────────────────────────────────────────────────
// SIDEBAR / ANECDOTES
// ─────────────────────────────────────────────────────────────

export type AnecdoteType = 'grammar' | 'spoken' | 'history' | 'falseFriend' | 'pronunciation' | 'vocab';

export interface SidebarCard {
  id: string;
  type: AnecdoteType;
  content: string;
  anchoredLineId: string;
  color?: string;
  // NEW: Enhanced styling
  title?: string;
  icon?: string;
}

// Stamp template for quick insertion
export interface StampTemplate {
  id: string;
  name: string;
  type: AnecdoteType | CalloutType;
  icon: string;
  headerColor: string;
  backgroundColor: string;
  defaultContent?: string;
}

// ─────────────────────────────────────────────────────────────
// COLOR PALETTES
// ─────────────────────────────────────────────────────────────

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
    custom: string[];
  };
  isDefault?: boolean;
}

// ─────────────────────────────────────────────────────────────
// PAGE LAYOUT & PRINT SETTINGS
// ─────────────────────────────────────────────────────────────

export type PageSize = 
  | 'A4' | 'A3' | 'A5' | 'A6' | 'A7' 
  | 'B4' | 'B5' 
  | 'Letter' | 'Legal' | 'Tabloid' | 'Executive' | 'Statement' | 'HalfLetter'
  | 'TradeBook' // 6" x 9" - US standard novel
  | 'Custom';

export type PageOrientation = 'portrait' | 'landscape';

export interface PageMargins {
  top: string; // e.g., '25mm' or '1in'
  right: string;
  bottom: string;
  left: string;
}

// NEW: Print-specific page layout
export interface PageLayout {
  size: PageSize;
  width: string; // e.g., '210mm', '6in'
  height: string;
  margins: PageMargins;
  orientation: PageOrientation;
  splitRatio?: number;
  // NEW: Gutter & Mirror Margins for book binding
  gutter?: string; // Additional binding margin, e.g., '15mm'
  mirrorMargins?: boolean; // Swap left/right margins for facing pages
  // NEW: Bleed for professional printing
  bleed?: string; // e.g., '3mm'
}

// NEW: Typography settings
export interface TypographySettings {
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  hyphens?: 'none' | 'auto' | 'manual';
  orphans?: number; // Minimum lines at bottom of page
  widows?: number;  // Minimum lines at top of page
  letterSpacing?: string;
  wordSpacing?: string;
}

// NEW: Header/Footer templates
export interface HeaderFooterTemplate {
  left: string; // Placeholders: {{pageNumber}}, {{chapterTitle}}, {{bookTitle}}, etc.
  center: string;
  right: string;
  font?: string;
  fontSize?: string;
  showOnFirstPage?: boolean;
}

export interface PageTemplate {
  header?: HeaderFooterTemplate;
  footer?: HeaderFooterTemplate;
  alternateForEvenPages?: boolean; // Mirror header/footer for facing pages
}

// ─────────────────────────────────────────────────────────────
// EXPORT SETTINGS
// ─────────────────────────────────────────────────────────────

export type ColorProfile = 'sRGB' | 'CMYK' | 'AdobeRGB';

export interface ExportSettings {
  format: 'pdf' | 'html' | 'png' | 'idml';
  quality: 'draft' | 'standard' | 'high'; // 72, 150, 300 DPI
  bleed?: string;
  showCropMarks?: boolean;
  showRegistrationMarks?: boolean;
  colorProfile?: ColorProfile;
  // PDF-specific
  embedFonts?: boolean;
  compress?: boolean;
  // HTML-specific
  interactive?: boolean;
  responsive?: boolean;
}

// ─────────────────────────────────────────────────────────────
// LINKED PAIRS & SYNC
// ─────────────────────────────────────────────────────────────

export interface LinkedPair {
  id: string;
  lineId: string;
  sourceWordIds: string[]; // e.g. French words (UUIDs)
  targetWordIds: string[]; // e.g. English words (UUIDs)
}

// ─────────────────────────────────────────────────────────────
// THEME & UI CONFIGURATION
// ─────────────────────────────────────────────────────────────

export interface ThemeConfig {
  frenchFontFamily: string;
  englishFontFamily: string;
  fontSize: string;
  lineHeight: string;
  highlightColors: string[];
  pageLayout?: PageLayout;
  activePaletteId?: string;
  layoutMode: LayoutMode;
  pageBackground?: string;
  searchHighlight?: { 
    lineId: string; 
    language: 'french' | 'english'; 
    startIndex: number; 
    endIndex: number;
  } | null;
  // NEW: Extended typography
  typography?: TypographySettings;
  pageTemplate?: PageTemplate;
  // NEW: Print production settings
  printSettings?: {
    bleed?: string;
    showCropMarks?: boolean;
    showRegistrationMarks?: boolean;
    colorProfile?: ColorProfile;
    quality?: 'draft' | 'standard' | 'high';
  };
}

export interface UISettings {
  showFrench: boolean;
  showEnglish: boolean;
  focusMode: boolean;
  darkMode: boolean;
  // NEW: View options
  viewMode?: ViewMode;
  zoomLevel?: number;
  showLineNumbers?: boolean;
  showRulers?: boolean;
  showGutterGuides?: boolean;
}

// ─────────────────────────────────────────────────────────────
// TEMPLATES
// ─────────────────────────────────────────────────────────────

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
  typography?: TypographySettings;
}

export interface AnecdoteTemplateData {
  colors: Partial<Record<AnecdoteType, string>>;
}

export type TemplateData = ArrowTemplateData | LayoutTemplateData | AnecdoteTemplateData;

export interface Template {
  id: string;
  name: string;
  type: 'layout' | 'arrow' | 'project' | 'anecdote';
  data: TemplateData;
}

// ─────────────────────────────────────────────────────────────
// SNIPPET LIBRARY
// ─────────────────────────────────────────────────────────────

export type SnippetType = 'callout' | 'divider' | 'table' | 'image' | 'stamp';

export interface Snippet {
  id: string;
  name: string;
  type: SnippetType;
  preview: string; // HTML preview or icon
  content: PageContent; // The actual content to insert
}

// ─────────────────────────────────────────────────────────────
// FOOTNOTES
// ─────────────────────────────────────────────────────────────

export interface Footnote {
  id: string;
  number: number;
  wordId: string; // Which word this footnote is attached to
  lineId: string;
  content: string;
  pageId?: string; // For page-based numbering
}

// ─────────────────────────────────────────────────────────────
// PROJECT STATE
// ─────────────────────────────────────────────────────────────

export interface ProjectState {
  metadata: ProjectMetadata;
  pages: PageData[];
  highlights: SpanHighlight[]; // Legacy
  wordGroups: WordGroup[];
  arrows: ArrowConnector[];
  sidebars: SidebarCard[];
  theme: ThemeConfig;
  palettes: ColorPalette[];
  linkedPairs: LinkedPair[];
  templates: Template[];
  uiSettings: UISettings;
  // NEW: Book structure
  bookStructure?: BookStructure;
  snippets?: Snippet[];
  footnotes?: Footnote[];
  exportSettings?: ExportSettings;
  // NEW: Stamp templates
  stampTemplates?: StampTemplate[];
}

// ─────────────────────────────────────────────────────────────
// PREDEFINED STAMP TEMPLATES
// ─────────────────────────────────────────────────────────────

export const DEFAULT_STAMP_TEMPLATES: StampTemplate[] = [
  {
    id: 'stamp-false-friend',
    name: 'FALSE FRIEND',
    type: 'falseFriend',
    icon: '⚠️',
    headerColor: '#dc2626',
    backgroundColor: '#fef2f2',
    defaultContent: 'Beware! This word looks similar but means something different...'
  },
  {
    id: 'stamp-grammar',
    name: 'GRAMMAR',
    type: 'grammar',
    icon: '📖',
    headerColor: '#2563eb',
    backgroundColor: '#eff6ff',
    defaultContent: 'Grammar note...'
  },
  {
    id: 'stamp-culture',
    name: 'CULTURE',
    type: 'culture',
    icon: '🏛️',
    headerColor: '#7c3aed',
    backgroundColor: '#f5f3ff',
    defaultContent: 'Cultural context...'
  },
  {
    id: 'stamp-pronunciation',
    name: 'PRONUNCIATION',
    type: 'pronunciation',
    icon: '🔊',
    headerColor: '#059669',
    backgroundColor: '#ecfdf5',
    defaultContent: 'Pronunciation tip...'
  },
  {
    id: 'stamp-spoken',
    name: 'SPOKEN FRENCH',
    type: 'spoken',
    icon: '💬',
    headerColor: '#ea580c',
    backgroundColor: '#fff7ed',
    defaultContent: 'In everyday speech...'
  },
  {
    id: 'stamp-vocab',
    name: 'VOCABULARY',
    type: 'vocab',
    icon: '📝',
    headerColor: '#0891b2',
    backgroundColor: '#ecfeff',
    defaultContent: 'Related vocabulary...'
  },
  {
    id: 'stamp-background',
    name: 'A LITTLE BACKGROUND',
    type: 'background',
    icon: '📚',
    headerColor: '#854d0e',
    backgroundColor: '#fefce8',
    defaultContent: 'Historical or contextual background...'
  },
  {
    id: 'stamp-history',
    name: 'HISTORY',
    type: 'history',
    icon: '🏰',
    headerColor: '#831843',
    backgroundColor: '#fdf2f8',
    defaultContent: 'Historical note...'
  }
];

// ─────────────────────────────────────────────────────────────
// PAGE SIZE DIMENSIONS (in mm)
// ─────────────────────────────────────────────────────────────

export const PAGE_SIZES: Record<PageSize, { width: string; height: string }> = {
  'A4': { width: '210mm', height: '297mm' },
  'A3': { width: '297mm', height: '420mm' },
  'A5': { width: '148mm', height: '210mm' },
  'A6': { width: '105mm', height: '148mm' },
  'A7': { width: '74mm', height: '105mm' },
  'B4': { width: '250mm', height: '353mm' },
  'B5': { width: '176mm', height: '250mm' },
  'Letter': { width: '215.9mm', height: '279.4mm' }, // 8.5" x 11"
  'Legal': { width: '215.9mm', height: '355.6mm' },  // 8.5" x 14"
  'Tabloid': { width: '279.4mm', height: '431.8mm' }, // 11" x 17"
  'Executive': { width: '184.15mm', height: '266.7mm' }, // 7.25" x 10.5"
  'Statement': { width: '139.7mm', height: '215.9mm' },  // 5.5" x 8.5"
  'HalfLetter': { width: '139.7mm', height: '215.9mm' }, // 5.5" x 8.5"
  'TradeBook': { width: '152.4mm', height: '228.6mm' },  // 6" x 9" - Standard US book
  'Custom': { width: '210mm', height: '297mm' } // Default to A4
};
