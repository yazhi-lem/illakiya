import React, { useRef } from 'react';
import { CONSONANT_ROW_COUNT } from '../constants/keyboard';

type KeyboardDockProps = {
  rows: string[][];
  onKey: (value: string) => void;
  onSpace: () => void;
  onBackspace: () => void;
};

export function KeyboardDock({ rows, onKey, onSpace, onBackspace }: KeyboardDockProps) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[][]>([]);

  function focusButton(r: number, c: number) {
    buttonRefs.current[r]?.[c]?.focus();
  }

  function handleArrow(e: React.KeyboardEvent, row: number, col: number) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    if (e.key === 'ArrowRight') focusButton(row, col + 1);
    if (e.key === 'ArrowLeft') focusButton(row, col - 1);
    if (e.key === 'ArrowDown') focusButton(row + 1, col);
    if (e.key === 'ArrowUp') focusButton(row - 1, col);
  }

  const shortVowelRowIdx = CONSONANT_ROW_COUNT;
  const longVowelRowIdx = CONSONANT_ROW_COUNT + 1;
  const lastRowIdx = rows.length - 1;

  return (
    <aside className="keyboardDock">
      <div id="kbd-hint" className="sr-only">
        Arrow keys to navigate. Enter or Space to press a key.
      </div>
      <div
        className="keyboardPanel"
        role="toolbar"
        aria-label="PM0100 Tamil keyboard"
        aria-describedby="kbd-hint"
      >
        {rows.map((row, ri) => {
          const isShortVowel = ri === shortVowelRowIdx;
          const isLongVowel = ri === longVowelRowIdx;
          const isLast = ri === lastRowIdx;
          const rowClass = [
            'keyboardRow',
            isShortVowel ? 'shortVowelRow' : '',
            isLongVowel ? 'longVowelRow' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div className={rowClass} role="row" key={ri}>
              {row.map((k, ci) => (
                <button
                  key={k}
                  ref={(el) => {
                    buttonRefs.current[ri] = buttonRefs.current[ri] || [];
                    buttonRefs.current[ri][ci] = el;
                  }}
                  aria-label={k}
                  onClick={() => onKey(k)}
                  onKeyDown={(e) => handleArrow(e, ri, ci)}
                >
                  {k}
                </button>
              ))}

              {isLast && (
                <>
                  <button
                    className="spaceKey"
                    ref={(el) => {
                      buttonRefs.current[ri] = buttonRefs.current[ri] || [];
                      buttonRefs.current[ri][row.length] = el;
                    }}
                    aria-label="Space"
                    onClick={onSpace}
                    onKeyDown={(e) => handleArrow(e, ri, row.length)}
                  >
                    இடம்
                  </button>
                  <button
                    className="backspaceKey"
                    ref={(el) => {
                      buttonRefs.current[ri] = buttonRefs.current[ri] || [];
                      buttonRefs.current[ri][row.length + 1] = el;
                    }}
                    aria-label="Backspace"
                    onClick={onBackspace}
                    onKeyDown={(e) => handleArrow(e, ri, row.length + 1)}
                  >
                    ⌫
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
