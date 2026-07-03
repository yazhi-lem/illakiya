import type { Note } from '../types';

export const STORAGE_KEY = 'illakiya.v3.notes';

function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent ?? '';
}

function titleFromHtml(html: string): string {
  const text = stripHtml(html);
  return text.split('\n').find((l) => l.trim().length > 0)?.trim() || 'தலைப்பில்லா குறிப்பு';
}

export function createNote(partial?: Partial<Note>): Note {
  const now = Date.now();
  return {
    id: partial?.id ?? String(now),
    title: partial?.title ?? 'தலைப்பில்லா குறிப்பு',
    content: partial?.content ?? '<p><br></p>',
    updatedAt: partial?.updatedAt ?? now,
    createdAt: partial?.createdAt ?? now,
  };
}

function makeDefaultNote(id: string, title: string, bodyHtml: string, offset: number): Note {
  const now = Date.now();
  return {
    id,
    title,
    content: bodyHtml,
    updatedAt: now - offset,
    createdAt: now - offset - 86400000,
  };
}

export function createDefaultNotes(): Note[] {
  return [
    makeDefaultNote(
      'default-yazhi',
      'யாழி',
      '<h1>யாழி</h1><p>யாழி என்பது தமிழ் உள்ளீட்டு அமைப்புகளுக்கான திறந்த மூல முயற்சி.</p><h2>நோக்கம்</h2><ul><li>தாய்மொழி மையப்படுத்திய தட்டச்சு</li><li>தனியுரிமை மற்றும் உள்ளூர் செயலாக்கம்</li><li>பல தள ஆதரவு</li></ul>',
      3000,
    ),
    makeDefaultNote(
      'default-illakiya',
      'இலக்கியா',
      '<h1>இலக்கியா</h1><p>இலக்கியா விசைப்பலகை <strong>PM0100</strong> கொள்கையைப் பின்பற்றுகிறது.</p><h2>முக்கிய அம்சங்கள்</h2><ul><li>ஒலி அடிப்படையிலான எழுத்து அமைப்பு</li><li>உயிர் + மெய் இணைப்பு</li><li>வேகமான தமிழ் தட்டச்சு அனுபவம்</li></ul>',
      2000,
    ),
    makeDefaultNote(
      'default-usage',
      'பயன்பாடு',
      '<h1>பயன்பாடு</h1><p>விசைப்பலகை பயன்படுத்தி <strong>நேரடியாக தமிழில்</strong> தட்டச்சு செய்யலாம்.</p><h2>வடிவமைப்பு கட்டுப்பாடுகள்</h2><ul><li><strong>தடித்த</strong> — B அல்லது ⌘B</li><li><em>சாய்வு</em> — I அல்லது ⌘I</li><li><u>கீழோடு</u> — U அல்லது ⌘U</li></ul>',
      1000,
    ),
  ];
}

export function ensureStarterNotes(notes: Note[]): Note[] {
  const defaults = createDefaultNotes();
  const existingIds = new Set(notes.map((n) => n.id));
  const missing = defaults.filter((n) => !existingIds.has(n.id));
  return missing.length ? [...notes, ...missing] : notes;
}

export function parseNotes(raw: string | null): Note[] {
  if (!raw) return createDefaultNotes();

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return createDefaultNotes();

    const now = Date.now();
    const clean = parsed
      .filter((item) => item && typeof item === 'object')
      .map((item) => {
        const v = item as Partial<Note>;
        return createNote({
          id: typeof v.id === 'string' ? v.id : undefined,
          title: typeof v.title === 'string' ? v.title : undefined,
          content: typeof v.content === 'string' ? v.content : undefined,
          updatedAt: typeof v.updatedAt === 'number' ? v.updatedAt : undefined,
          createdAt: typeof v.createdAt === 'number' ? v.createdAt : now,
        });
      });

    if (!clean.length) return createDefaultNotes();
    return ensureStarterNotes(clean);
  } catch {
    return createDefaultNotes();
  }
}

export function updateNoteContent(note: Note, html: string): Note {
  return {
    ...note,
    content: html,
    title: titleFromHtml(html),
    updatedAt: Date.now(),
  };
}

export function extractTags(text: string): string[] {
  const matches = text.match(/#[A-Za-z0-9_஀-௿-]+/g) ?? [];
  return Array.from(new Set(matches));
}

export function wordCount(html: string): number {
  const text = stripHtml(html);
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}
