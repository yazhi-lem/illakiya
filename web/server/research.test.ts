import { describe, expect, it } from 'vitest';
import { parseWikiResponse, wikiSearchUrl } from './research';

describe('wikipedia research', () => {
  it('builds a search + extracts query', () => {
    const url = new URL(wikiSearchUrl('ta', 'திருவள்ளுவர்'));
    expect(url.host).toBe('ta.wikipedia.org');
    expect(url.searchParams.get('gsrsearch')).toBe('திருவள்ளுவர்');
    expect(url.searchParams.get('prop')).toBe('extracts|info');
  });

  it('keeps ranked pages with real extracts', () => {
    const data = {
      query: {
        pages: [
          { title: 'B', fullurl: 'https://ta.wikipedia.org/wiki/B', extract: 'x'.repeat(100), index: 2 },
          { title: 'A', fullurl: 'https://ta.wikipedia.org/wiki/A', extract: 'y'.repeat(100), index: 1 },
          { title: 'Stub', fullurl: 'https://ta.wikipedia.org/wiki/S', extract: 'short', index: 3 },
        ],
      },
    };
    expect(parseWikiResponse('ta', data).map((s) => s.title)).toEqual(['A', 'B']);
    expect(parseWikiResponse('en', {})).toEqual([]);
  });
});
