import type { KeyboardEvent, RefObject } from 'react';
import type { Chapter, InputMode } from '../types';
import { SuggestionStrip } from './SuggestionStrip';
import { SpeakButton } from './SpeakButton';

const MODES: { id: InputMode; label: string; title: string }[] = [
  { id: 'taglish', label: 'Taglish', title: 'Taglish எழுதி Tab அழுத்தவும் → தமிழ்' },
  { id: 'pm0100', label: 'PM0100', title: 'விசைப்பலகை நேரடி தமிழ் (Shift = நெடில்)' },
  { id: 'english', label: 'ABC', title: 'ஆங்கிலம் / raw English' },
];

type EditorPaneProps = {
  activeChapter?: Chapter;
  wordCount: number;
  inputMode: InputMode;
  onChangeMode: (mode: InputMode) => void;
  editorRef: RefObject<HTMLTextAreaElement>;
  onChangeContent: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSelect: () => void;
  suggestions: string[];
  recommendation: string | null;
  onPickSuggestion: (word: string) => void;
  onExportText: () => void;
};

export function EditorPane({
  activeChapter,
  wordCount,
  inputMode,
  onChangeMode,
  editorRef,
  onChangeContent,
  onKeyDown,
  onSelect,
  suggestions,
  recommendation,
  onPickSuggestion,
  onExportText,
}: EditorPaneProps) {
  return (
    <article className="editorPane">
      <div className="editorToolbar">
        <div className="modeSwitch" role="group" aria-label="உள்ளீட்டு முறை">
          {MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              className={inputMode === mode.id ? 'modeButton active' : 'modeButton'}
              onClick={() => onChangeMode(mode.id)}
              aria-pressed={inputMode === mode.id}
              title={mode.title}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <div className="toolbarEnd">
          <span className="wordCount" aria-label="சொற்கள்">
            {wordCount} சொல்
          </span>
          <SpeakButton getText={() => activeChapter?.content ?? ''} />
          <button className="exportButton" onClick={onExportText} title="உரையாக ஏற்றுமதி">
            ஏற்றுமதி
          </button>
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
              inputMode === 'taglish'
                ? 'Taglish எழுதுங்கள் — "vanakkam" → Tab → வணக்கம் ...'
                : inputMode === 'pm0100'
                  ? 'PM0100 — QWERTY விசைகளால் தமிழ் (Shift = நெடில்)...'
                  : 'தமிழில் / ஆங்கிலத்தில் எழுதுங்கள்...'
            }
          />
          <SuggestionStrip
            suggestions={suggestions}
            recommendation={recommendation}
            onPick={onPickSuggestion}
          />
          <p className="saveHint">உள்ளூரில் தானாகச் சேமிக்கப்பட்டது</p>
        </div>
      </div>
    </article>
  );
}
