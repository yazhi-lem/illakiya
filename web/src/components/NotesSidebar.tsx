import type { Note } from '../types';

type NotesSidebarProps = {
  notes: Note[];
  activeNoteId?: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
};

export function NotesSidebar({ notes, activeNoteId, onSelect, onCreate }: NotesSidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebarHead">
        <h2>குறிப்புகள்</h2>
        <button onClick={onCreate}>+ புதியது</button>
      </div>
      <div className="noteList">
        {notes.map((note) => (
          <button
            key={note.id}
            className={note.id === activeNoteId ? 'noteItem active' : 'noteItem'}
            onClick={() => onSelect(note.id)}
          >
            <strong>{note.title}</strong>
            <span>{new Date(note.updatedAt).toLocaleString('ta-IN')}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
