import { PageData, WordGroup, ArrowConnector, ThemeConfig, ColorPalette, SidebarCard, WordGroupType } from '../types';

interface ExportOptions {
  includeStyles: boolean;
  includeArrows: boolean;
  includeAnnotations: boolean;
  hoverReveal: boolean;
  responsiveDesign: boolean;
  theme: 'light' | 'dark' | 'auto';
}

const defaultOptions: ExportOptions = {
  includeStyles: true,
  includeArrows: true,
  includeAnnotations: true,
  hoverReveal: true,
  responsiveDesign: true,
  theme: 'auto'
};

/**
 * Generate interactive HTML export from project data
 */
export function generateInteractiveHTML(
  pages: PageData[],
  wordGroups: WordGroup[],
  arrows: ArrowConnector[],
  sidebars: SidebarCard[],
  theme: ThemeConfig,
  palette: ColorPalette,
  projectTitle: string,
  options: Partial<ExportOptions> = {}
): string {
  const opts = { ...defaultOptions, ...options };
  
  const css = generateCSS(theme, palette, opts);
  const content = generateContent(pages, wordGroups, arrows, sidebars, opts);
  const js = generateJS(opts);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(projectTitle)} - EasyFrenchBro Export</title>
  <style>${css}</style>
</head>
<body class="${opts.theme === 'dark' ? 'dark' : ''}">
  <div class="container">
    <header class="header">
      <h1>${escapeHtml(projectTitle)}</h1>
      <div class="controls">
        <button id="themeToggle" class="btn" title="Toggle theme">🌓</button>
        ${opts.hoverReveal ? '<label class="toggle"><input type="checkbox" id="revealToggle" checked> Hover to reveal</label>' : ''}
      </div>
    </header>
    
    <main class="content">
      ${content}
    </main>
    
    <footer class="footer">
      <p>Generated with EasyFrenchBro • <a href="https://easyfrenchbro.com">easyfrenchbro.com</a></p>
    </footer>
  </div>
  
  <script>${js}</script>
