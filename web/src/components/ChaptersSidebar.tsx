import { useState } from 'react';
import type { Chapter } from '../types';

type ChaptersSidebarProps = {
  chapters: Chapter[];
  activeChapterId?: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onRename: (id: string, title: string) => void;
};

export function ChaptersSidebar({
  chapters,
  activeChapterId,
  onSelect,
  onCreate,
  onRename,
}: ChaptersSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const startRename = (chapter: Chapter) => {
    setEditingId(chapter.id);
    setDraft(chapter.title);
  };

  const commitRename = () => {
    if (editingId && draft.trim()) {
      onRename(editingId, draft.trim());
    }
    setEditingId(null);
  };

  return (
    <aside className="sidebar">
      <div className="sidebarHead">
        <h2>அத்தியாயங்கள்</h2>
        <button onClick={onCreate} title="புதிய அத்தியாயம்">
          + புதியது
        </button>
      </div>
      <div className="noteList">
        {chapters.map((chapter) =>
          editingId === chapter.id ? (
            <input
              key={chapter.id}
              className="chapterRename"
              value={draft}
              autoFocus
              onChange={(event) => setDraft(event.target.value)}
              onBlur={commitRename}
              onKeyDown={(event) => {
                if (event.key === 'Enter') commitRename();
                if (event.key === 'Escape') setEditingId(null);
              }}
            />
          ) : (
            <button
              key={chapter.id}
              className={chapter.id === activeChapterId ? 'noteItem active' : 'noteItem'}
              onClick={() => onSelect(chapter.id)}
              onDoubleClick={() => startRename(chapter)}
              title="இருமுறை சொடுக்கி பெயர் மாற்று"
            >
              <strong>{chapter.title}</strong>
              <span>{new Date(chapter.updatedAt).toLocaleString('ta-IN')}</span>
            </button>
          )
        )}
      </div>
    </aside>
  );
}
