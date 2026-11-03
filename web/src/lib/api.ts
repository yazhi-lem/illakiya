import type { Intent, Source } from '../types';

/** `mode` of a user turn: 'auto', or the intent to force / that was used. */
export type ChatTurn = { role: 'user' | 'assistant'; content: string; mode?: 'auto' | Intent };

export type StreamHandlers = {
  onIntent: (intent: Intent, auto: boolean) => void;
  onText: (delta: string) => void;
  onSearch: (query: string) => void;
  onSources: (sources: Source[]) => void;
  onNote: (note: string) => void;
};

type StreamEvent =
  | { t: 'intent'; v: Intent; auto: boolean }
  | { t: 'text'; v: string }
  | { t: 'search'; q: string }
  | { t: 'sources'; v: Source[] }
  | { t: 'note'; v: string }
  | { t: 'error'; v: string };

/** Send the conversation to /api/tamil and dispatch streamed NDJSON events. */
export async function streamChat(turns: ChatTurn[], handlers: StreamHandlers, signal?: AbortSignal): Promise<void> {
  const res = await fetch('/api/tamil', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages: turns }),
    signal,
  });

  if (!res.ok || !res.body) {
    let message = `பிழை (${res.status}). மீண்டும் முயலவும்.`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const handle = (line: string) => {
    if (!line.trim()) return;
    let event: StreamEvent;
    try {
      event = JSON.parse(line) as StreamEvent;
    } catch {
      return;
    }
    if (event.t === 'intent') handlers.onIntent(event.v, event.auto);
    else if (event.t === 'text') handlers.onText(event.v);
    else if (event.t === 'search') handlers.onSearch(event.q);
    else if (event.t === 'sources') handlers.onSources(event.v);
    else if (event.t === 'note') handlers.onNote(event.v);
    else if (event.t === 'error') throw new Error(event.v);
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl = buffer.indexOf('\n');
    while (nl >= 0) {
      handle(buffer.slice(0, nl));
      buffer = buffer.slice(nl + 1);
      nl = buffer.indexOf('\n');
    }
  }
  handle(buffer + decoder.decode());
}
