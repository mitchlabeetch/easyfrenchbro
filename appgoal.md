# EasyFrenchBro - Comprehensive Application Goal & Architecture

> **Philosophy**: This document describes the "EasyFrenchBro" application with such precision that a developer could theoretically recreate the entire app exactly using only this file. It covers all features, layout structures, data models, expectations, goals, fallbacks, and internal calls.

---

## 1. Application Overview

**EasyFrenchBro** is a specialized bilingual text editing and study tool designed for creating "Interlinear" or "Side-by-Side" French-English language learning resources. It allows users to:

- Import or write bilingual texts.
- Align texts line-by-line.
- Group words grammatically (e.g., Subject, Verb) with color-coded underlines.
- Create visual connections (arrows) between word groups to explain syntax.
- Add educational anecdotes (grammar notes, cultural facts) linked to specific lines or words.
- Customize the visual presentation (colors, fonts, page sizes) deeply.
- Export the result as interactive HTML files or PDF/Print formats.

## 2. Technology Stack & Architecture

- **Core**: React 18, TypeScript, Vite.
- **Styling**: TailwindCSS (utility-first), clsx (conditional classes).
- **State Management**: Zustand (Global store, history support).
- **Icons**: Lucide React.
- **Data Persistence**: JSON Server (localhost:3001) for Projects/Palettes, plus browser print/file export.
- **Routing**: Internal state-based routing (`Dashboard` vs `Workspace` views).

---

## 3. Data Models (`types.ts`)

The application state is monolithic and managed via a single `ProjectState` interface.

### 3.1. Primitives

- **Language**: `'french' | 'english'`
- **LayoutMode**: `'side-by-side' | 'interlinear'`
- **WordGroupType**: `'subject' | 'verb' | 'complement' | 'article' | 'adjective' | 'adverb' | 'custom'`
- **AnecdoteType**: `'grammar' | 'spoken' | 'history' | 'falseFriend' | 'pronunciation' | 'vocab'`
- **ArrowStyle**: `'solid' | 'dashed' | 'dotted'`
- **ArrowHead**: `'arrow' | 'none' | 'dot' | 'diamond'`

### 3.2. Core Entities

#### **Project Metadata**

```typescript
interface ProjectMetadata {
  title: string;
  author: string;
  difficultyLevel: string; // e.g. "Intermediate"
  year: number;
}
```

#### **Page & Line Structure**

The app is purely page-based.

```typescript
interface PageData {
  id: string; // e.g., "page-uuid"
  lines: LineData[]; // Ordered list of content lines
  splitRatio?: number; // 0.1 - 0.9, overrides global defaults
}

interface LineData {
  id: string;
  frenchText: string;
  englishText: string;
  lineNumber: number;
  type?: string; // Legacy
  sectionType?: 'title' | 'paragraph' | 'note' | 'list' | 'heading'; // Controls visual rendering
  frenchStyles?: TextStyle[]; // Rich text (bold/italic) per word ID
  englishStyles?: TextStyle[];
}

interface TextStyle {
  wordId: string; // Index of the word in the line (e.g., "0", "1")
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
}
```

#### **Word Groups (Grammar Highlights)**

Contiguous sets of words (split by regex `/([a-zA-Z0-9À-ÿ'']+)/`) that share a grammatical role.

```typescript
interface WordGroup {
  id: string;
  wordIds: string[]; // Format: "{lineId}-{language}-{index}"
  lineId: string;
  language: Language;
  type?: WordGroupType;
  color: string; // Hex color
  label?: string; // Optional overlay label (e.g., "S1")
  anecdoteType?: AnecdoteType; // If used as a specialized note group
}
```

#### **Arrows (Visual Connectors)**

Bezier curves rendered in a separate SVG layer connecting word groups.

```typescript
interface ArrowConnector {
  id: string;
  sourceGroupIds: string[]; // Many-to-Many support
  targetGroupIds: string[];
  color: string;
  style: ArrowStyle;
  headStyle: ArrowHeadStyle;
  strokeWidth: number;
  curvature: number; // 0.0 to 2.0 (affects Bezier control point depth)
}
```

#### **Sidebars (Anecdotes)**

Cards that appear in the right margin (sidebar) or inline depending on layout.

```typescript
interface SidebarCard {
  id: string;
  type: AnecdoteType;
  content: string;
  anchoredLineId: string; // Linked to a specific line
  color?: string; // Overrides type default
}
```

#### **Theme & Customization**

```typescript
interface ThemeConfig {
  frenchFontFamily: string; // CSS font-family string
  englishFontFamily: string;
  fontSize: string; // e.g., "18px"
  lineHeight: string; // e.g., "1.6"
  activePaletteId?: string;
  layoutMode: LayoutMode;
  pageBackground?: string; // Hex color
  pageLayout?: PageLayout; // { size, margins, orientation }
}

interface ColorPalette {
  id: string;
  name: string;
  colors: Record<WordGroupType | AnecdoteType | 'text', string> & {
    custom: string[];
  };
  isDefault?: boolean;
}
```

---

## 4. State Management (`store.ts`)

The app uses `zustand` for a centralized store.

### Key Actions

- **Undo/Redo**: Implements a `HistorySnapshot` system (`MAX_HISTORY_SIZE = 50`) capturing the state of pages, groups, arrows, and styles. Triggered on almost every mutation.
- **Selection Modes**:
  - `none`: Standard editing (click to select objects).
  - `wordGroup`: Click/Shift+Click words to Create Group.
  - `arrow`: Click Source Group -> Click Target Group(s).
  - `highlight`: Legacy simple color highlighting.
- **Async Persistence**:
  - `saveProject(name)`: POST to `/projects`.
  - `loadProject(name)`: GET `/projects/:name`.
  - `fetchPalettes()`: GET `/palettes`.
