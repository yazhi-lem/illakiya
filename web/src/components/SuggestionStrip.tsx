type SuggestionStripProps = {
  suggestions: string[];
  correction?: string | null;
  onPick: (word: string) => void;
};

/**
 * Dictionary/auto-correct suggestions for the word being typed. A correction
 * (from `autoCorrect`) is highlighted first; the rest are Trie prefix matches
 * from the shared corpus. Tapping one replaces the current word.
 */
export function SuggestionStrip({ suggestions, correction, onPick }: SuggestionStripProps) {
  const items = correction
    ? [correction, ...suggestions.filter((s) => s !== correction)]
    : suggestions;

  if (!items.length) {
    return <div className="suggestionStrip empty" aria-hidden="true" />;
  }

  return (
    <div className="suggestionStrip" role="listbox" aria-label="சொல் பரிந்துரைகள்">
      {items.slice(0, 6).map((word, index) => (
        <button
          key={word}
          type="button"
          role="option"
          aria-selected={index === 0 && Boolean(correction)}
          className={index === 0 && correction ? 'suggestion correction' : 'suggestion'}
          onClick={() => onPick(word)}
        >
          {word}
        </button>
      ))}
    </div>
  );
}
