import { describe, expect, it } from 'vitest';
import { levenshteinDistance, findSimilar, isSimilarEnough } from './fuzzy';

describe('fuzzy matching', () => {
  it('computes Levenshtein distance correctly', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3); // classic example
    expect(levenshteinDistance('', 'abc')).toBe(3); // empty to 3 chars
    expect(levenshteinDistance('abc', '')).toBe(3); // 3 chars to empty
    expect(levenshteinDistance('abc', 'abc')).toBe(0); // same string
    expect(levenshteinDistance('cat', 'cut')).toBe(1); // one substitution
  });

  it('finds similar words within tolerance', () => {
    const candidates = ['panra', 'pandra', 'panna', 'para', 'naan'];
    const matches = findSimilar('panra', candidates, 1);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].word).toBe('panra'); // exact match first
    expect(matches[0].distance).toBe(0);
  });

  it('handles fuzzy matching with tolerance', () => {
    const candidates = ['panra', 'pandra', 'panna'];
    const matches = findSimilar('pandra', candidates, 1);
    // Should match 'pandra' (exact) and possibly 'panra' (1 edit away)
    expect(matches.some((m) => m.word === 'pandra')).toBe(true);
  });

  it('checks similarity with tolerance', () => {
    expect(isSimilarEnough('panra', 'pandra', 1)).toBe(true); // 1 insertion
    expect(isSimilarEnough('cat', 'dog', 1)).toBe(false); // too different
    expect(isSimilarEnough('enna', 'ena', 1)).toBe(true); // 1 deletion
  });

  it('handles Tamil translit variations', () => {
    // Common cases in Tamil typing
    expect(levenshteinDistance('enna', 'ena')).toBe(1); // missing 'n'
    expect(levenshteinDistance('panra', 'pandra')).toBe(1); // extra 'd'
    expect(levenshteinDistance('naan', 'nana')).toBe(2); // 2 substitutions
  });

  it('sorts matches by distance then alphabetically', () => {
    const candidates = ['panra', 'pandra', 'panna', 'para'];
    const matches = findSimilar('panra', candidates, 2);
    // Exact match should be first
    expect(matches[0].distance).toBe(0);
    // Subsequent matches sorted by distance
    for (let i = 1; i < matches.length; i++) {
      if (matches[i].distance === matches[i - 1].distance) {
        expect(matches[i].word.localeCompare(matches[i - 1].word)).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
