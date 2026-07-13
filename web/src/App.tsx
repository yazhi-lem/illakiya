import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { AppHeader } from './components/AppHeader';
import { EditorPane } from './components/EditorPane';
import { KeyboardDock } from './components/KeyboardDock';
import { ChaptersSidebar } from './components/ChaptersSidebar';
import {
  keyboardRows,
  kurilToNedil,
  pm0100KeyHints,
  qwertyToPm0100,
} from './constants/keyboard';
import {
  STORAGE_KEY,
  chapterWordCount,
  createChapter,
  loadChapters,
} from './lib/chapters';
import { composePm0100, revertPm0100Composition } from './lib/pm0100';
import { transliterateWord } from './lib/translit';
import { suggest } from './lib/engine';
import type { Chapter, InputMode } from './types';

function currentWordInfo(content: string, caret: number): { word: string; start: number } {
  let start = caret;
  while (start > 0 && !/\s/.test(content[start - 1])) start -= 1;
  return { word: content.slice(start, caret), start };
}

const isRomanWord = (word: string) => /[A-Za-z]/.test(word);

export default function App() {
  const [chapters, setChapters] = useState<Chapter[]>(() => loadChapters());
  const [activeChapterId, setActiveChapterId] = useState<string>(() => loadChapters()[0]?.id ?? '');
  const [inputMode, setInputMode] = useState<InputMode>('taglish');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  // The recommended Tamil equivalent of the in-progress Taglish word (Tab accepts).
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const flashTimer = useRef<number | undefined>(undefined);
  // Authoritative editing state, updated synchronously so keyboard/Tab actions
  // never read stale values between React renders.
  const contentRef = useRef<string>('');
  const caretRef = useRef<number>(0);
  const recommendationRef = useRef<string | null>(null);

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

  // Re-sync editing refs when the active chapter changes (switch / initial load).
  useEffect(() => {
    contentRef.current = activeChapter?.content ?? '';
    caretRef.current = 0;
    setSuggestions([]);
    setRecommendation(null);
    recommendationRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChapterId]);

  // Briefly highlight the matching on-screen key when a physical key is pressed.
  const flashKey = (char: string) => {
    setActiveKey(char);
    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setActiveKey(null), 150);
  };

  // Recompute the recommendation (Taglish → Tamil) and dictionary suggestions
  // for the word at the caret.
  const refreshRecommendations = (content: string, caret: number) => {
    const { word } = currentWordInfo(content, caret);
    if (!word) {
      setRecommendation(null);
      recommendationRef.current = null;
      setSuggestions([]);
      return;
    }
    if (inputMode === 'taglish' && isRomanWord(word)) {
      const tamil = transliterateWord(word);
      recommendationRef.current = tamil;
      setRecommendation(tamil);
      setSuggestions(suggest(tamil, 5));
    } else {
      recommendationRef.current = null;
      setRecommendation(null);
      setSuggestions(inputMode === 'english' ? [] : suggest(word, 6));
    }
  };

  const writeChapter = (nextContent: string) => {
    const id = activeChapter?.id;
    if (!id) return;
    setChapters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, content: nextContent, updatedAt: Date.now() } : c))
    );
  };

  // Single source of truth for a programmatic edit (on-screen keyboard, Tab
  // accept, suggestion pick): update refs + DOM synchronously, then React state.
  const commit = (next: string, caret: number) => {
    contentRef.current = next;
    caretRef.current = caret;
    const editor = editorRef.current;
    if (editor) {
      editor.value = next;
      editor.setSelectionRange(caret, caret);
    }
    writeChapter(next);
    refreshRecommendations(next, caret);
  };

  const readSelection = () => {
    const editor = editorRef.current;
    const domS = editor?.selectionStart ?? caretRef.current;
    const domE = editor?.selectionEnd ?? domS;
    if (domS !== domE) return { s: domS, en: domE };
    return { s: caretRef.current, en: caretRef.current };
  };

  // Free-typed input (Taglish roman text, or raw English) flows through the
  // normal controlled textarea; we just keep refs + recommendations in sync.
  const handleChange = (value: string) => {
    contentRef.current = value;
    const editor = editorRef.current;
    const caret = editor?.selectionStart ?? value.length;
    caretRef.current = caret;
    writeChapter(value);
    refreshRecommendations(value, caret);
  };

  const handleSelect = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const caret = editor.selectionStart ?? 0;
    caretRef.current = caret;
    refreshRecommendations(contentRef.current, caret);
  };

  // Replace the in-progress Taglish word with its recommended Tamil equivalent.
  const acceptRecommendation = () => {
    const tamil = recommendationRef.current;
    if (!tamil) return;
    const content = contentRef.current;
    const caret = caretRef.current;
    const { word, start } = currentWordInfo(content, caret);
    if (!word) return;
    const next = content.slice(0, start) + tamil + content.slice(caret);
    commit(next, start + tamil.length);
    editorRef.current?.focus();
  };

  const handleEditorKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (!activeChapter) return;
    const key = event.key;

    // PM0100: laptop QWERTY keys drive the Tamil layout; Shift on a vowel = nedil.
    if (inputMode === 'pm0100') {
      if (key === 'Backspace') {
        event.preventDefault();
        backspaceAtCursor();
        return;
      }
      if (key === 'Enter') {
        event.preventDefault();
        insertTextAtCursor('\n');
        return;
      }
      if (key === ' ') {
        event.preventDefault();
        insertTextAtCursor(' ');
        return;
      }
      const entry = qwertyToPm0100[event.code];
      if (entry) {
        event.preventDefault();
        const char =
          entry.isVowel && event.shiftKey ? kurilToNedil[entry.char] ?? entry.char : entry.char;
        insertTextAtCursor(char);
        flashKey(entry.char);
      }
      // Unmapped keys (punctuation, digits, navigation) fall through to default.
      return;
    }

    // Taglish: Tab completes the in-progress roman word to its Tamil equivalent.
    if (inputMode === 'taglish' && key === 'Tab' && recommendationRef.current) {
      event.preventDefault();
      acceptRecommendation();
      return;
    }
    // Everything else (Taglish roman typing, ABC English) is plain typing;
    // handleChange keeps refs + recommendations in sync.
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
    commit(next, caret);
    editorRef.current?.focus();
  };

  const backspaceAtCursor = () => {
    if (!activeChapter) return;
    const { s, en } = readSelection();
    const content = contentRef.current;
    if (s !== en) {
      commit(content.slice(0, s) + content.slice(en), s);
      editorRef.current?.focus();
      return;
    }
    if (s <= 0) return;
    const before = content.slice(0, s);
    const after = content.slice(s);
    const reverted = revertPm0100Composition(before);
    if (reverted.changed) {
      commit(`${reverted.value}${after}`, reverted.value.length);
    } else {
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
    commit(next, start + word.length);
    editorRef.current?.focus();
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

  const changeMode = (mode: InputMode) => {
    setInputMode(mode);
    setRecommendation(null);
    recommendationRef.current = null;
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

  return (
    <main className="appShell">
      <AppHeader />

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
          inputMode={inputMode}
          onChangeMode={changeMode}
          editorRef={editorRef}
          onChangeContent={handleChange}
          onKeyDown={handleEditorKeyDown}
          onSelect={handleSelect}
          suggestions={suggestions}
          recommendation={recommendation}
          onPickSuggestion={pickSuggestion}
          onExportText={exportText}
        />

        <KeyboardDock
          rows={keyboardRows}
          hints={pm0100KeyHints}
          nedilMap={kurilToNedil}
          activeKey={activeKey}
          onKey={insertTextAtCursor}
          onSpace={() => insertTextAtCursor(' ')}
          onBackspace={backspaceAtCursor}
        />
      </section>
    </main>
  );
}
