import type { Chapter } from '../types';

export const STORAGE_KEY = 'illakiya.book.chapters';
// Previous notes app key — migrated on first load so nobody loses their writing.
const LEGACY_KEY = 'illakiya.v2.notes';

export function createChapter(partial?: Partial<Chapter>): Chapter {
  const now = Date.now();
  return {
    id: partial?.id ?? String(now) + Math.random().toString(36).slice(2, 6),
    title: partial?.title ?? 'தலைப்பில்லா அத்தியாயம்',
    content: partial?.content ?? '# புதிய அத்தியாயம்\n\nஇங்கே எழுதத் தொடங்குங்கள்...',
    order: partial?.order ?? now,
    updatedAt: partial?.updatedAt ?? now,
  };
}

export function createDefaultChapters(): Chapter[] {
  const now = Date.now();
  return [
    createChapter({
      id: 'ch-mun',
      title: 'முன்னுரை',
      order: 0,
      content:
        '# முன்னுரை\n\nஇலக்கியா ஒரு தமிழ் நூல் திருத்தி. Taglish எழுதி நேரடியாகத் தமிழாக மாற்றலாம்.\n\nஉதாரணம்: "vaNakkam" என எழுதினால் வணக்கம் தோன்றும்.',
      updatedAt: now - 2,
    }),
    createChapter({
      id: 'ch-1',
      title: 'அத்தியாயம் 1',
      order: 1,
      content: '# அத்தியாயம் 1\n\n',
      updatedAt: now - 1,
    }),
  ];
}

export function ensureStarterChapters(chapters: Chapter[]): Chapter[] {
  return chapters.length ? chapters : createDefaultChapters();
}

function coerce(raw: unknown): Chapter[] | null {
  if (!Array.isArray(raw)) return null;
  const clean = raw
    .filter((item) => item && typeof item === 'object')
    .map((item, index) => {
      const value = item as Partial<Chapter> & { updatedAt?: number };
      return createChapter({
        id: typeof value.id === 'string' ? value.id : undefined,
        title: typeof value.title === 'string' ? value.title : undefined,
        content: typeof value.content === 'string' ? value.content : undefined,
        order: typeof value.order === 'number' ? value.order : index,
        updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : undefined,
      });
    });
  return clean.length ? clean : null;
}

export function loadChapters(): Chapter[] {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) {
      const parsed = coerce(JSON.parse(current));
      if (parsed) return parsed;
    }
    // One-time migration from the old notes app.
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const parsed = coerce(JSON.parse(legacy));
      if (parsed) return parsed;
    }
  } catch {
    // fall through to defaults
  }
  return createDefaultChapters();
}

export function chapterWordCount(content: string): number {
  const words = content
    .replace(/[#*_>`~-]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return content.trim() ? words.length : 0;
}

export function extractTags(text: string): string[] {
  const matches = text.match(/#[A-Za-z0-9_஀-௿-]+/g) ?? [];
  return Array.from(new Set(matches));
}
