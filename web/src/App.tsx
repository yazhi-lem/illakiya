import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { AppHeader } from './components/AppHeader';
import { EditorPane } from './components/EditorPane';
import { KeyboardDock } from './components/KeyboardDock';
import { ChaptersSidebar } from './components/ChaptersSidebar';
import { TutorPane } from './components/TutorPane';
import { keyboardRows } from './constants/keyboard';
import { lessons } from './constants/lessons';
import {
  STORAGE_KEY,
  chapterWordCount,
  createChapter,
  loadChapters,
} from './lib/chapters';
import { composePm0100, revertPm0100Composition } from './lib/pm0100';
import { transliterateLive } from './lib/translit';
import { autoCorrect, loadNativeEngine, suggest } from './lib/engine';
import type { AppView, Chapter } from './types';

// Live-transliteration state for the word currently being typed at the caret.
type RomanState = { buffer: string; wordStart: number; tamilLen: number };

function currentWordInfo(content: string, caret: number): { word: string; start: number } {
  let start = caret;
  while (start > 0 && !/\s/.test(content[start - 1])) start -= 1;
  return { word: content.slice(start, caret), start };
}

export default function App() {
  const [view, setView] = useState<AppView>('editor');
  const [chapters, setChapters] = useState<Chapter[]>(() => loadChapters());
  const [activeChapterId, setActiveChapterId] = useState<string>(() => loadChapters()[0]?.id ?? '');
  const [taglishMode, setTaglishMode] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [correction, setCorrection] = useState<string | null>(null);
  const [backend, setBackend] = useState<'wasm' | 'ts'>('ts');

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const romanRef = useRef<RomanState>({ buffer: '', wordStart: 0, tamilLen: 0 });
  // Authoritative editing state, updated synchronously so rapid keystrokes never
  // read stale values between React renders.
  const contentRef = useRef<string>('');
  const caretRef = useRef<number>(0);

  const sortedChapters = useMemo(
    () => [...chapters].sort((a, b) => a.order - b.order),
    [chapters]
  );
  const activeChapter = useMemo(
    () => chapters.find((c) => c.id === activeChapterId) ?? sortedChapters[0],
    [chapters, activeChapterId, sortedChapters]
  );
  const wordCount = useMemo(
    () => (activeChapter ? chapterWordCount(activeChapter.content) : 0),
    [activeChapter]
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chapters));
  }, [chapters]);

  useEffect(() => {
    loadNativeEngine().then((b) => setBackend(b));
  }, []);

  // Re-sync editing refs when the active chapter changes (switch / initial load).
  useEffect(() => {
    contentRef.current = activeChapter?.content ?? '';
    caretRef.current = 0;
    romanRef.current = { buffer: '', wordStart: 0, tamilLen: 0 };
    setSuggestions([]);
    setCorrection(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChapterId]);

  const resetRoman = (caret: number) => {
    romanRef.current = { buffer: '', wordStart: caret, tamilLen: 0 };
  };

  const refreshSuggestions = (content: string, caret: number) => {
    const { word } = currentWordInfo(content, caret);
    if (!word) {
      setSuggestions([]);
      setCorrection(null);
      return;
    }
    setSuggestions(suggest(word, 6));
    setCorrection(autoCorrect(romanRef.current.buffer, word));
  };

  const writeChapter = (nextContent: string) => {
    const id = activeChapter?.id;
    if (!id) return;
    setChapters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, content: nextContent, updatedAt: Date.now() } : c))
    );
  };

  // Single source of truth for an edit: update refs + DOM synchronously, then
  // React state (whose value prop will match the DOM), then suggestions.
  const commit = (next: string, caret: number) => {
    contentRef.current = next;
    caretRef.current = caret;
    const editor = editorRef.current;
    if (editor) {
      editor.value = next;
      editor.setSelectionRange(caret, caret);
    }
    writeChapter(next);
    refreshSuggestions(next, caret);
  };

  const readSelection = () => {
    const editor = editorRef.current;
    const domS = editor?.selectionStart ?? caretRef.current;
    const domE = editor?.selectionEnd ?? domS;
    if (domS !== domE) return { s: domS, en: domE };
    return { s: caretRef.current, en: caretRef.current };
  };

  const handleChange = (value: string) => {
    contentRef.current = value;
    const editor = editorRef.current;
    const caret = editor?.selectionStart ?? value.length;
    caretRef.current = caret;
    resetRoman(caret);
    writeChapter(value);
    refreshSuggestions(value, caret);
  };

  const handleSelect = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const collapsed = editor.selectionStart === editor.selectionEnd;
    const caret = editor.selectionStart ?? 0;
    caretRef.current = caret;
    const st = romanRef.current;
    const aligned = collapsed && st.buffer.length > 0 && caret === st.wordStart + st.tamilLen;
    if (!aligned) resetRoman(caret);
    refreshSuggestions(contentRef.current, caret);
  };

  // Live Taglish IME. Letters transliterate into the in-progress word; spaces
  // and punctuation commit it; backspace rewinds the roman buffer.
  const handleEditorKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (!activeChapter) return;

    const key = event.key;
    const { s, en } = readSelection();
    const content = contentRef.current;
    const st = romanRef.current;

    // Navigation and other non-text keys: drop the buffer, let the browser act.
    if (key.length !== 1 && key !== 'Backspace' && key !== 'Enter') {
      resetRoman(s);
      return;
    }

    if (!taglishMode) {
      // Raw typing: let the textarea handle it; refresh suggestions afterwards.
      requestAnimationFrame(() => {
        const e2 = editorRef.current;
        if (e2) {
          contentRef.current = e2.value;
          caretRef.current = e2.selectionStart ?? 0;
          refreshSuggestions(e2.value, caretRef.current);
        }
      });
      return;
    }

    const aligned = st.buffer.length > 0 && s === en && s === st.wordStart + st.tamilLen;

    if (key === 'Backspace') {
      event.preventDefault();
      if (aligned && st.buffer.length > 0) {
        const newBuffer = st.buffer.slice(0, -1);
        const tamil = transliterateLive(newBuffer);
        const next = content.slice(0, st.wordStart) + tamil + content.slice(s);
        const caret = st.wordStart + tamil.length;
        st.buffer = newBuffer;
        st.tamilLen = tamil.length;
        if (!newBuffer) st.wordStart = caret;
        commit(next, caret);
        return;
      }
      let next: string;
      let caret: number;
      if (s !== en) {
        next = content.slice(0, s) + content.slice(en);
        caret = s;
      } else if (s > 0) {
        next = content.slice(0, s - 1) + content.slice(s);
        caret = s - 1;
      } else {
        return;
      }
      resetRoman(caret);
      commit(next, caret);
      return;
    }

    if (key === 'Enter') {
      event.preventDefault();
      const next = content.slice(0, s) + '\n' + content.slice(en);
      const caret = s + 1;
      resetRoman(caret);
      commit(next, caret);
      return;
    }

    // Single printable character.
    event.preventDefault();
    if (/[A-Za-z]/.test(key)) {
      const from = aligned ? st.wordStart : s;
      const newBuffer = (aligned ? st.buffer : '') + key;
      const tamil = transliterateLive(newBuffer);
      const next = content.slice(0, from) + tamil + content.slice(en);
      const caret = from + tamil.length;
      st.buffer = newBuffer;
      st.wordStart = from;
      st.tamilLen = tamil.length;
      commit(next, caret);
    } else {
      // space / digit / punctuation — commit the word, insert literally.
      const next = content.slice(0, s) + key + content.slice(en);
      const caret = s + key.length;
      resetRoman(caret);
      commit(next, caret);
    }
  };

  // On-screen PM0100 keyboard (direct Tamil, uses the composition helper).
  const insertTextAtCursor = (value: string) => {
    if (!activeChapter) return;
    const { s, en } = readSelection();
    const content = contentRef.current;
    const before = content.slice(0, s);
    const after = content.slice(en);
    const composed = composePm0100(before, value);
    const next = `${composed.before}${composed.inserted}${after}`;
    const caret = composed.before.length + composed.inserted.length;
    resetRoman(caret);
    commit(next, caret);
    editorRef.current?.focus();
  };

  const backspaceAtCursor = () => {
    if (!activeChapter) return;
    const { s, en } = readSelection();
    const content = contentRef.current;
    if (s !== en) {
      resetRoman(s);
      commit(content.slice(0, s) + content.slice(en), s);
      editorRef.current?.focus();
      return;
    }
    if (s <= 0) return;
    const before = content.slice(0, s);
    const after = content.slice(s);
    const reverted = revertPm0100Composition(before);
    if (reverted.changed) {
      resetRoman(reverted.value.length);
      commit(`${reverted.value}${after}`, reverted.value.length);
    } else {
      resetRoman(s - 1);
      commit(content.slice(0, s - 1) + content.slice(s), s - 1);
    }
    editorRef.current?.focus();
  };

  const pickSuggestion = (word: string) => {
    if (!activeChapter) return;
    const content = contentRef.current;
    const caret = caretRef.current;
    const { start } = currentWordInfo(content, caret);
    const next = content.slice(0, start) + word + content.slice(caret);
    const newCaret = start + word.length;
    resetRoman(newCaret);
    commit(next, newCaret);
    editorRef.current?.focus();
  };

  const handleTranscript = (text: string) => {
    if (!activeChapter) return;
    const { s, en } = readSelection();
    const content = contentRef.current;
    const next = content.slice(0, s) + text + content.slice(en);
    const caret = s + text.length;
    resetRoman(caret);
    commit(next, caret);
  };

  const createNewChapter = () => {
    const maxOrder = chapters.reduce((m, c) => Math.max(m, c.order), -1);
    const n = chapters.length + 1;
    const chapter = createChapter({
      title: `அத்தியாயம் ${n}`,
      order: maxOrder + 1,
      content: `# அத்தியாயம் ${n}\n\n`,
    });
    setChapters((prev) => [...prev, chapter]);
    setActiveChapterId(chapter.id);
  };

  const renameChapter = (id: string, title: string) => {
    setChapters((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
  };

  const toggleTaglish = () => {
    resetRoman(caretRef.current);
    setTaglishMode((prev) => !prev);
    editorRef.current?.focus();
  };

  const exportText = () => {
    if (!activeChapter) return;
    const blob = new Blob([activeChapter.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${activeChapter.title || 'illakiya-chapter'}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const shareToWhatsapp = () => {
    if (!activeChapter) return;
    const message = encodeURIComponent(activeChapter.content.slice(0, 1500));
    window.open(`https://wa.me/?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  const shareToSignal = () => {
    if (!activeChapter) return;
    const message = encodeURIComponent(activeChapter.content.slice(0, 1500));
    window.open(`https://signal.me/#p?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <main className="appShell">
      <AppHeader view={view} onChangeView={setView} backend={backend} />

      {view === 'tutor' ? (
        <TutorPane lessons={lessons} />
      ) : (
        <section className="editorLayout withKeyboard">
          <ChaptersSidebar
            chapters={sortedChapters}
            activeChapterId={activeChapter?.id}
            onSelect={setActiveChapterId}
            onCreate={createNewChapter}
            onRename={renameChapter}
          />

          <EditorPane
            activeChapter={activeChapter}
            wordCount={wordCount}
            taglishMode={taglishMode}
            onToggleTaglish={toggleTaglish}
            editorRef={editorRef}
            onChangeContent={handleChange}
            onKeyDown={handleEditorKeyDown}
            onSelect={handleSelect}
            onTranscript={handleTranscript}
            suggestions={suggestions}
            correction={correction}
            onPickSuggestion={pickSuggestion}
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
