import type { KeyboardEvent, RefObject } from 'react';
import type { Chapter } from '../types';
import { MicButton } from './MicButton';
import { SuggestionStrip } from './SuggestionStrip';

type EditorPaneProps = {
  activeChapter?: Chapter;
  wordCount: number;
  taglishMode: boolean;
  onToggleTaglish: () => void;
  editorRef: RefObject<HTMLTextAreaElement>;
  onChangeContent: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSelect: () => void;
  onTranscript: (text: string) => void;
  suggestions: string[];
  correction: string | null;
  onPickSuggestion: (word: string) => void;
  onExportText: () => void;
  onShareWhatsapp: () => void;
  onShareSignal: () => void;
};

export function EditorPane({
  activeChapter,
  wordCount,
  taglishMode,
  onToggleTaglish,
  editorRef,
  onChangeContent,
  onKeyDown,
  onSelect,
  onTranscript,
  suggestions,
  correction,
  onPickSuggestion,
  onExportText,
  onShareWhatsapp,
  onShareSignal,
}: EditorPaneProps) {
  return (
    <article className="editorPane">
      <div className="editorToolbar">
        <div className="writeControls">
          <button
            type="button"
            className={taglishMode ? 'taglishToggle on' : 'taglishToggle'}
            onClick={onToggleTaglish}
            aria-pressed={taglishMode}
            title="Taglish → தமிழ் நேரடி மாற்றம்"
          >
            {taglishMode ? 'Taglish ✓' : 'Taglish'}
          </button>
          <MicButton onTranscript={onTranscript} />
          <span className="wordCount" aria-label="சொற்கள்">
            {wordCount} சொல்
          </span>
        </div>
        <div className="actions">
          <button onClick={onExportText}>ஏற்றுமதி</button>
          <button onClick={onShareWhatsapp}>வாட்ஸ்அப்</button>
          <button onClick={onShareSignal}>சிக்னல்</button>
        </div>
      </div>

      <div className="editorStack">
        <div className="editorTextWrap">
          <textarea
            ref={editorRef}
            className="markdownEditor"
            value={activeChapter?.content ?? ''}
            onChange={(event) => onChangeContent(event.target.value)}
            onKeyDown={onKeyDown}
            onSelect={onSelect}
            onClick={onSelect}
            placeholder={
              taglishMode
                ? 'Taglish-ல் எழுதுங்கள் — "vaNakkam" → வணக்கம் ...'
                : 'தமிழில் எழுதுங்கள்...'
            }
          />
          <SuggestionStrip
            suggestions={suggestions}
            correction={correction}
            onPick={onPickSuggestion}
          />
          <p className="saveHint">உள்ளூரில் தானாகச் சேமிக்கப்பட்டது</p>
        </div>
      </div>
    </article>
  );
}
