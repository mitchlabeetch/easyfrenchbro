import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './store';

describe('Store', () => {
  beforeEach(() => {
    useStore.setState({
      lines: [],
      sidebars: [],
      highlights: [],
      arrows: [],
      highlightSelection: { frenchIds: [], englishIds: [], lineId: null }
    });
  });

  it('should parse and set text correctly, trimming inputs', () => {
    const rawFrench = "  Bonjour  \n  Monde  ";
    const rawEnglish = "  Hello  \n  World  ";

    useStore.getState().parseAndSetText(rawFrench, rawEnglish);

    const { lines } = useStore.getState();
    expect(lines).toHaveLength(2);
    expect(lines[0].frenchText).toBe('Bonjour');
    expect(lines[0].englishText).toBe('Hello');
    expect(lines[1].frenchText).toBe('Monde');
    expect(lines[1].englishText).toBe('World');
  });

  it('should handle uneven lines by filling with empty strings', () => {
    const rawFrench = "Bonjour";
    const rawEnglish = "Hello\nWorld";

    useStore.getState().parseAndSetText(rawFrench, rawEnglish);

    const { lines } = useStore.getState();
    expect(lines).toHaveLength(2);
    expect(lines[0].frenchText).toBe('Bonjour');
    expect(lines[0].englishText).toBe('Hello');
    expect(lines[1].frenchText).toBe('');
    expect(lines[1].englishText).toBe('World');
  });

  it('should add and update sidebar cards', () => {
    // Add a dummy line to anchor to
    useStore.getState().setLines([{ id: 'line-1', lineNumber: 1, frenchText: 'A', englishText: 'B' }]);

    // Add card
    useStore.getState().addSidebarCard({
        type: 'grammar',
        content: 'Initial Content',
        anchoredLineId: 'line-1'
    });

    let { sidebars } = useStore.getState();
    expect(sidebars).toHaveLength(1);
    expect(sidebars[0].content).toBe('Initial Content');

    const cardId = sidebars[0].id;

    // Update card
    useStore.getState().updateSidebarCard(cardId, { content: 'Updated Content' });

    sidebars = useStore.getState().sidebars;
    expect(sidebars[0].content).toBe('Updated Content');
  });
});
