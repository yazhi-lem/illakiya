import type { Tool } from '../types';

export const TOOLS: Tool[] = [
  { id: 'clean', label: 'தூய தமிழ்', hint: 'எதையும் ஒட்டுங்கள் → சுத்தமான தமிழ் · Anything → clean Tamil' },
  { id: 'translate', label: 'மொழிபெயர்', hint: 'ஆங்கிலம் → தமிழ் · English → Tamil' },
  { id: 'grammar', label: 'இலக்கணம்', hint: 'எழுத்துப்பிழை, இலக்கணத் திருத்தம் · Fix Tamil grammar' },
  { id: 'formal', label: 'எழுத்து நடை', hint: 'பேச்சுத் தமிழ் → எழுத்துத் தமிழ் · Formal written Tamil' },
  {
    id: 'translit',
    label: 'Tanglish → தமிழ்',
    hint: 'ஒலிபெயர்ப்பு, இணையமின்றி · Instant offline transliteration',
    offline: true,
  },
];

export const MAX_INPUT_CHARS = 20_000;
