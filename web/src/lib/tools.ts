import type { Tool } from '../types';

export const TOOLS: Tool[] = [
  {
    id: 'write',
    label: 'எழுது',
    hint: 'ஆராய்ந்து எழுதும் — கட்டுரை, கடிதம், பதிவு, எதுவும் · Research & write anything',
    placeholder: 'எதைப் பற்றி எழுத வேண்டும்? அல்லது எந்த உரையையும் ஒட்டுங்கள்…',
  },
  {
    id: 'clean',
    label: 'தூய தமிழ்',
    hint: 'எதையும் சுத்தமான தமிழாக்கும் · Anything → clean Tamil',
    placeholder: 'ஆங்கிலம், Tanglish, பிழையான தமிழ் — ஒட்டுங்கள்…',
  },
  {
    id: 'translate',
    label: 'மொழிபெயர்',
    hint: 'ஆங்கிலம் → தமிழ் · English → Tamil',
    placeholder: 'Paste English text to translate…',
  },
  {
    id: 'grammar',
    label: 'இலக்கணம்',
    hint: 'எழுத்துப்பிழை, இலக்கணத் திருத்தம் · Fix Tamil grammar',
    placeholder: 'திருத்த வேண்டிய தமிழ் உரையை ஒட்டுங்கள்…',
  },
  {
    id: 'formal',
    label: 'எழுத்து நடை',
    hint: 'பேச்சுத் தமிழ் → எழுத்துத் தமிழ் · Formal written Tamil',
    placeholder: 'பேச்சு நடை உரையை ஒட்டுங்கள்…',
  },
  {
    id: 'translit',
    label: 'Tanglish',
    hint: 'ஒலிபெயர்ப்பு, இணையமின்றி · Instant offline transliteration',
    placeholder: 'vanakkam nanbargale…',
    offline: true,
  },
];

export const toolById = (id: string) => TOOLS.find((t) => t.id === id) ?? TOOLS[0];

export const MAX_INPUT_CHARS = 20_000;
