import type { KeyboardEvent, RefObject } from 'react';
import type { Note } from '../types';

type EditorPaneProps = {
  activeNote?: Note;
  activeTags: string[];
  editorRef: RefObject<HTMLTextAreaElement>;
  onChangeContent: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onExportText: () => void;
  onShareWhatsapp: () => void;
  onShareSignal: () => void;
};

export function EditorPane({
  activeNote,
  activeTags,
  editorRef,
  onChangeContent,
  onKeyDown,
  onExportText,
  onShareWhatsapp,
  onShareSignal,
}: EditorPaneProps) {
  return (
    <article className="editorPane">
      <div className="editorToolbar">
        <div className="tagsWrap">
          {activeTags.length ? activeTags.map((tag) => <span key={tag}>{tag}</span>) : <span>#குறிச்சொல்_இல்லை</span>}
        </div>
        <div className="actions">
          <button onClick={onExportText}>உரை ஏற்றுமதி</button>
          <button onClick={onShareWhatsapp}>வாட்ச்அப்</button>
          <button onClick={onShareSignal}>சிக்னல்</button>
        </div>
      </div>

      <div className="editorStack">
        <div className="editorTextWrap">
          <textarea
            ref={editorRef}
            className="markdownEditor"
            value={activeNote?.content ?? ''}
            onChange={(event) => onChangeContent(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="PM0100 ஆதரவு கொண்ட தமிழ் குறிப்பேடு..."
          />
          <p className="saveHint">உள்ளூரில் தானாகச் சேமிக்கப்பட்டது</p>
        </div>
      </div>
    </article>
  );
}
