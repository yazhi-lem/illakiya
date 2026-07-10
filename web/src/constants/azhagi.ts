/**
 * Azhagi-style phonetic transliteration scheme (Taglish -> Tamil).
 *
 * Adapted from the Open-Tamil project's `transliterate` module
 * (Ezhil-Language-Foundation/open-tamil), which ships roman->Tamil scheme
 * dictionaries (azhagi, jaffna, itrans, ...) consumed by a greedy longest-match
 * transliterator. Open-Tamil is distributed under the MIT license; this port
 * keeps the same phonetic intent while staying lowercase-friendly so that a
 * writer can type ordinary "Tanglish" and get pure Tamil.
 *
 * The tables below are plain data. The matching algorithm lives in
 * `web/src/lib/translit.ts`.
 */

// Independent (standalone) vowel forms — உயிர் எழுத்து.
export const VOWELS: Record<string, string> = {
  a: 'அ',
  aa: 'ஆ',
  A: 'ஆ',
  i: 'இ',
  ii: 'ஈ',
  I: 'ஈ',
  ee: 'ஈ',
  u: 'உ',
  uu: 'ஊ',
  U: 'ஊ',
  oo: 'ஊ',
  e: 'எ',
  E: 'ஏ',
  ae: 'ஏ',
  ai: 'ஐ',
  o: 'ஒ',
  O: 'ஓ',
  au: 'ஔ',
  ou: 'ஔ',
};

// Dependent vowel signs — மாத்திரை. Keyed by the independent vowel form.
// அ has no visible sign (it is the consonant's inherent vowel).
export const VOWEL_SIGNS: Record<string, string> = {
  அ: '',
  ஆ: 'ா',
  இ: 'ி',
  ஈ: 'ீ',
  உ: 'ு',
  ஊ: 'ூ',
  எ: 'ெ',
  ஏ: 'ே',
  ஐ: 'ை',
  ஒ: 'ொ',
  ஓ: 'ோ',
  ஔ: 'ௌ',
};

// Consonants stored in their base (உயிர்மெய் "அ") form, e.g. க (not க்).
// The transliterator adds the pulli (்) when no vowel follows.
export const CONSONANTS: Record<string, string> = {
  // vallinam (hard)
  k: 'க',
  g: 'க',
  kh: 'க',
  q: 'க',
  ch: 'ச',
  c: 'ச',
  T: 'ட',
  t: 'ட',
  d: 'ட',
  D: 'ட',
  th: 'த',
  dh: 'த',
  p: 'ப',
  b: 'ப',
  P: 'ப',
  R: 'ற',
  // idaiyinam (medium)
  y: 'ய',
  r: 'ர',
  l: 'ல',
  L: 'ள',
  zh: 'ழ',
  z: 'ழ',
  v: 'வ',
  w: 'வ',
  // mellinam (soft / nasal)
  ng: 'ங',
  nj: 'ஞ',
  gn: 'ஞ',
  N: 'ண',
  m: 'ம',
  // grantha (borrowed sounds)
  j: 'ஜ',
  sh: 'ஷ',
  Sh: 'ஷ',
  s: 'ஸ',
  S: 'ஸ',
  ss: 'ஸ',
  h: 'ஹ',
  f: 'ஃப',
};

// Compound / multi-letter consonant clusters. `prefix` is emitted immediately
// (already carrying its pulli); `base`, when present, becomes the new pending
// consonant so a following vowel still composes onto it (e.g. "ksh" + "mi" ->
// க்ஷ்மி) and a bare cluster gets its trailing pulli.
export const CLUSTERS: Record<string, { prefix: string; base?: string }> = {
  ksh: { prefix: 'க்', base: 'ஷ' },
  x: { prefix: 'க்', base: 'ஷ' },
  shri: { prefix: 'ஸ்ரீ' },
  sri: { prefix: 'ஸ்ரீ' },
};

// The dental nasal ந (n) vs the alveolar nasal ன (n). Tamil words never begin
// with ன, so a word-initial "n" — or an "n" that precedes a dental — is ந.
// Everything else is ன. Handled contextually in translit.ts.
export const N_DENTAL = 'ந';
export const N_ALVEOLAR = 'ன';

// Aytham — ஃ
export const AYTHAM = 'ஃ';

export const PULLI = '்';

// All roman keys we know about, longest first so a greedy scan prefers
// multi-letter matches (e.g. "th" before "t", "ksh" before "k").
export const ALL_KEYS: string[] = Array.from(
  new Set([
    ...Object.keys(CLUSTERS),
    ...Object.keys(CONSONANTS),
    ...Object.keys(VOWELS),
    'n',
    'H',
  ])
).sort((a, b) => b.length - a.length);
