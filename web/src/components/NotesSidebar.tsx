import { useState } from 'react';
import type { Note } from '../types';

type NotesSidebarProps = {
  notes: Note[];
  activeNoteId?: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
};

function stripHtmlPreview(html: string, maxLen = 80): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  const text = (div.textContent ?? '').trim().replace(/\s+/g, ' ');
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
}

export function NotesSidebar({ notes, activeNoteId, onSelect, onCreate, onDelete }: NotesSidebarProps) {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? notes.filter((n) => {
        const q = query.toLowerCase();
        return (
          n.title.toLowerCase().includes(q) ||
          (n.content ?? '').toLowerCase().includes(q)
        );
      })
    : notes;

  return (
    <aside className="sidebar">
      <div className="sidebarHead">
        <h2>குறிப்புகள்</h2>
        <button onClick={onCreate} aria-label="Create new note">+ புதியது</button>
      </div>

      <div className="sidebarSearch">
        <input
          type="search"
          placeholder="தேடு…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search notes"
        />
      </div>

      <div className="noteList" role="list">
        {filtered.map((note) => (
          <div key={note.id} className="noteItemWrap" role="listitem">
            <button
              className={note.id === activeNoteId ? 'noteItem active' : 'noteItem'}
              onClick={() => onSelect(note.id)}
            >
              <strong>{note.title}</strong>
              <span className="noteDate">{new Date(note.updatedAt).toLocaleDateString('ta-IN')}</span>
              <span className="notePreview">{stripHtmlPreview(note.content)}</span>
            </button>
            <button
              className="noteItemDelete"
              aria-label={`Delete note: ${note.title}`}
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`"${note.title}" நீக்கவா?`)) {
                  onDelete(note.id);
                }
              }}
            >
              ✕
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="emptyState">பொருந்தவில்லை</p>
        )}
      </div>
    </aside>
  );
}
