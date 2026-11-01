import { useEffect, useMemo, useRef, useState } from 'react';
import type { ClipboardEvent, KeyboardEvent } from 'react';
import { SpeakButton } from './components/SpeakButton';
import { streamTamil } from './lib/api';
import { load, save } from './lib/storage';
import { MAX_INPUT_CHARS, TOOLS } from './lib/tools';
import { transliterateWord } from './lib/translit';
import type { ToolId } from './types';

type Status = 'idle' | 'working' | 'done' | 'error';

const INPUT_KEY = 'illakiya.input';
const TOOL_KEY = 'illakiya.tool';

const isToolId = (v: string): v is ToolId => TOOLS.some((t) => t.id === v);

export default function App() {
  const [input, setInput] = useState(() => load(INPUT_KEY, ''));
  const [tool, setTool] = useState<ToolId>(() => {
    const saved = load(TOOL_KEY, 'clean');
    return isToolId(saved) ? saved : 'clean';
  });
  const [aiOutput, setAiOutput] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const runAfterPaste = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeTool = TOOLS.find((t) => t.id === tool) ?? TOOLS[0];
  const offline = Boolean(activeTool.offline);
  const tooLong = input.length > MAX_INPUT_CHARS;

  // Offline transliteration is instant: derive it as the user types.
  const translitOutput = useMemo(() => (offline ? transliterateWord(input) : ''), [offline, input]);
  const output = offline ? translitOutput : aiOutput;

  useEffect(() => save(INPUT_KEY, input), [input]);
  useEffect(() => save(TOOL_KEY, tool), [tool]);
  useEffect(() => () => abortRef.current?.abort(), []);

  const run = async (text: string, toolId: ToolId) => {
    abortRef.current?.abort();
    if (toolId === 'translit' || !text.trim() || text.length > MAX_INPUT_CHARS) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('working');
    setError('');
    setAiOutput('');
    try {
      await streamTamil(toolId, text, setAiOutput, controller.signal);
      if (abortRef.current === controller) setStatus('done');
    } catch (err) {
      if (controller.signal.aborted) return;
      setStatus('error');
      setError(err instanceof Error ? err.message : 'பிழை. மீண்டும் முயலவும்.');
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    setStatus(aiOutput ? 'done' : 'idle');
  };

  const handleChange = (value: string) => {
    setInput(value);
    if (runAfterPaste.current) {
      runAfterPaste.current = false;
      void run(value, tool);
    }
  };

  // "Just paste": a paste triggers the active tool straight away.
  const handlePaste = (_event: ClipboardEvent<HTMLTextAreaElement>) => {
    if (!offline) runAfterPaste.current = true;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void run(input, tool);
    }
  };

  const chooseTool = (id: ToolId) => {
    setTool(id);
    setCopied(false);
    if (id === 'translit') {
      abortRef.current?.abort();
      setStatus('idle');
      setError('');
    } else if (input.trim()) {
      void run(input, id);
    }
    inputRef.current?.focus();
  };

  const clearAll = () => {
    abortRef.current?.abort();
    setInput('');
    setAiOutput('');
    setStatus('idle');
    setError('');
    inputRef.current?.focus();
  };

  const copyOutput = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — user can still select the text */
    }
  };

  const working = status === 'working';

  return (
    <main className="shell">
      <header className="brand">
        <h1>
          இலக்கியா <span className="brandEn">Illakiya</span>
        </h1>
        <p className="tagline">தமிழ் கருவிப்பெட்டி — எதையும் ஒட்டுங்கள், சுத்தமான தமிழ் பெறுங்கள்.</p>
      </header>

      <nav className="tools" role="tablist" aria-label="கருவிகள் · Tools">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === tool}
            className={t.id === tool ? 'tool active' : 'tool'}
            onClick={() => chooseTool(t.id)}
            title={t.hint}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <p className="toolHint">{activeTool.hint}</p>

      <section className="panes">
        <div className="pane">
          <div className="paneHead">
            <span className="paneLabel">உள்ளீடு · Input</span>
            <span className={tooLong ? 'count over' : 'count'}>
              {input.length.toLocaleString('ta-IN')} / {MAX_INPUT_CHARS.toLocaleString('ta-IN')}
            </span>
          </div>
          <textarea
            ref={inputRef}
            className="field"
            value={input}
            autoFocus
            spellCheck={false}
            onChange={(e) => handleChange(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            placeholder={
              offline
                ? 'Tanglish தட்டச்சு செய்யுங்கள் — "vanakkam nanbargale"'
                : 'ஆங்கிலம், Tanglish, பிழையான தமிழ் — எதையும் இங்கே ஒட்டுங்கள்…\nPaste English, Tanglish or rough Tamil here…'
            }
          />
          <div className="paneFoot">
            <button type="button" className="ghost" onClick={clearAll} disabled={!input && !output}>
              அழி · Clear
            </button>
            {offline ? null : working ? (
              <button type="button" className="primary" onClick={stop}>
                நிறுத்து · Stop
              </button>
            ) : (
              <button
                type="button"
                className="primary"
                onClick={() => void run(input, tool)}
                disabled={!input.trim() || tooLong}
                title="Ctrl/⌘ + Enter"
              >
                தமிழாக்கு →
              </button>
            )}
          </div>
        </div>

        <div className="pane out">
          <div className="paneHead">
            <span className="paneLabel">தமிழ் · Tamil</span>
            <span className="status" aria-live="polite">
              {working ? 'எழுதுகிறது…' : status === 'error' ? '' : copied ? 'நகலெடுக்கப்பட்டது ✓' : ''}
            </span>
          </div>
          <div className={working ? 'field result working' : 'field result'} aria-live="polite" lang="ta">
            {output ? (
              output
            ) : status === 'error' ? null : (
              <span className="placeholder">சுத்தமான தமிழ் இங்கே வரும்.</span>
            )}
            {status === 'error' ? <p className="error">{error}</p> : null}
          </div>
          <div className="paneFoot">
            <SpeakButton getText={() => output} />
            <button type="button" className="primary" onClick={() => void copyOutput()} disabled={!output}>
              {copied ? '✓ நகல்' : 'நகலெடு · Copy'}
            </button>
          </div>
        </div>
      </section>

      <footer className="foot">
        யாழி · Yazhi — தமிழுக்கான இறையாண்மைத் தொழில்நுட்பம்
      </footer>
    </main>
  );
}
