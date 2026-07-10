/**
 * Engine facade.
 *
 * The Illakiya Rust core (`core-rust/`) owns PM0100 composition, a Trie
 * dictionary and the Tholkaappiyam sandhi engine. This facade lets the web app
 * "leverage the rust engine better": when the WASM build
 * (`web/src/wasm/illakiya_core.js`, produced by `scripts/build-wasm.sh`) is
 * present it is used for native sandhi; otherwise everything runs in TypeScript
 * over the *same* dictionary data the Rust core embeds
 * (`data/dictionary/tamil_base.json`), so the editor always works.
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

type NativeSandhi = {
  get_sandhi_suggestion?: () => string | undefined;
} | null;

let nativeSandhi: NativeSandhi = null;

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

/**
 * Sandhi (grammar) join across a word boundary. Uses the native Rust engine
 * when the WASM build is loaded; otherwise returns null (we don't guess at
 * grammar in the fallback).
 */
export function sandhiJoin(word1: string, word2: string): string | null {
  if (!nativeSandhi?.get_sandhi_suggestion || !word1 || !word2) return null;
  try {
    return nativeSandhi.get_sandhi_suggestion() ?? null;
  } catch {
    return null;
  }
}

export type EngineBackend = 'wasm' | 'ts';

let backend: EngineBackend = 'ts';
export function engineBackend(): EngineBackend {
  return backend;
}

/**
 * Best-effort load of the native WASM engine. Safe to call once at startup; if
 * the artifact is absent (WASM not built) it silently stays on the TS backend.
 */
export async function loadNativeEngine(): Promise<EngineBackend> {
  try {
    // Optional artifact produced by scripts/build-wasm.sh. The path is held in a
    // variable so tsc/Vite don't statically require it; absence -> TS fallback.
    const modPath = '../wasm/illakiya_core.js';
    const mod: any = await import(/* @vite-ignore */ modPath).catch(() => null);
    if (!mod) return backend;
    if (typeof mod.default === 'function') {
      await mod.default();
    }
    if (typeof mod.WasmEngine === 'function') {
      nativeSandhi = new mod.WasmEngine();
      backend = 'wasm';
    }
  } catch {
    // stay on ts
  }
  return backend;
}