- **Logic**:
  - `syncLinkedStyles`: Automatically propagates rich text styles between linked word pairs (e.g., if "cat" is linked to "chat", bolding one bolds the other).
  - `reflowPages(limit)`: Redistributes lines across pages based on a fixed limit.

---

## 5. Core Features & UX

### 5.1. Dashboard

- **Entry point**: Lists existing projects and templates.
- **Capabilities**: Create new project, Open existing, Delete project.

### 5.2. Workspace (Main Editor)

- **Layout**:
  - **Left Sidebar**: Global tools, File operations (Import CSV, Add Page), View toggles (Focus, Dark Mode), Raw Input editor.
  - **Center**: The "Paper" view. Renders `PageData`. Supports Zoom and Pan (Shift+Drag).
  - **Right**: Properties Panel (context-sensitive).
- **Page Rendering**:
  - **Side-by-Side**: French (left) / English (right) columns with a draggable split divider.
  - **Interlinear**: Alternating rows (French line above English line).
- **Line Interaction**:
  - **Reorder**: Drag-and-drop lines to reorder. Keyboard Alt+Up/Down to move selected line.
  - **Edit**: Double-click text to open `RichTextEditor` overlay.
  - **Menu**: Hover reveals buttons for "Add Anecdote", "TTS Speak", "Settings" (Change type: Title/Heading/Paragraph).

### 5.3. Word Interaction (`WordGroupRenderer`)

- **Tokenization**: Text is split by regex `/([a-zA-Z0-9À-ÿ'']+)/`. Punctuation/Spaces are preserved as separate tokens.
- **Grouping**:
  - Users select a range of words.
  - Resulting group gets a colored underline (`border-bottom`) and background tint.
  - Groups can be assigned a "Grammar Role" (Subject, Verb, etc.) which applies a color from the active Palette.
- **TTS**: Hovering a group reveals a small speaker icon to pronounce that specific text segment.

### 5.4. Arrows System (`CustomArrowLayer`)

- **Rendering**: Full-screen SVG overlay (`pointer-events: none` on container, `all` on paths).
- **Bezier Logic**: Arrows originate from the _bottom center_ of the source group and end at the _bottom center_ of the target group.
- **Curve**: Calculated to dip _below_ the text lines to avoid obscuring content. "Jitter" is added to prevent overlapping lines.
- **Interactivity**: Clicking an arrow selects it, opening the `PropertiesPanel` to edit curvature, style, or color.

### 5.5. Sidebar / Anecdotes

- **Creation**: Via the "Plus" icon on line hover.
- **Display**: In Side-by-Side mode, they appear in a dedicated right-side column relative to the line. In Interlinear, they stack below the line.
- **Types**: Grammar, Culture, False Friend, etc. (Color-coded).

### 5.6. Customization (`PropertiesPanel`)

- **Tabs**:
  - **Theme**: Fonts (Global), Font Size, Line Height, Zoom level.
  - **Page**: Paper size (A4, Letter, Custom), Margins, Orientation, Background Color.
  - **Palette**: thorough color editor for every word role and anecdote type. Supports creating new custom palettes.
  - **Templates**: Save current Arrows/Layouts/Colors as reusable templates.
- **Context Awareness**: If an element (Arrow or Word Group) is selected, the panel switches to "Edit Mode" for that specific object.

### 5.7. Export System (`ExportModal` & `htmlExport`)

- **Interactive HTML**:
  - Generates a single `.html` file containing all CSS/JS.
  - **Features**: Toggle Dark Mode, checkbox for "Hover Reveal" (blurs English until hovered), and proper responsive grid layout.
  - **Embedding**: JSON data is _not_ embedded; the HTML is statically generated with the current state baked into the DOM structure.
- **PDF/Print**: Triggers browser native print dialog. `@media print` CSS ensures UI elements (buttons, sidebars) are hidden and background colors are forced (if browser setting allowed).

### 5.8. Keyboard Shortcuts

- `Ctrl+S`: Save
- `Ctrl+Z` / `Ctrl+Y`: Undo / Redo
- `Ctrl+G`: Switch to "Group" mode
- `Ctrl+Shift+A`: Switch to "Arrow" mode
- `Ctrl+1` through `Ctrl+6`: Quick-select grammar type (Subject...Adverb)
- `Escape`: Cancel selection / Exit Focus mode
- `Alt + ArrowUp/Down`: Move selected line

---

## 6. Implementation specifics to replicate

1.  **Word IDs**: Must use deterministic IDs: `{lineId}-{lang}-{index}`. The index must seamlessly account for punctuation tokens to ensure stability.
2.  **Contiguous Highlighting**: When rendering tokens, if `token[i]` and `token[i+2]` (skipping space) are in the same group, the space `token[i+1]` must also be styled visually (underline) to appear continuous.
3.  **Arrow Offset**: When calculating Bezier paths, add a small random or index-based offset (`(index % 5) * 4`) to style distinct lines if multiple arrows connect the same groups.
4.  **Z-Index Layers**:
    - Base: Background
    - Level 1: Text lines
    - Level 2: Word Group Highlights (mix-blend-mode behavior simulated via opacity)
    - Level 10: SVG Arrow Layer
    - Level 20: UI overlays (menus, rich text editor)
    - Level 50: Modals

## 7. Known Fallbacks & behavior

- **Missing Project**: if `loadProject` fails, it alerts the user.
- **Empty Page**: Displays "No pages to display" centered text.
- **History Limit**: Max 50 steps. Oldest steps are dropped.
- **Browser Print**: Relies on user enabling "Background Graphics" in print dialog for colored underlines to show up on PDF.
