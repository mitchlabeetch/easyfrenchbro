export type Language = 'french' | 'english';

export interface ProjectMetadata {
  title: string;
  author: string;
  difficultyLevel: string;
  year: number;
}

export interface LineData {
  id: string;
  frenchText: string;
  englishText: string;
  lineNumber: number;
}

export interface SpanHighlight {
  id: string;
  colorCode: string;
  frenchWordIds: string[]; // Changed to store word IDs for easier token matching
  englishWordIds: string[];
  associatedLineId: string;
}

export interface ArrowConnector {
  id: string;
  startElementId: string;
  endElementId: string;
  color: string;
  curvature: number; // 0 to 1
  label?: string;
  startAnchor?: "top" | "bottom" | "left" | "right" | "middle" | "auto";
  endAnchor?: "top" | "bottom" | "left" | "right" | "middle" | "auto";
}

export type SidebarCardType = 'grammar' | 'culture' | 'vocab';

export interface SidebarCard {
  id: string;
  type: SidebarCardType;
  content: string;
  anchoredLineId: string;
}

export interface ThemeConfig {
  frenchFontFamily: string;
  englishFontFamily: string;
  fontSize: string;
  lineHeight: string;
  highlightColors: string[];
}

export interface ProjectState {
  metadata: ProjectMetadata;
  lines: LineData[];
  highlights: SpanHighlight[];
  arrows: ArrowConnector[];
  sidebars: SidebarCard[];
  theme: ThemeConfig;
}
