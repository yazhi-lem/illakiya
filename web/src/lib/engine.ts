/**
 * Dictionary helpers for word suggestions and Tanglish auto-correct.
 *
 * Backed by the same corpus the Illakiya Rust core embeds
 * (`data/dictionary/tamil_base.json`), so the web editor stays in sync with the
 * keyboard's vocabulary.
 */

import dictionary from '@data/dictionary/tamil_base.json';

type DictWord = { tamil: string; translit: string; en: string; freq: number };

const WORDS: DictWord[] = ((dictionary as { words?: DictWord[] }).words ?? []).filter(
  (w) => typeof w.tamil === 'string'
);

const BY_FREQ = [...WORDS].sort((a, b) => (b.freq ?? 0) - (a.freq ?? 0));
const TAMIL_SET = new Set(WORDS.map((w) => w.tamil));
// Romanized form -> most frequent Tamil word, for Tanglish auto-correct.
const BY_TRANSLIT = new Map<string, string>();
for (const w of BY_FREQ) {
  if (w.translit && !BY_TRANSLIT.has(w.translit)) {
    BY_TRANSLIT.set(w.translit.toLowerCase(), w.tamil);
  }
}

/**
 * Dictionary prefix suggestions (Tamil), ranked by corpus frequency. Mirrors
 * the Rust `Dictionary::suggest_prefix`.
 */
export function suggest(prefixTamil: string, limit = 5): string[] {
  const prefix = prefixTamil.trim();
  if (!prefix) return [];
  const out: string[] = [];
  for (const w of BY_FREQ) {
    if (w.tamil.startsWith(prefix) && w.tamil !== prefix) {
      out.push(w.tamil);
      if (out.length >= limit) break;
    }
  }
  return out;
}

/** True when the Tamil word is in the corpus. Mirrors `is_valid_word`. */
export function isValidWord(word: string): boolean {
  return TAMIL_SET.has(word);
}

/**
 * Auto-correct a just-typed word. If the romanized source maps to a known Tamil
 * word, return it; otherwise return a close dictionary word by prefix. Returns
 * null when nothing confident is found (so we never "correct" to noise).
 */
export function autoCorrect(romanSource: string, tamilWord: string): string | null {
  const roman = romanSource.trim().toLowerCase();
  if (roman && BY_TRANSLIT.has(roman)) {
    const hit = BY_TRANSLIT.get(roman)!;
    return hit === tamilWord ? null : hit;
  }
  if (tamilWord && !TAMIL_SET.has(tamilWord)) {
    const near = suggest(tamilWord, 1);
    if (near.length) return near[0];
  }
  return null;
}
