import type { Note } from '../types';

export const STORAGE_KEY = 'illakiya.v2.notes';

export function createNote(partial?: Partial<Note>): Note {
  const now = Date.now();
  return {
    id: partial?.id ?? String(now),
    title: partial?.title ?? 'தலைப்பில்லா குறிப்பு',
    content: partial?.content ?? '# புதிய குறிப்பு\n\nஇங்கே எழுதத் தொடங்குங்கள்...',
    updatedAt: partial?.updatedAt ?? now,
  };
}

export function createDefaultNotes(): Note[] {
  const now = Date.now();
  return [
    createNote({
      id: 'default-yazhi',
      title: 'யாழி',
      content:
        '# யாழி\n\nயாழி என்பது தமிழ் உள்ளீட்டு அமைப்புகளுக்கான திறந்த மூல முயற்சி.\n\n## நோக்கம்\n- தாய்மொழி மையப்படுத்திய தட்டச்சு\n- தனியுரிமை மற்றும் உள்ளூர் செயலாக்கம்\n- பல தள ஆதரவு',
      updatedAt: now - 3,
    }),
    createNote({
      id: 'default-illakiya',
      title: 'இலக்கியா',
      content:
        '# இலக்கியா\n\nஇலக்கியா விசைப்பலகை PM0100 கொள்கையைப் பின்பற்றுகிறது.\n\n## முக்கிய அம்சங்கள்\n- ஒலி அடிப்படையிலான எழுத்து அமைப்பு\n- உயிர் + மெய் இணைப்பு\n- வேகமான தமிழ் தட்டச்சு அனுபவம்',
      updatedAt: now - 2,
    }),
    createNote({
      id: 'default-usage',
      title: 'பயன்பாடு',
      content:
        '# பயன்பாடு\n\nஇந்த குறிப்பேட்டில் Markdown முறையில் எழுதலாம்.\n\n## உதாரணம்\n- `# தலைப்பு`\n- `## துணைத் தலைப்பு`\n- `- பட்டியல்`\n\n**குறிப்பு:** வலப்பக்க விசைப்பலகையால் நேரடியாக தமிழ் உள்ளிடலாம்.',
      updatedAt: now - 1,
    }),
  ];
}

export function ensureStarterNotes(notes: Note[]): Note[] {
  const defaults = createDefaultNotes();
  const existingIds = new Set(notes.map((note) => note.id));
  const missing = defaults.filter((note) => !existingIds.has(note.id));
  return missing.length ? [...notes, ...missing] : notes;
}

export function parseNotes(raw: string | null): Note[] {
  if (!raw) {
    return createDefaultNotes();
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return createDefaultNotes();
    }

    const clean = parsed
      .filter((item) => item && typeof item === 'object')
      .map((item) => {
        const value = item as Partial<Note>;
        return createNote({
          id: typeof value.id === 'string' ? value.id : undefined,
          title: typeof value.title === 'string' ? value.title : undefined,
          content: typeof value.content === 'string' ? value.content : undefined,
          updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : undefined,
        });
      });

    if (!clean.length) {
      return createDefaultNotes();
    }

    return ensureStarterNotes(clean);
  } catch {
    return createDefaultNotes();
  }
}

export function extractTags(text: string): string[] {
  const matches = text.match(/#[A-Za-z0-9_\u0B80-\u0BFF-]+/g) ?? [];
  return Array.from(new Set(matches));
}
