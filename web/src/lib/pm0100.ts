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

const vowelSigns: Record<string, string> = {
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

const vowels = new Set(Object.keys(vowelSigns));

export function composePm0100(before: string, key: string): { before: string; inserted: string } {
  if (!vowels.has(key)) {
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
