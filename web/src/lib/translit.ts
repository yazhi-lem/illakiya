/**
 * Taglish -> Tamil transliteration.
 *
 * A greedy longest-match transliterator over the Azhagi-style scheme tables in
 * `web/src/constants/azhagi.ts` (ported from Open-Tamil's `transliterate`
 * module). It mirrors Open-Tamil's iterative/greedy algorithm: at each position
 * it consumes the longest roman key it can, then composes Tamil correctly —
 *
 *   - mei + uyir  -> uyirmei  (consonant + vowel sign, e.g. க + ி = கி)
 *   - a bare consonant (no following vowel) gets a pulli (க்)
 *   - a standalone vowel uses its independent form (அ, ஆ, ...)
 *   - gemination falls out naturally: "kk" -> க் + க
 *
 * The dental/alveolar "n" ambiguity is resolved contextually: word-initial or
 * pre-dental "n" -> ந, otherwise ன.
 */

import {
  ALL_KEYS,
  AYTHAM,
  CLUSTERS,
  CONSONANTS,
  N_ALVEOLAR,
  N_DENTAL,
  PULLI,
  VOWELS,
  VOWEL_SIGNS,
} from '../constants/azhagi';

const DENTAL_FOLLOWERS = ['th', 'dh'];

// A letter that can start a roman token. Used to detect word boundaries so the
// n-heuristic and word-initial logic reset at spaces/punctuation.
function isRomanLetter(ch: string): boolean {
  return /[A-Za-z]/.test(ch);
}

type Pending = { base: string } | null;

/**
 * Transliterate a single run of romanized text into Tamil. Non-letter
 * characters (spaces, punctuation, digits) pass through untouched and act as
 * word boundaries.
 */
export function transliterateWord(roman: string): string {
  let out = '';
  let pending: Pending = null;
  // Offset (within `roman`) where the current word began — for word-initial n.
  let wordStart = 0;

  const flushPending = () => {
    if (pending) {
      out += pending.base + PULLI;
      pending = null;
    }
  };

  let i = 0;
  while (i < roman.length) {
    const ch = roman[i];

    // Word boundary / literal passthrough.
    if (!isRomanLetter(ch)) {
      flushPending();
      out += ch;
      i += 1;
      wordStart = i;
      continue;
    }

    // Aytham: "H" on its own (kept distinct from lowercase h = ஹ).
    if (ch === 'H') {
      flushPending();
      out += AYTHAM;
      i += 1;
      continue;
    }

    const key = longestKeyAt(roman, i);
    if (!key) {
      // Unknown letter — flush and emit as-is.
      flushPending();
      out += ch;
      i += 1;
      continue;
    }

    // Clusters: emit the ready-made prefix, then optionally leave a pending
    // consonant so a following vowel composes (or a pulli is added at flush).
    if (key in CLUSTERS) {
      const cluster = CLUSTERS[key];
      flushPending();
      out += cluster.prefix;
      pending = cluster.base ? { base: cluster.base } : null;
      i += key.length;
      continue;
    }

    // Contextual "n".
    if (key === 'n') {
      const atWordStart = i === wordStart;
      const rest = roman.slice(i + 1);
      const isDental = atWordStart || DENTAL_FOLLOWERS.some((d) => rest.startsWith(d));
      const base = isDental ? N_DENTAL : N_ALVEOLAR;
      flushPending();
      pending = { base };
      i += 1;
      continue;
    }

    if (key in CONSONANTS) {
      flushPending();
      pending = { base: CONSONANTS[key] };
      i += key.length;
      continue;
    }

    // Vowel.
    const vowel = VOWELS[key];
    if (pending) {
      out += pending.base + (VOWEL_SIGNS[vowel] ?? '');
      pending = null;
    } else {
      out += vowel;
    }
    i += key.length;
  }

  flushPending();
  return out;
}

/** Longest scheme key that matches `roman` starting at index `i`, or null. */
function longestKeyAt(roman: string, i: number): string | null {
  for (const key of ALL_KEYS) {
    if (key.length === 0) continue;
    if (roman.startsWith(key, i)) {
      return key;
    }
  }
  return null;
}

/**
 * Live transliteration for the in-progress word. Because Tamil composition is
 * order-dependent, the editor keeps the raw roman buffer for the word being
 * typed and re-transliterates the whole buffer on every keystroke. The trailing
 * consonant is shown with a pulli until a vowel arrives, which is the natural
 * on-screen behaviour of a Tamil IME.
 */
export function transliterateLive(romanSoFar: string): string {
  return transliterateWord(romanSoFar);
}
