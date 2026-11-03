import { describe, expect, it } from 'vitest';
import { parseBlocks, renderInline } from './Markdown';

describe('parseBlocks', () => {
  it('splits headings, paragraphs and lists', () => {
    const blocks = parseBlocks('# தலைப்பு\n\nமுதல் வரி\nஇரண்டாம் வரி\n\n- ஒன்று\n- இரண்டு\n1. முதல்');
    expect(blocks).toEqual([
      { kind: 'h', level: 1, text: 'தலைப்பு' },
      { kind: 'p', text: 'முதல் வரி\nஇரண்டாம் வரி' },
      { kind: 'ul', items: ['ஒன்று', 'இரண்டு'] },
      { kind: 'ol', items: ['முதல்'] },
    ]);
  });
});

describe('renderInline', () => {
  it('only links http(s) URLs', () => {
    const safe = renderInline('[x](javascript:alert(1)) and [y](https://ta.wikipedia.org)');
    expect(typeof safe[0]).toBe('string');
    expect(safe.some((n) => typeof n === 'object')).toBe(true);
  });
});
