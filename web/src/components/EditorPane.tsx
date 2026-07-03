import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import type { Note } from '../types';
import { wordCount } from '../lib/notes';

type EditorPaneProps = {
  activeNote?: Note;
  editorRef: RefObject<HTMLDivElement>;
  onInput: () => void;
  onExport: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
};

function queryFmt(cmd: string): boolean {
  try {
    return document.queryCommandState(cmd);
  } catch {
    return false;
  }
}

function execFmt(cmd: string, value?: string) {
  document.execCommand(cmd, false, value);
}

type FmtState = { bold: boolean; italic: boolean; underline: boolean; strike: boolean };

function FormatBar({ editorRef, onExport, wc }: { editorRef: RefObject<HTMLDivElement>; onExport: () => void; wc: number }) {
  const [fmt, setFmt] = useState<FmtState>({ bold: false, italic: false, underline: false, strike: false });

  useEffect(() => {
    const update = () => {
      setFmt({
        bold: queryFmt('bold'),
        italic: queryFmt('italic'),
        underline: queryFmt('underline'),
        strike: queryFmt('strikeThrough'),
      });
    };
    document.addEventListener('selectionchange', update);
    return () => document.removeEventListener('selectionchange', update);
  }, []);

  const refocus = () => editorRef.current?.focus();

  const fmt_btn = (label: string, cmd: string, active: boolean, extra?: string, title?: string) => (
    <button
      className={`fmtBtn${active ? ' active' : ''}`}
      onMouseDown={(e) => { e.preventDefault(); refocus(); execFmt(cmd, extra); }}
      title={title ?? label}
      aria-pressed={active}
    >
      {label}
    </button>
  );

  const block_btn = (label: string, tag: string, title: string) => (
    <button
      className="fmtBtn"
      onMouseDown={(e) => { e.preventDefault(); refocus(); execFmt('formatBlock', tag); }}
      title={title}
    >
      {label}
    </button>
  );

  return (
    <div className="formatBar" role="toolbar" aria-label="Formatting tools">
      {fmt_btn('B', 'bold', fmt.bold, undefined, 'தடித்த (⌘B)')}
      {fmt_btn('I', 'italic', fmt.italic, undefined, 'சாய்வு (⌘I)')}
      {fmt_btn('U', 'underline', fmt.underline, undefined, 'கீழோடு (⌘U)')}
      {fmt_btn('S̶', 'strikeThrough', fmt.strike, undefined, 'கோடிடல்')}

      <span className="fmtSep" />

      {block_btn('H1', 'h1', 'தலைப்பு 1')}
      {block_btn('H2', 'h2', 'தலைப்பு 2')}
      {block_btn('H3', 'h3', 'தலைப்பு 3')}
      {block_btn('¶', 'p', 'பத்தி')}

      <span className="fmtSep" />

      <button className="fmtBtn" onMouseDown={(e) => { e.preventDefault(); refocus(); execFmt('insertUnorderedList'); }} title="புள்ளி பட்டியல்">•</button>
      <button className="fmtBtn" onMouseDown={(e) => { e.preventDefault(); refocus(); execFmt('insertOrderedList'); }} title="எண் பட்டியல்">1.</button>

      <span className="fmtSep" />

      <button className="fmtBtn" onMouseDown={(e) => { e.preventDefault(); refocus(); execFmt('justifyLeft'); }} title="இடது">⬛︎</button>
      <button className="fmtBtn" onMouseDown={(e) => { e.preventDefault(); refocus(); execFmt('justifyCenter'); }} title="நடுவில்">≡</button>
      <button className="fmtBtn" onMouseDown={(e) => { e.preventDefault(); refocus(); execFmt('justifyRight'); }} title="வலது">⬜︎</button>

      <span className="fmtSep" />

      <span className="wordCount" title="சொல் எண்ணிக்கை">{wc} சொற்கள்</span>

      <span className="fmtSep" />

      <button className="fmtBtn exportBtn" onMouseDown={(e) => { e.preventDefault(); onExport(); }} title="HTML ஏற்றுமதி">
        ஏற்றுமதி
      </button>
    </div>
  );
}

export function EditorPane({ activeNote, editorRef, onInput, onExport, onKeyDown }: EditorPaneProps) {
  const prevNoteId = useRef<string | undefined>(undefined);
  const wc = wordCount(activeNote?.content ?? '');

  // Sync content into DOM when the active note switches
  useEffect(() => {
    if (!editorRef.current || !activeNote) return;
    if (prevNoteId.current === activeNote.id) return;
    prevNoteId.current = activeNote.id;
    editorRef.current.innerHTML = activeNote.content;
  }, [activeNote?.id, editorRef]);

  return (
    <article className="editorPane">
      <FormatBar editorRef={editorRef} onExport={onExport} wc={wc} />
      <div className="documentScroll">
        <div
          ref={editorRef}
          className="richEditor"
          contentEditable
          suppressContentEditableWarning
          dir="ltr"
          aria-label="Document editor"
          aria-multiline="true"
          role="textbox"
          onInput={onInput}
          onKeyDown={onKeyDown}
          spellCheck={false}
        />
      </div>
      <p className="saveHint">தானாகச் சேமிக்கப்படுகிறது</p>
    </article>
  );
}
