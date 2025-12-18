import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './store';
import { LineData } from './types';

describe('useStore', () => {
  beforeEach(() => {
    useStore.setState({
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
    });
  });

  it('should initialize with default values', () => {
    const state = useStore.getState();
    expect(state.pages).toHaveLength(1);
    expect(state.pages[0].lines).toHaveLength(0);
    expect(state.metadata.title).toBe('Untitled Project');
  });

  it('should add a highlight', () => {
    const highlight = {
      colorCode: '#fef3c7',
      frenchWordIds: ['f1'],
      englishWordIds: ['e1'],
      associatedLineId: 'line-1',
    };

    useStore.getState().addHighlight(highlight);
    const state = useStore.getState();
    expect(state.highlights).toHaveLength(1);
    expect(state.highlights[0]).toMatchObject(highlight);
  });

  it('should remove a highlight', () => {
    const highlight = {
      colorCode: '#fef3c7',
      frenchWordIds: ['f1'],
      englishWordIds: ['e1'],
      associatedLineId: 'line-1',
    };
    useStore.getState().addHighlight(highlight);
    const id = useStore.getState().highlights[0].id;

    useStore.getState().removeHighlight(id);
    expect(useStore.getState().highlights).toHaveLength(0);
  });

  it('should reflow pages correctly', () => {
    // Create some dummy lines manually
    const lines: LineData[] = Array.from({ length: 30 }, (_, i) => ({
      id: `line-${i}`,
      lineNumber: i + 1,
      frenchText: `Fr ${i}`,
      englishText: `En ${i}`
    }));

    // Set initial state with 1 page containing all lines
    useStore.setState({ pages: [{ id: 'p1', lines }] });

    // Reflow to 10 lines per page
    useStore.getState().reflowPages(10);

    const state = useStore.getState();
    expect(state.pages).toHaveLength(3);
    expect(state.pages[0].lines).toHaveLength(10);
    expect(state.pages[1].lines).toHaveLength(10);
    expect(state.pages[2].lines).toHaveLength(10);
    expect(state.pages[0].lines[0].id).toBe('line-0');
    expect(state.pages[1].lines[0].id).toBe('line-10');
  });

  it('should parse text and paginate', () => {
    // Create text for 30 lines
    const fr = Array(30).fill('Bonjour').join('\n');
    const en = Array(30).fill('Hello').join('\n');

    useStore.getState().parseAndSetText(fr, en);

    const state = useStore.getState();
    // Default is 25 per page, so we expect 2 pages (25 + 5)
    expect(state.pages).toHaveLength(2);
    expect(state.pages[0].lines).toHaveLength(25);
    expect(state.pages[1].lines).toHaveLength(5);
  });

  it('should update metadata', () => {
    useStore.getState().setMetadata({ title: 'New Title' });
    expect(useStore.getState().metadata.title).toBe('New Title');
  });
});
