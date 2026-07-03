import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppHeader } from './components/AppHeader';
import { EditorPane } from './components/EditorPane';
import { KeyboardDock } from './components/KeyboardDock';
import { NotesSidebar } from './components/NotesSidebar';
import { TutorPane } from './components/TutorPane';
import { keyboardRows } from './constants/keyboard';
import { lessons } from './constants/lessons';
import { STORAGE_KEY, createNote, parseNotes, updateNoteContent } from './lib/notes';
import { backspaceInContentEditable, insertInContentEditable } from './lib/pm0100';
import type { AppView, Note } from './types';

const shortcutToTamilKey: Record<string, string> = {
  // consonants
  q: 'க்', w: 'ச்', e: 'ட்', r: 'த்', t: 'ப்', y: 'ற்',
  a: 'ய்', s: 'ர்', d: 'ல்', f: 'வ்', g: 'ழ்', h: 'ள்',
  z: 'ங்', x: 'ஞ்', c: 'ண்', v: 'ந்', b: 'ம்', n: 'ன்',
  // short vowels (number row)
  '1': 'அ', '2': 'இ', '3': 'உ', '4': 'எ', '5': 'ஒ',
  // short vowels (letter aliases)
  u: 'அ', i: 'இ', o: 'உ', p: 'எ', '[': 'ஒ',
  // long vowels
  '6': 'ஆ', '7': 'ஈ', '8': 'ஊ', '9': 'ஏ', '0': 'ஓ',
};

export default function App() {
  const [view, setView] = useState<AppView>('editor');
  const [notes, setNotes] = useState<Note[]>(() => parseNotes(localStorage.getItem(STORAGE_KEY)));
  const [activeNoteId, setActiveNoteId] = useState<string>(() => {
    const loaded = parseNotes(localStorage.getItem(STORAGE_KEY));
    return loaded[0]?.id ?? createNote().id;
  });

  const editorRef = useRef<HTMLDivElement>(null);

  const activeNote = useMemo(
    () => notes.find((n) => n.id === activeNoteId) ?? notes[0],
    [notes, activeNoteId],
  );

  const sortedNotes = useMemo(() => [...notes].sort((a, b) => b.updatedAt - a.updatedAt), [notes]);

  // Persist on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const createNewNote = useCallback(() => {
    const note = createNote();
    setNotes((prev) => [note, ...prev]);
    setActiveNoteId(note.id);
  }, []);

  const deleteNote = useCallback(
    (id: string) => {
      setNotes((prev) => {
        const next = prev.filter((n) => n.id !== id);
        if (next.length === 0) {
          const fresh = createNote();
          setActiveNoteId(fresh.id);
          return [fresh];
        }
        if (id === activeNoteId) {
          setActiveNoteId(next[0].id);
        }
        return next;
      });
    },
    [activeNoteId],
  );

  // Called by EditorPane's onInput — reads innerHTML and persists
  const handleEditorInput = useCallback(() => {
    const el = editorRef.current;
    if (!el || !activeNote) return;
    const html = el.innerHTML;
    setNotes((prev) =>
      prev.map((n) => (n.id === activeNote.id ? updateNoteContent(n, html) : n)),
    );
  }, [activeNote]);

  // Keyboard shortcut → Tamil insertion in the contenteditable
  const handleEditorKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      if (event.key === 'Backspace') {
        const el = editorRef.current;
        if (!el) return;
        event.preventDefault();
        backspaceInContentEditable(el);
        return;
      }

      const mapped = shortcutToTamilKey[event.key.toLowerCase()];
      if (!mapped) return;
      event.preventDefault();
      const el = editorRef.current;
      if (el) insertInContentEditable(el, mapped);
    },
    [],
  );

  // Keyboard dock presses
  const handleDockKey = useCallback((value: string) => {
    const el = editorRef.current;
    if (el) insertInContentEditable(el, value);
  }, []);

  const handleDockSpace = useCallback(() => {
    const el = editorRef.current;
    if (el) {
      el.focus();
      document.execCommand('insertText', false, ' ');
    }
  }, []);

  const handleDockBackspace = useCallback(() => {
    const el = editorRef.current;
    if (el) backspaceInContentEditable(el);
  }, []);

  const exportNote = useCallback(() => {
    if (!activeNote) return;
    const blob = new Blob([activeNote.content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeNote.title || 'illakiya'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeNote]);

  return (
    <main className="appShell">
      <AppHeader view={view} onChangeView={setView} />

      {view === 'tutor' ? (
        <div className="tutorWrap">
          <TutorPane lessons={lessons} />
        </div>
      ) : (
        <section className="editorLayout">
          <NotesSidebar
            notes={sortedNotes}
            activeNoteId={activeNote?.id}
            onSelect={setActiveNoteId}
            onCreate={createNewNote}
            onDelete={deleteNote}
          />

          <div className="editorMain">
            <EditorPane
              activeNote={activeNote}
              editorRef={editorRef}
              onInput={handleEditorInput}
              onExport={exportNote}
              onKeyDown={handleEditorKeyDown}
            />
            <KeyboardDock
              rows={keyboardRows}
              onKey={handleDockKey}
              onSpace={handleDockSpace}
              onBackspace={handleDockBackspace}
            />
          </div>
        </section>
      )}
    </main>
  );
}
