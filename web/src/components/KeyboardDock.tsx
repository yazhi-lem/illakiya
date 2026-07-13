import React, { useRef, useState } from 'react';

type KeyboardDockProps = {
  rows: string[][];
  hints?: Record<string, string>;
  nedilMap?: Record<string, string>;
  activeKey?: string | null;
  onKey: (value: string) => void;
  onSpace: () => void;
  onBackspace: () => void;
};

export function KeyboardDock({
  rows,
  hints = {},
  nedilMap = {},
  activeKey,
  onKey,
  onSpace,
  onBackspace,
}: KeyboardDockProps) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[][]>([]);
  // Nedil (long vowel) shift — one-shot, like a real Shift key.
  const [shift, setShift] = useState(false);

  function focusButton(r: number, c: number) {
    const row = buttonRefs.current[r];
    if (!row) return;
    const el = row[c];
    if (el) el.focus();
  }

  function handleArrowNavigation(e: React.KeyboardEvent, rowIndex: number, colIndex: number) {
    const key = e.key;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) return;
    e.preventDefault();
    if (key === 'ArrowRight') focusButton(rowIndex, colIndex + 1);
    else if (key === 'ArrowLeft') focusButton(rowIndex, colIndex - 1);
    else if (key === 'ArrowDown') focusButton(rowIndex + 1, colIndex);
    else if (key === 'ArrowUp') focusButton(rowIndex - 1, colIndex);
  }

  function pressKey(k: string) {
    if (shift && nedilMap[k]) {
      onKey(nedilMap[k]);
    } else {
      onKey(k);
    }
    if (shift) setShift(false);
  }

  function registerRef(rowIndex: number, colIndex: number) {
    return (el: HTMLButtonElement | null) => {
      buttonRefs.current[rowIndex] = buttonRefs.current[rowIndex] || [];
      buttonRefs.current[rowIndex][colIndex] = el;
    };
  }

  return (
    <aside className="keyboardDock">
      <div id="keyboard-instructions" className="sr-only">
        Use arrow keys to navigate the keyboard. Press Enter or Space to activate a key. The Shift
        key turns short vowels (kuril) into long vowels (nedil).
      </div>
      <div
        className="keyboardPanel attached big"
        role="toolbar"
        aria-label="PM0100 keyboard"
        aria-describedby="keyboard-instructions"
      >
        {rows.map((row, rowIndex) => {
          const isLast = rowIndex === rows.length - 1;
          return (
            <div className="keyboardRow" role="row" key={`attach-row-${rowIndex}`}>
              {isLast ? (
                <button
                  key={`shift-${rowIndex}`}
                  ref={registerRef(rowIndex, row.length + 2)}
                  className={shift ? 'kbControl shift on' : 'kbControl shift'}
                  aria-label="நெடில் (Shift for long vowel)"
                  aria-pressed={shift}
                  title="நெடில் — கிடைக்கும் உயிரெழுத்தை நீட்டும் (Shift)"
                  onClick={() => setShift((prev) => !prev)}
                  onKeyDown={(e) => handleArrowNavigation(e, rowIndex, row.length + 2)}
                >
                  ⇧ நெடில்
                </button>
              ) : null}

              {row.map((k, colIndex) => {
                const label = isLast && shift && nedilMap[k] ? nedilMap[k] : k;
                return (
                  <button
                    key={`${rowIndex}-${k}-${colIndex}`}
                    ref={registerRef(rowIndex, colIndex)}
                    className={activeKey === k ? 'keyCap pressed' : 'keyCap'}
                    aria-label={`Key ${label}`}
                    onClick={() => pressKey(k)}
                    onKeyDown={(e) => handleArrowNavigation(e, rowIndex, colIndex)}
                  >
                    <span className="keyGlyph">{label}</span>
                    {hints[k] ? <span className="keyHint">{hints[k]}</span> : null}
                  </button>
                );
              })}

              {isLast ? (
                <>
                  <button
                    key={`space-${rowIndex}`}
                    ref={registerRef(rowIndex, row.length)}
                    className="kbControl"
                    aria-label="Space"
                    onClick={onSpace}
                    onKeyDown={(e) => handleArrowNavigation(e, rowIndex, row.length)}
                  >
                    ⎵
                  </button>
                  <button
                    key={`back-${rowIndex}`}
                    ref={registerRef(rowIndex, row.length + 1)}
                    className="kbControl"
                    aria-label="Backspace"
                    onClick={onBackspace}
                    onKeyDown={(e) => handleArrowNavigation(e, rowIndex, row.length + 1)}
                  >
                    ⌫
                  </button>
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
