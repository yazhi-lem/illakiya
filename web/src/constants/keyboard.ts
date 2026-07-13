// PM0100 on-screen layout. Row 1: vallinam, row 2: idaiyinam, row 3: mellinam,
// row 4: kuril (short) vowels. Consonants carry a pulli (mei form).
export const keyboardRows: string[][] = [
  ['க்', 'ச்', 'ட்', 'த்', 'ப்', 'ற்'],
  ['ய்', 'ர்', 'ல்', 'வ்', 'ழ்', 'ள்'],
  ['ங்', 'ஞ்', 'ண்', 'ந்', 'ம்', 'ன்'],
  ['அ', 'இ', 'உ', 'எ', 'ஒ'],
];

// Kuril (short) -> Nedil (long) vowel. Shift on a vowel key produces the nedil.
export const kurilToNedil: Record<string, string> = {
  அ: 'ஆ',
  இ: 'ஈ',
  உ: 'ஊ',
  எ: 'ஏ',
  ஒ: 'ஓ',
};

type KeyMapEntry = { char: string; isVowel?: boolean };

// Laptop QWERTY -> PM0100, keyed by KeyboardEvent.code so that holding Shift
// (which changes event.key) never breaks the lookup. Physical positions mirror
// the on-screen rows: q..y, a..h, z..n for the three consonant classes and
// u i o p [ for the five kuril vowels.
export const qwertyToPm0100: Record<string, KeyMapEntry> = {
  // Row 1 — vallinam
  KeyQ: { char: 'க்' },
  KeyW: { char: 'ச்' },
  KeyE: { char: 'ட்' },
  KeyR: { char: 'த்' },
  KeyT: { char: 'ப்' },
  KeyY: { char: 'ற்' },
  // Row 2 — idaiyinam
  KeyA: { char: 'ய்' },
  KeyS: { char: 'ர்' },
  KeyD: { char: 'ல்' },
  KeyF: { char: 'வ்' },
  KeyG: { char: 'ழ்' },
  KeyH: { char: 'ள்' },
  // Row 3 — mellinam
  KeyZ: { char: 'ங்' },
  KeyX: { char: 'ஞ்' },
  KeyC: { char: 'ண்' },
  KeyV: { char: 'ந்' },
  KeyB: { char: 'ம்' },
  KeyN: { char: 'ன்' },
  // Row 4 — kuril vowels (Shift -> nedil)
  KeyU: { char: 'அ', isVowel: true },
  KeyI: { char: 'இ', isVowel: true },
  KeyO: { char: 'உ', isVowel: true },
  KeyP: { char: 'எ', isVowel: true },
  BracketLeft: { char: 'ஒ', isVowel: true },
  Digit1: { char: 'அ', isVowel: true },
  Digit2: { char: 'இ', isVowel: true },
  Digit3: { char: 'உ', isVowel: true },
  Digit4: { char: 'எ', isVowel: true },
  Digit5: { char: 'ஒ', isVowel: true },
};

// Reverse map (Tamil key -> the QWERTY hint to print on the on-screen button).
export const pm0100KeyHints: Record<string, string> = (() => {
  const hints: Record<string, string> = {};
  const label: Record<string, string> = {
    KeyQ: 'Q', KeyW: 'W', KeyE: 'E', KeyR: 'R', KeyT: 'T', KeyY: 'Y',
    KeyA: 'A', KeyS: 'S', KeyD: 'D', KeyF: 'F', KeyG: 'G', KeyH: 'H',
    KeyZ: 'Z', KeyX: 'X', KeyC: 'C', KeyV: 'V', KeyB: 'B', KeyN: 'N',
    KeyU: 'U', KeyI: 'I', KeyO: 'O', KeyP: 'P', BracketLeft: '[',
  };
  for (const [code, entry] of Object.entries(qwertyToPm0100)) {
    if (label[code] && !hints[entry.char]) hints[entry.char] = label[code];
  }
  return hints;
})();
