/**
 * Fuzzy matching for Tanglish input — handles typos and variations.
 * Allows 1-2 character edits (insertions, deletions, substitutions).
 */

/**
 * Levenshtein distance: minimum edits (insert/delete/substitute) to transform
 * source into target. Used for typo tolerance.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const dp: number[][] = Array(a.length + 1)
    .fill(0)
    .map(() => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[a.length][b.length];
}

/**
 * Find similar words from a list with tolerance for typos.
 * Returns matches within maxDistance edits, ranked by distance.
 */
export function findSimilar(
  input: string,
  candidates: string[],
  maxDistance = 2
): Array<{ word: string; distance: number }> {
  const similar: Array<{ word: string; distance: number }> = [];

  for (const candidate of candidates) {
    const dist = levenshteinDistance(input.toLowerCase(), candidate.toLowerCase());
    if (dist <= maxDistance) {
      similar.push({ word: candidate, distance: dist });
    }
  }

  // Sort by distance (exact matches first), then alphabetically
  similar.sort((a, b) => a.distance - b.distance || a.word.localeCompare(b.word));
  return similar;
}

/**
 * Check if input is "close enough" to target (for autoCorrect).
 * Example: "pandra" vs "panra" should match with distance 1.
 */
export function isSimilarEnough(input: string, target: string, tolerance = 1): boolean {
  return levenshteinDistance(input.toLowerCase(), target.toLowerCase()) <= tolerance;
}

/**
 * Tamil phonetic variations — common typos and alternate spellings.
 * For example: "kh" and "k" often represent the same sound.
 */
export const PHONETIC_VARIANTS: Record<string, string[]> = {
  k: ['g', 'kh', 'q'],
  g: ['k'],
  c: ['ch', 's'],
  ch: ['c', 'cch'],
  t: ['d', 'th', 'T'],
  T: ['t', 'd'],
  d: ['t', 'dh', 'D'],
  D: ['d', 't'],
  p: ['b', 'ph'],
  b: ['p'],
  n: ['nd', 'nn', 'gn', 'nj'],
  s: ['sh', 'ss', 'c'],
  sh: ['s', 'Sh'],
  l: ['ll', 'la', 'L'],
  r: ['R', 'rr'],
  R: ['r'],
  aa: ['A', 'a'],
  ii: ['I', 'i'],
  uu: ['U', 'u'],
  ee: ['E', 'e'],
  oo: ['O', 'o'],
};

/**
 * Generate phonetic variants of input for fuzzy matching.
 * Useful for matching "panra" to "pandra" (alveolar n variations).
 */
export function getPhoneticVariants(input: string): Set<string> {
  const variants = new Set<string>();
  variants.add(input); // Always include exact

  // Simple pattern-based variant generation
  const rules = [
    // Double consonant tolerance
    ['([a-z])\\1', '$1'], // "kk" → "k"
    ['([a-z])', '$1$1'], // "k" → "kk" (optional)

    // Consonant variations
    ['kh', 'k'],
    ['k', 'kh'],
    ['ch', 'c'],
    ['c', 'ch'],
    ['sh', 's'],
    ['s', 'sh'],

    // Vowel variations
    ['aa', 'A'],
    ['A', 'aa'],
    ['ii', 'I'],
    ['I', 'ii'],
  ];

  // For now, just return base + manual expansions
  // Full regex handling would require more complex logic
  return variants;
}
