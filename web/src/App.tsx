import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Markdown } from './components/Markdown';
import { SpeakButton } from './components/SpeakButton';
import { streamChat, type ChatTurn } from './lib/api';
import { load, save } from './lib/storage';
import { INTENT_LABELS, MAX_INPUT_CHARS, TOOLS, toolById } from './lib/tools';
import { transliterateWord } from './lib/translit';
import type { Intent, Message, Mode } from './types';

const CHAT_KEY = 'illakiya.chat.v2';
const MAX_KEPT = 40;

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

function loadChat(): Message[] {
  try {
    const parsed = JSON.parse(load(CHAT_KEY, '[]')) as Message[];
    return Array.isArray(parsed) ? parsed.filter((m) => m && typeof m.content === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * Completed user/assistant pairs, as the server expects them. Each user turn
 * carries the intent that was actually used, so it is replayed the same way.
 */
function historyTurns(messages: Message[]): ChatTurn[] {
  const turns: ChatTurn[] = [];
  for (let i = 0; i + 1 < messages.length; i += 2) {
    const u = messages[i];
    const a = messages[i + 1];
    if (u.role !== 'user' || a.role !== 'assistant' || a.error || a.pending || !a.content.trim()) continue;
    const used: Intent | 'auto' = a.intent ?? (u.mode === 'translit' ? 'clean' : u.mode);
    turns.push({ role: 'user', content: u.content, mode: used }, { role: 'assistant', content: a.content });
  }
  return turns;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>(loadChat);
  const [draft, setDraft] = useState('');
  const [mode, setMode] = useState<Mode>('auto');
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const sendAfterPaste = useRef(false);

  const activeTool = toolById(mode);
  const empty = messages.length === 0;
  const tooLong = draft.length > MAX_INPUT_CHARS;

  useEffect(() => {
    if (!busy) save(CHAT_KEY, JSON.stringify(messages.slice(-MAX_KEPT)));
  }, [messages, busy]);
  useEffect(() => () => abortRef.current?.abort(), []);

  // Keep the newest text in view while it streams, unless the reader scrolled up.
  useLayoutEffect(() => {
    const el = threadRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Auto-grow the composer.
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, window.innerHeight * 0.4)}px`;
  }, [draft, empty]);

  const patch = (id: string, change: (m: Message) => Partial<Message>) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...change(m) } : m)));

  const send = async (text = draft, sendMode = mode) => {
    const content = text.trim();
    if (!content || busy || content.length > MAX_INPUT_CHARS) return;

    const userMsg: Message = { id: uid(), role: 'user', content, mode: sendMode };
    setDraft('');
    setMode('auto'); // follow-ups go back to automatic intent detection
    stickToBottom.current = true;

    if (sendMode === 'translit') {
      const reply: Message = { id: uid(), role: 'assistant', content: transliterateWord(content), mode: sendMode };
      setMessages((prev) => [...prev, userMsg, reply]);
      return;
    }

    const replyId = uid();
    const turns: ChatTurn[] = [...historyTurns(messages), { role: 'user', content, mode: sendMode }];
    setMessages((prev) => [...prev, userMsg, { id: replyId, role: 'assistant', content: '', mode: sendMode, pending: true }]);

    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    try {
      await streamChat(
        turns,
        {
          onIntent: (intent, auto) => patch(replyId, () => ({ intent, auto })),
          onText: (delta) => patch(replyId, (m) => ({ content: m.content + delta })),
          onSearch: (q) => patch(replyId, (m) => ({ searches: [...(m.searches ?? []), q] })),
          onSources: (sources) => patch(replyId, () => ({ sources })),
          onNote: (note) => patch(replyId, () => ({ note })),
        },
        controller.signal
      );
      patch(replyId, () => ({ pending: false }));
    } catch (err) {
      if (controller.signal.aborted) {
        patch(replyId, (m) => ({ pending: false, note: m.content ? 'நிறுத்தப்பட்டது.' : undefined, error: m.content ? undefined : 'நிறுத்தப்பட்டது.' }));
      } else {
        patch(replyId, () => ({ pending: false, error: err instanceof Error ? err.message : 'பிழை. மீண்டும் முயலவும்.' }));
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const stop = () => abortRef.current?.abort();

  const newChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setDraft('');
    setMode('auto');
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Never send mid-composition (Tamil IMEs compose characters with Enter).
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send();
    }
  };

  const handleChange = (value: string) => {
    setDraft(value);
    if (sendAfterPaste.current) {
      sendAfterPaste.current = false;
      void send(value, mode);
    }
  };

  // In a forced conversion mode, pasting into an empty box sends straight away.
  const handlePaste = () => {
    const convert = mode === 'clean' || mode === 'translate' || mode === 'grammar' || mode === 'formal';
    if (!draft.trim() && convert && !busy) sendAfterPaste.current = true;
  };

  const chooseMode = (id: Mode) => {
    setMode(id);
    inputRef.current?.focus();
  };

  const copy = async (m: Message) => {
    try {
      await navigator.clipboard.writeText(m.content);
      setCopiedId(m.id);
      window.setTimeout(() => setCopiedId((c) => (c === m.id ? null : c)), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  const composer = (
    <div className="dock">
      <div className={tooLong ? 'composer over' : 'composer'}>
        <textarea
          ref={inputRef}
          value={draft}
          rows={1}
          autoFocus
          lang="ta"
          aria-label="உங்கள் செய்தி"
          placeholder={empty ? activeTool.placeholder : 'தொடர்ந்து கேளுங்கள்… · Ask a follow-up'}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
        />
        {busy ? (
          <button type="button" className="sendBtn" onClick={stop} aria-label="நிறுத்து · Stop" title="நிறுத்து">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="7" y="7" width="10" height="10" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            className="sendBtn"
            onClick={() => void send()}
            disabled={!draft.trim() || tooLong}
            aria-label="அனுப்பு · Send"
            title="அனுப்பு (Enter)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        )}
      </div>

      <div className="chips" role="radiogroup" aria-label="முறை · Mode">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={t.id === mode}
            className={t.id === mode ? 'chip on' : 'chip'}
            onClick={() => chooseMode(t.id)}
            title={t.hint}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="hint">
        {tooLong ? `அதிகபட்சம் ${MAX_INPUT_CHARS.toLocaleString('ta-IN')} எழுத்துகள்.` : activeTool.hint}
      </p>
    </div>
  );

  if (empty) {
    return (
      <main className="app home">
        <section className="hero">
          <Logo size={56} />
          <h1>இலக்கியா</h1>
          <p className="lede">எதையும் தமிழில் — ஆராய்ந்து, எழுதி, திருத்தி.</p>
          <p className="ledeEn">Research and write anything in Tamil.</p>
        </section>
        {composer}
        <footer className="byline">
          <span>யாழி</span> Yazhi
        </footer>
      </main>
    );
  }

  return (
    <main className="app">
      <header className="bar">
        <div className="barBrand">
          <Logo size={28} />
          <span className="barName">இலக்கியா</span>
          <span className="barBy">by Yazhi</span>
        </div>
        <button type="button" className="ghostBtn" onClick={newChat}>
          + புதியது
        </button>
      </header>

      <div
        className="thread"
        ref={threadRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
      >
        <div className="threadInner">
          {messages.map((m) =>
            m.role === 'user' ? (
              <div key={m.id} className="msg user">
                {m.mode !== 'auto' ? <span className="msgTool">{toolById(m.mode).label}</span> : null}
                <div className="bubble">{m.content}</div>
              </div>
            ) : (
              <article key={m.id} className="msg bot" lang="ta" aria-busy={m.pending}>
                {m.intent ? (
                  <span className="intent" title={m.auto ? 'தானாகக் கண்டறிந்தது · Detected automatically' : 'நீங்கள் தேர்ந்தெடுத்தது · Chosen by you'}>
                    {m.auto ? <SparkIcon /> : null}
                    {INTENT_LABELS[m.intent]}
                  </span>
                ) : null}
                {m.searches?.length ? (
                  <ul className="searches" aria-label="இணையத் தேடல்">
                    {m.searches.map((q, i) => (
                      <li key={i}>
                        <SearchIcon /> {q || 'தேடுகிறது…'}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className={m.pending ? 'prose typing' : 'prose'}>
                  {m.content ? <Markdown text={m.content} /> : m.pending ? <span className="thinking">எழுதுகிறது…</span> : null}
                </div>
                {m.error ? <p className="err">{m.error}</p> : null}
                {m.note ? <p className="note">{m.note}</p> : null}
                {m.sources?.length ? (
                  <div className="sources">
                    <span className="sourcesLabel">ஆதாரங்கள்</span>
                    {m.sources.map((s) => (
                      <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" title={s.title}>
                        {hostOf(s.url)}
                      </a>
                    ))}
                  </div>
                ) : null}
                {!m.pending && m.content ? (
                  <div className="actions">
                    <button type="button" className="ghostBtn small" onClick={() => void copy(m)}>
                      {copiedId === m.id ? '✓ நகலெடுத்தது' : 'நகலெடு'}
                    </button>
                    <SpeakButton getText={() => m.content} />
                  </div>
                ) : null}
              </article>
            )
          )}
        </div>
      </div>

      {composer}
    </main>
  );
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** Yazhi mark: cobalt tile with யா. */
function Logo({ size }: { size: number }) {
  return (
    <svg className="logo" width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="Yazhi">
      <rect width="48" height="48" rx="13" fill="var(--cobalt)" />
      <text
        x="24"
        y="31"
        textAnchor="middle"
        fontSize="20"
        fontWeight="700"
        fill="#fff"
        fontFamily="'Noto Sans Tamil', sans-serif"
      >
        யா
      </text>
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </svg>
  );
}
