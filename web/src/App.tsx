import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { AppHeader } from './components/AppHeader';
import { EditorPane } from './components/EditorPane';
import { KeyboardDock } from './components/KeyboardDock';
import { NotesSidebar } from './components/NotesSidebar';
import { TutorPane } from './components/TutorPane';
import { keyboardRows } from './constants/keyboard';
import { lessons } from './constants/lessons';
import { STORAGE_KEY, createNote, extractTags, parseNotes } from './lib/notes';
import { composePm0100, revertPm0100Composition } from './lib/pm0100';
import type { AppView, Note } from './types';

const shortcutToTamilKey: Record<string, string> = {
  q: 'க்',
  w: 'ச்',
  e: 'ட்',
  r: 'த்',
  t: 'ப்',
  y: 'ற்',
  a: 'ய்',
  s: 'ர்',
  d: 'ல்',
  f: 'வ்',
  g: 'ழ்',
  h: 'ள்',
  z: 'ங்',
  x: 'ஞ்',
  c: 'ண்',
  v: 'ந்',
  b: 'ம்',
  n: 'ன்',
  '1': 'அ',
  '2': 'இ',
  '3': 'உ',
  '4': 'எ',
  '5': 'ஒ',
  u: 'அ',
  i: 'இ',
  o: 'உ',
  p: 'எ',
  '[': 'ஒ',
};

export default function App() {
  const [view, setView] = useState<AppView>('editor');
  const [notes, setNotes] = useState<Note[]>(() => parseNotes(localStorage.getItem(STORAGE_KEY)));
  const [activeNoteId, setActiveNoteId] = useState<string>(() => {
    const loaded = parseNotes(localStorage.getItem(STORAGE_KEY));
    return loaded[0]?.id ?? createNote().id;
  });

  const activeNote = useMemo(() => {
    return notes.find((note) => note.id === activeNoteId) ?? notes[0];
  }, [notes, activeNoteId]);

  const sortedNotes = useMemo(
    () => [...notes].sort((a, b) => b.updatedAt - a.updatedAt),
    [notes]
  );

  const activeTags = useMemo(() => extractTags(activeNote?.content ?? ''), [activeNote]);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const createNewNote = () => {
    const note = createNote();
    setNotes((prev) => [note, ...prev]);
    setActiveNoteId(note.id);
  };

  const updateActiveNote = (nextContent: string) => {
    if (!activeNote) {
      return;
    }

    setNotes((prev) =>
      prev.map((note) => {
        if (note.id !== activeNote.id) {
          return note;
        }

        const firstLine = nextContent
          .split('\n')
          .find((line) => line.trim().length > 0)
          ?.replace(/^#+\s*/, '')
          .trim();

        return {
          ...note,
          content: nextContent,
          title: firstLine || 'தலைப்பில்லா குறிப்பு',
          updatedAt: Date.now(),
        };
      })
    );
  };

  const updateActiveAndSelection = (nextContent: string, nextSelection: number) => {
    updateActiveNote(nextContent);
    requestAnimationFrame(() => {
      const editor = editorRef.current;
      if (!editor) {
        return;
      }
      editor.focus();
      editor.setSelectionRange(nextSelection, nextSelection);
    });
  };

  const insertTextAtCursor = (value: string) => {
    const editor = editorRef.current;
    if (!activeNote || !editor) {
      return;
    }

    const start = editor.selectionStart ?? activeNote.content.length;
    const end = editor.selectionEnd ?? activeNote.content.length;
    const before = activeNote.content.slice(0, start);
    const after = activeNote.content.slice(end);

    const composed = composePm0100(before, value);
    const next = `${composed.before}${composed.inserted}${after}`;
    const caret = composed.before.length + composed.inserted.length;
    updateActiveAndSelection(next, caret);
  };

  const backspaceAtCursor = () => {
    const editor = editorRef.current;
    if (!activeNote || !editor) {
      return;
    }

    const start = editor.selectionStart ?? activeNote.content.length;
    const end = editor.selectionEnd ?? activeNote.content.length;

    if (start !== end) {
      const next = `${activeNote.content.slice(0, start)}${activeNote.content.slice(end)}`;
      updateActiveAndSelection(next, start);
      return;
    }

    if (start <= 0) {
      return;
    }

    const before = activeNote.content.slice(0, start);
    const after = activeNote.content.slice(start);

    const reverted = revertPm0100Composition(before);
    if (reverted.changed) {
      const next = `${reverted.value}${after}`;
      updateActiveAndSelection(next, reverted.value.length);
      return;
    }

    const next = `${activeNote.content.slice(0, start - 1)}${activeNote.content.slice(start)}`;
    updateActiveAndSelection(next, start - 1);
  };

  const exportText = () => {
    if (!activeNote) {
      return;
    }

    const blob = new Blob([activeNote.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${activeNote.title || 'illakiya-note'}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const shareToWhatsapp = () => {
    if (!activeNote) {
      return;
    }
    const message = encodeURIComponent(activeNote.content.slice(0, 1500));
    window.open(`https://wa.me/?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  const shareToSignal = () => {
    if (!activeNote) {
      return;
    }
    const message = encodeURIComponent(activeNote.content.slice(0, 1500));
    window.open(`https://signal.me/#p?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  const handleEditorKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    if (event.key === 'Backspace') {
      event.preventDefault();
      backspaceAtCursor();
      return;
    }

    if (event.key === ' ') {
      event.preventDefault();
      insertTextAtCursor(' ');
      return;
    }

    const mapped = shortcutToTamilKey[event.key.toLowerCase()];
    if (!mapped) {
      return;
    }

    event.preventDefault();
    insertTextAtCursor(mapped);
  };

  return (
    <main className="appShell">
      <AppHeader view={view} onChangeView={setView} />

      {view === 'tutor' ? (
        <TutorPane lessons={lessons} />
      ) : (
        <section className="editorLayout withKeyboard">
          <NotesSidebar
            notes={sortedNotes}
            activeNoteId={activeNote?.id}
            onSelect={setActiveNoteId}
            onCreate={createNewNote}
          />

          <EditorPane
            activeNote={activeNote}
            activeTags={activeTags}
            editorRef={editorRef}
            onChangeContent={updateActiveNote}
            onKeyDown={handleEditorKeyDown}
            onExportText={exportText}
            onShareWhatsapp={shareToWhatsapp}
            onShareSignal={shareToSignal}
          />

          <KeyboardDock
            rows={keyboardRows}
            onKey={insertTextAtCursor}
            onSpace={() => insertTextAtCursor(' ')}
            onBackspace={backspaceAtCursor}
          />
        </section>
      )}
    </main>
  );
}
