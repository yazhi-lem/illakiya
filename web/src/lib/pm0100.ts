const meiToUyirBase: Record<string, string> = {
  'க்': 'க',
  'ச்': 'ச',
  'ட்': 'ட',
  'த்': 'த',
  'ப்': 'ப',
  'ற்': 'ற',
  'ய்': 'ய',
  'ர்': 'ர',
  'ல்': 'ல',
  'வ்': 'வ',
  'ழ்': 'ழ',
  'ள்': 'ள',
  'ங்': 'ங',
  'ஞ்': 'ஞ',
  'ண்': 'ண',
  'ந்': 'ந',
  'ம்': 'ம',
  'ன்': 'ன',
};

// All vowels (short + long) with their combining diacritic signs
const vowelSigns: Record<string, string> = {
  அ: '',
  இ: 'ி',
  உ: 'ு',
  எ: 'ெ',
  ஒ: 'ொ',
  ஆ: 'ா',
  ஈ: 'ீ',
  ஊ: 'ூ',
  ஏ: 'ே',
  ஓ: 'ோ',
  ஐ: 'ை',
  ஔ: 'ௌ',
};

const allVowels = new Set(Object.keys(vowelSigns));

export function composePm0100(before: string, key: string): { before: string; inserted: string } {
  if (!allVowels.has(key)) {
    return { before, inserted: key };
  }

  const meiMatch = Object.keys(meiToUyirBase).find((mei) => before.endsWith(mei));
  if (!meiMatch) {
    return { before, inserted: key };
  }

  const replacedBefore = before.slice(0, -meiMatch.length);
  const uyirBase = meiToUyirBase[meiMatch];
  const sign = vowelSigns[key] ?? '';
  return { before: replacedBefore, inserted: `${uyirBase}${sign}` };
}

export function revertPm0100Composition(before: string): { changed: boolean; value: string } {
  for (const [mei, base] of Object.entries(meiToUyirBase)) {
    for (const sign of Object.values(vowelSigns)) {
      const composed = `${base}${sign}`;
      if (composed.length > 0 && before.endsWith(composed)) {
        return {
          changed: true,
          value: `${before.slice(0, -composed.length)}${mei}`,
        };
      }
    }
  }

  return { changed: false, value: before };
}

// --- contenteditable helpers ---

export function insertInContentEditable(el: HTMLElement, value: string): void {
  el.focus();
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;

  const range = sel.getRangeAt(0);

  // Collect text before the cursor across all text nodes
  const preRange = document.createRange();
  preRange.selectNodeContents(el);
  preRange.setEnd(range.startContainer, range.startOffset);
  const before = preRange.toString();

  const composed = composePm0100(before, value);
  const charsToDelete = before.length - composed.before.length;

  for (let i = 0; i < charsToDelete; i++) {
    document.execCommand('delete', false);
  }
  document.execCommand('insertText', false, composed.inserted);
}

export function backspaceInContentEditable(el: HTMLElement): void {
  el.focus();
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;

  const range = sel.getRangeAt(0);

  // If text is selected, delete the selection
  if (!range.collapsed) {
    document.execCommand('delete', false);
    return;
  }

  const preRange = document.createRange();
  preRange.selectNodeContents(el);
  preRange.setEnd(range.startContainer, range.startOffset);
  const before = preRange.toString();

  if (!before.length) return;

  const reverted = revertPm0100Composition(before);
  if (reverted.changed) {
    // Mei is always 2 chars (consonant + pulli). Use that to compute
    // how many composed chars we need to delete before inserting the mei.
    const MEI_LEN = 2;
    const composedLen = before.length - reverted.value.length + MEI_LEN;
    for (let i = 0; i < composedLen; i++) {
      document.execCommand('delete', false);
    }
    const mei = reverted.value.slice(-MEI_LEN);
    document.execCommand('insertText', false, mei);
    return;
  }

  document.execCommand('delete', false);
}
