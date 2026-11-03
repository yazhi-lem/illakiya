import type { Intent, Tool } from '../types';

export const TOOLS: Tool[] = [
  {
    id: 'auto',
    label: 'தானியங்கு',
    hint: 'எதையும் எழுதுங்கள் — தேவையை இலக்கியா தானே அறியும் · Auto: Illakiya works out what you need',
    placeholder: 'கேளுங்கள், எழுதச் சொல்லுங்கள், அல்லது ஒட்டுங்கள்…',
  },
  {
    id: 'research',
    label: 'ஆய்ந்தெழுது',
    hint: 'விக்கிப்பீடியாவில் தேடி, உண்மைகளுடன் எழுதும் · Research & write',
    placeholder: 'எதைப் பற்றி ஆய்ந்து எழுத வேண்டும்?',
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

/** Labels for what Illakiya did with a message. */
export const INTENT_LABELS: Record<Intent, string> = {
  write: 'எழுதுதல்',
  research: 'ஆய்ந்து எழுதுதல்',
  clean: 'தூய தமிழாக்கம்',
  translate: 'மொழிபெயர்ப்பு',
  grammar: 'இலக்கணத் திருத்தம்',
  formal: 'எழுத்து நடை',
  revise: 'திருத்தி எழுதுதல்',
};

export const MAX_INPUT_CHARS = 20_000;