</body>
</html>`;
}

function generateCSS(theme: ThemeConfig, palette: ColorPalette, _opts: ExportOptions): string {
  const colors = palette.colors;
  
  return `
    :root {
      --font-french: ${theme.frenchFontFamily || 'Georgia, serif'};
      --font-english: ${theme.englishFontFamily || 'system-ui, sans-serif'};
      --font-size: ${theme.fontSize || '18px'};
      --line-height: ${theme.lineHeight || '1.6'};
      
      --color-subject: ${colors.subject};
      --color-verb: ${colors.verb};
      --color-complement: ${colors.complement};
      --color-article: ${colors.article};
      --color-adjective: ${colors.adjective};
      --color-adverb: ${colors.adverb};
      --color-text: ${colors.text};
      
      /* Anecdote Colors */
      --color-grammar: ${colors.grammar || '#fef3c7'};
      --color-spoken: ${colors.spoken || '#dcfce7'};
      --color-history: ${colors.history || '#dbeafe'};
      --color-falseFriend: ${colors.falseFriend || '#fce7f3'};
      --color-pronunciation: ${colors.pronunciation || '#f3e8ff'};
      --color-vocab: ${colors.vocab || '#e0f2fe'};
      
      --bg-primary: #ffffff;
      --bg-secondary: #f8fafc;
      --text-primary: #1e293b;
      --text-secondary: #64748b;
      --border-color: #e2e8f0;
    }
    
    .dark {
      --bg-primary: #0f172a;
      --bg-secondary: #1e293b;
      --text-primary: #f1f5f9;
      --text-secondary: #94a3b8;
      --border-color: #334155;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: var(--font-english);
      font-size: var(--font-size);
      line-height: var(--line-height);
      background: var(--bg-primary);
      color: var(--text-primary);
      transition: background 0.3s, color 0.3s;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 1.5rem;
      border-bottom: 2px solid var(--border-color);
      margin-bottom: 2rem;
    }
    
    .header h1 {
      font-size: 1.5rem;
      font-weight: 700;
    }
    
    .controls {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
    
    .btn {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
      background: var(--bg-secondary);
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn:hover {
      transform: scale(1.05);
    }
    
    .toggle {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }
    
    .content {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    
    .page {
      background: var(--bg-secondary);
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .page-title {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .line-pair {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      padding: 1rem 0;
      border-bottom: 1px solid var(--border-color);
    }
    
    .line-pair:last-child {
      border-bottom: none;
    }
    
    .line-french {
      font-family: var(--font-french);
      font-style: italic;
    }
    
    .line-english {
      color: var(--text-secondary);
    }
    
    /* Section types */
    .section-title { font-size: 2rem; font-weight: 800; text-align: center; margin: 2rem 0; grid-template-columns: 1fr; }
    .section-heading { font-size: 1.5rem; font-weight: 700; margin-top: 2rem; border-bottom: 2px solid var(--border-color); grid-template-columns: 1fr; }
    .section-note { font-style: italic; background: var(--bg-secondary); padding: 0.5rem; border-left: 4px solid var(--color-verb); }
    .section-title .line-english, .section-heading .line-english { display: block; filter: none; opacity: 0.7; }
    
    /* Hover reveal */
    .reveal-mode .line-english {
      opacity: 0;
      filter: blur(4px);
      transition: all 0.3s ease;
    }
    
    .reveal-mode .line-pair:hover .line-english,
    .reveal-mode .line-english:focus {
      opacity: 1;
      filter: blur(0);
    }
    
    /* Word group highlights */
    .word-group {
      display: inline;
      padding: 0.1em 0.2em;
      border-radius: 0.25em;
      position: relative;
    }
    
    .word-group.subject { background: color-mix(in srgb, var(--color-subject) 30%, transparent); }
    .word-group.verb { background: color-mix(in srgb, var(--color-verb) 30%, transparent); }
    .word-group.complement { background: color-mix(in srgb, var(--color-complement) 30%, transparent); }
    .word-group.article { background: color-mix(in srgb, var(--color-article) 30%, transparent); }
    .word-group.adjective { background: color-mix(in srgb, var(--color-adjective) 30%, transparent); border-bottom: 2px solid var(--color-adjective); }
    .word-group.adverb { background: color-mix(in srgb, var(--color-adverb) 30%, transparent); border-bottom: 2px solid var(--color-adverb); }
    
    /* Anecdote specific styles */
    .word-group.grammar { background: var(--color-grammar); }
    .word-group.spoken { background: var(--color-spoken); }
    .word-group.history { background: var(--color-history); }
    .word-group.falseFriend { background: var(--color-falseFriend); }
    .word-group.pronunciation { background: var(--color-pronunciation); }
    .word-group.vocab { background: var(--color-vocab); }
    
    .word-group::after {
      content: attr(data-type);
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.625rem;
      background: var(--text-primary);
      color: var(--bg-primary);
      padding: 0.2em 0.4em;
      border-radius: 0.25em;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s;
    }
    
    .word-group:hover::after {
      opacity: 1;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .container {
        padding: 1rem;
      }
      
      .line-pair {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }
      
      .header {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }
    }
    
    /* Sidebar Cards / Anecdotes */
    .sidebar-notes {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-left: 1rem;
      flex: 0 0 12rem; /* Fixed width */
      font-size: 0.8rem;
    }

    .note-card {
      padding: 0.5rem;
      border-radius: 0.5rem;
      background: #fff;
      border: 1px solid rgba(0,0,0,0.1);
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      white-space: pre-wrap;
    }
    
    .line-container {
        display: flex;
        align-items: flex-start;
        border-bottom: 1px solid var(--border-color);
        padding: 1rem 0;
    }
    
    .line-container .line-pair {
        flex: 1;
        border-bottom: none;
        padding: 0;
    }

    .footer {
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
      text-align: center;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }
    
    .footer a {
      color: var(--color-verb);
      text-decoration: none;
    }
    
    .footer a:hover {
      text-decoration: underline;
    }
    
    /* Print styles */
    @media print {
      body {
        background: white;
        color: black;
      }
      
      .header .controls,
      .footer {
        display: none;
      }
      
      .reveal-mode .line-english {
        opacity: 1;
        filter: none;
      }
    }
  `;
}

function generateContent(
  pages: PageData[],
  wordGroups: WordGroup[],
  _arrows: ArrowConnector[],
  sidebars: SidebarCard[],
  _opts: ExportOptions
): string {
  return pages.map((page, pageIndex) => {
    const lines = page.lines.map(line => {
      // Find word groups for this line
      const lineGroups = wordGroups.filter(g => g.lineId === line.id);
      
      // Render French text with word group highlights
      const frenchHtml = renderTextWithGroups(line.frenchText, lineGroups, line.id, 'french');
      const englishHtml = renderTextWithGroups(line.englishText, lineGroups, line.id, 'english');
      
      // Find sidebar cards for this line
      const lineCards = sidebars.filter(s => s.anchoredLineId === line.id);
      const cardsHtml = lineCards.map(card => `
          <div class="note-card" style="background-color: ${card.color || '#fef3c7'}80; border-left: 3px solid ${card.color || '#fca5a5'}">
            <strong>${card.type}</strong><br/>
            ${escapeHtml(card.content)}
          </div>
      `).join('');

      return `
        <div class="line-container section-${line.sectionType || 'paragraph'}" id="line-${line.id}">
            <div class="line-pair" id="${line.id}">
              <div class="line-french">${frenchHtml}</div>
              <div class="line-english" tabindex="0">${englishHtml}</div>
            </div>
            ${cardsHtml ? `<div class="sidebar-notes">${cardsHtml}</div>` : ''}
        </div>
      `;
    }).join('');
    
    return `
      <section class="page" id="page-${pageIndex + 1}">
        <div class="page-title">Page ${pageIndex + 1}</div>
        ${lines}
      </section>
    `;
  }).join('');
}

function renderTextWithGroups(
  text: string,
  groups: WordGroup[],
  lineId: string,
  language: 'french' | 'english'
): string {
  if (!text) return '';
  
  // Find groups for this language
  const languageGroups = groups.filter(g => g.language === language);
  
  if (languageGroups.length === 0) {
    return escapeHtml(text);
  }
  
  // Split text into words using the same logic as WordGroupRenderer
  const tokens = text.split(/([a-zA-Z0-9À-ÿ'']+)/).filter(Boolean);
  let wordIndex = 0;
  
  return tokens.map(token => {
    // Check if it's a word using the same regex
    const isWord = /^[a-zA-Z0-9À-ÿ'']+$/.test(token);
    
    if (!isWord) {
      return escapeHtml(token);
    }
    
    // It's a word, increment index
    const currentWordIndex = wordIndex++;
    const wordId = `${lineId}-${language}-${currentWordIndex}`;
    
    // Check if this word is part of any group
    const group = languageGroups.find(g => g.wordIds.includes(wordId));
    
    if (group) {
      const typeClass = group.anecdoteType || group.type || 'custom';
      const label = group.label || (group.type ? getTypeName(group.type) : '');
      const styleAttr = group.color && !group.type && !group.anecdoteType ? `style="border-bottom: 2px solid ${group.color}; background-color: ${group.color}33;"` : '';
      
      return `<span class="word-group ${typeClass}" data-type="${label}" ${styleAttr}>${escapeHtml(token)}</span>`;
    }
    
    return escapeHtml(token);
  }).join('');
}

function getTypeName(type: WordGroupType): string {
  const names: Record<WordGroupType, string> = {
    subject: 'Subject',
    verb: 'Verb',
    complement: 'Complement',
    article: 'Article',
    adjective: 'Adjective',
    adverb: 'Adverb',
    custom: 'Custom'
  };
  return names[type] || type;
}

function generateJS(opts: ExportOptions): string {
  return `
    // Theme toggle
    const themeBtn = document.getElementById('themeToggle');
    themeBtn?.addEventListener('click', () => {
      document.body.classList.toggle('dark');
    });
    
    // Auto-detect theme
    ${opts.theme === 'auto' ? `
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.classList.add('dark');
    }
    ` : ''}
    
    // Hover reveal toggle
    ${opts.hoverReveal ? `
    const revealToggle = document.getElementById('revealToggle');
    const content = document.querySelector('.content');
    
    function updateRevealMode() {
      if (revealToggle.checked) {
        content.classList.add('reveal-mode');
      } else {
        content.classList.remove('reveal-mode');
      }
    }
    
    revealToggle?.addEventListener('change', updateRevealMode);
    updateRevealMode(); // Set initial state
    ` : ''}
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        const focused = document.activeElement;
        const next = focused?.parentElement?.nextElementSibling?.querySelector('[tabindex]');
        next?.focus();
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        const focused = document.activeElement;
        const prev = focused?.parentElement?.previousElementSibling?.querySelector('[tabindex]');
        prev?.focus();
      }
    });
  `;
}

function escapeHtml(text: string): string {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text?.replace(/[&<>"']/g, char => escapeMap[char] || char) || '';
}

export default generateInteractiveHTML;
