/**
 * Minimal Sarvam AI chat client (POST /v1/chat/completions), written against
 * the request/response types of the official `sarvamai` SDK:
 *   auth header  api-subscription-key
 *   model        sarvam-105b (128K context)
 *   reasoning    reasoning_effort: none | low | high | max; while streaming,
 *                thinking arrives in delta.reasoning_content, the reply in
 *                delta.content
 *   streaming    OpenAI-style SSE: `data: {chunk}` lines, ending `data: [DONE]`
 */

export const DEFAULT_BASE_URL = 'https://api.sarvam.ai';
export const DEFAULT_MODEL = 'sarvam-105b';

export type SarvamMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export type SarvamRequest = {
  model: string;
  messages: SarvamMessage[];
  temperature?: number;
  max_tokens?: number;
  reasoning_effort?: 'none' | 'low' | 'high' | 'max';
  stream?: boolean;
  response_format?: { type: 'json_schema'; json_schema: Record<string, unknown> } | { type: 'json_object' };
};

export type SarvamConfig = { apiKey: string; baseUrl?: string };

export class SarvamError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

export async function sarvamFetch(config: SarvamConfig, body: SarvamRequest, signal?: AbortSignal): Promise<Response> {
  const res = await fetch(`${(config.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '')}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'api-subscription-key': config.apiKey,
      'content-type': 'application/json',
      accept: body.stream ? 'text/event-stream' : 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    let detail = '';
    try {
      detail = (await res.text()).slice(0, 300);
    } catch {
      /* ignore */
    }
    throw new SarvamError(res.status, detail || res.statusText);
  }
  return res;
}

/** One non-streamed completion; returns the reply text. */
export async function sarvamComplete(config: SarvamConfig, body: SarvamRequest, signal?: AbortSignal): Promise<string> {
  const res = await sarvamFetch(config, { ...body, stream: false }, signal);
  const data = (await res.json()) as { choices?: { message?: { content?: string | null } }[] };
  return stripThinking(data.choices?.[0]?.message?.content ?? '');
}

export type StreamPiece = { content?: string; reasoning?: string; finish?: string };

/** Parse an SSE body into content / reasoning pieces. */
export async function* readSarvamStream(body: ReadableStream<Uint8Array>): AsyncGenerator<StreamPiece> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const parse = (line: string): StreamPiece | 'done' | null => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) return null;
    const data = trimmed.slice(5).trim();
    if (data === '[DONE]') return 'done';
    try {
      const chunk = JSON.parse(data) as {
        choices?: { delta?: { content?: string | null; reasoning_content?: string | null }; finish_reason?: string | null }[];
      };
      const choice = chunk.choices?.[0];
      if (!choice) return null;
      return {
        content: choice.delta?.content ?? undefined,
        reasoning: choice.delta?.reasoning_content ?? undefined,
        finish: choice.finish_reason ?? undefined,
      };
    } catch {
      return null;
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const piece = parse(line);
      if (piece === 'done') return;
      if (piece) yield piece;
    }
  }
  const last = parse(buffer + decoder.decode());
  if (last && last !== 'done') yield last;
}

/** Remove any <think>…</think> block from a complete reply. */
export function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?(<\/think>|$)/g, '').trim();
}

/**
 * Streaming filter that drops <think>…</think> spans, even when the tags are
 * split across chunks. Feed chunks with `push`, then call `flush`.
 */
export function createThinkFilter() {
  let inside = false;
  let pending = '';
  const OPEN = '<think>';
  const CLOSE = '</think>';

  const push = (chunk: string): string => {
    let text = pending + chunk;
    pending = '';
    let out = '';
    while (text) {
      if (inside) {
        const end = text.indexOf(CLOSE);
        if (end < 0) {
          pending = keepPartial(text, CLOSE);
          return out;
        }
        text = text.slice(end + CLOSE.length);
        inside = false;
      } else {
        const start = text.indexOf(OPEN);
        if (start < 0) {
          const partial = keepPartial(text, OPEN);
          out += text.slice(0, text.length - partial.length);
          pending = partial;
          return out;
        }
        out += text.slice(0, start);
        text = text.slice(start + OPEN.length);
        inside = true;
      }
    }
    return out;
  };

  const flush = (): string => {
    const rest = inside ? '' : pending;
    pending = '';
    return rest;
  };

  return { push, flush };
}

/** The longest suffix of `text` that is a prefix of `tag` (a tag split across chunks). */
function keepPartial(text: string, tag: string): string {
  for (let n = Math.min(tag.length - 1, text.length); n > 0; n -= 1) {
    if (tag.startsWith(text.slice(-n))) return text.slice(-n);
  }
  return '';
}
