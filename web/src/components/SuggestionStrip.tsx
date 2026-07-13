type SuggestionStripProps = {
  suggestions: string[];
  /** Recommended Tamil equivalent of the in-progress Taglish word (Tab accepts). */
  recommendation?: string | null;
  onPick: (word: string) => void;
};

/**
 * Word recommendations for the current word. In Taglish mode the first chip is
 * the transliterated Tamil equivalent (accepted with Tab); the rest are
 * dictionary prefix matches. Tapping any chip inserts it.
 */
export function SuggestionStrip({ suggestions, recommendation, onPick }: SuggestionStripProps) {
  const merged = recommendation ? [recommendation, ...suggestions] : suggestions;
  const items = Array.from(new Set(merged)).slice(0, 6);

  if (!items.length) {
    return <div className="suggestionStrip empty" aria-hidden="true" />;
  }

  return (
    <div className="suggestionStrip" role="listbox" aria-label="சொல் பரிந்துரைகள்">
      {items.map((word, index) => {
        const isPrimary = index === 0 && Boolean(recommendation);
        return (
          <button
            key={`${word}-${index}`}
            type="button"
            role="option"
            aria-selected={isPrimary}
            className={isPrimary ? 'suggestion primary' : 'suggestion'}
            onClick={() => onPick(word)}
          >
            {word}
            {isPrimary ? <kbd className="tabHint">⇥ Tab</kbd> : null}
          </button>
        );
      })}
    </div>
  );
}
