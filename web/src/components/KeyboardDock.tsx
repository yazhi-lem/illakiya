import React, {useRef} from "react";

type KeyboardDockProps = {
  rows: string[][];
  onKey: (value: string) => void;
  onSpace: () => void;
  onBackspace: () => void;
};

export function KeyboardDock({ rows, onKey, onSpace, onBackspace }: KeyboardDockProps) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[][]>([]);

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

    if (key === 'ArrowRight') {
      focusButton(rowIndex, colIndex + 1);
      return;
    }
    if (key === 'ArrowLeft') {
      focusButton(rowIndex, colIndex - 1);
      return;
    }
    if (key === 'ArrowDown') {
      focusButton(rowIndex + 1, colIndex);
      return;
    }
    if (key === 'ArrowUp') {
      focusButton(rowIndex - 1, colIndex);
      return;
    }
  }

  return (
    <aside className="keyboardDock">
      <div id="keyboard-instructions" className="sr-only">
        Use arrow keys to navigate the keyboard. Press Enter or Space to activate a key.
      </div>
      <div
        className="keyboardPanel attached big"
        role="toolbar"
        aria-label="PM0100 keyboard"
        aria-describedby="keyboard-instructions"
      >
        {rows.map((row, rowIndex) => (
          <div className="keyboardRow" role="row" key={`attach-row-${rowIndex}`}>
            {row.map((k, colIndex) => (
              <button
                key={`${rowIndex}-${k}-${colIndex}`}
                ref={(el) => {
                  buttonRefs.current[rowIndex] = buttonRefs.current[rowIndex] || [];
                  buttonRefs.current[rowIndex][colIndex] = el;
                }}
                aria-label={`Key ${k}`}
                onClick={() => onKey(k)}
                onKeyDown={(e) => handleArrowNavigation(e, rowIndex, colIndex)}
              >
                {k}
              </button>
            ))}

            {rowIndex === rows.length - 1 ? (
              <>
                <button
                  key={`space-${rowIndex}`}
                  ref={(el) => {
                    const c = row.length;
                    buttonRefs.current[rowIndex] = buttonRefs.current[rowIndex] || [];
                    buttonRefs.current[rowIndex][c] = el;
                  }}
                  aria-label={`Space`}
                  onClick={onSpace}
                  onKeyDown={(e) => handleArrowNavigation(e, rowIndex, row.length)}
                >
                  ⎵
                </button>
                <button
                  key={`back-${rowIndex}`}
                  ref={(el) => {
                    const c = row.length + 1;
                    buttonRefs.current[rowIndex] = buttonRefs.current[rowIndex] || [];
                    buttonRefs.current[rowIndex][c] = el;
                  }}
                  aria-label={`Backspace`}
                  onClick={onBackspace}
                  onKeyDown={(e) => handleArrowNavigation(e, rowIndex, row.length + 1)}
                >
                  ⌫
                </button>
              </>
            ) : null}
          </div>
        ))}
      </div>
    </aside>
  );
}
