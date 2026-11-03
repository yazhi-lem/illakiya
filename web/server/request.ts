/** Validation of POST /api/tamil bodies and the stream events sent back. */
import { INTENTS, type Intent } from './intent';

export const MAX_TURN_CHARS = 20_000;
export const MAX_TOTAL_CHARS = 120_000;
export const MAX_TURNS = 40;

/** `auto` lets the server detect the intent; anything else forces it. */
export type Mode = 'auto' | Intent;
const MODES: readonly string[] = ['auto', ...INTENTS];

export type Turn = { role: 'user' | 'assistant'; content: string; mode: Mode };

export type ParsedRequest = { ok: true; turns: Turn[] } | { ok: false; status: number; error: string };

/**
 * Body: { messages: [{ role, content, mode? }] } — alternating, starting and
 * ending with a user turn. A past user turn's `mode` should be the intent that
 * was used for it, so it is replayed the same way.
 */
export function parseRequest(body: unknown): ParsedRequest {
  const bad = (error: string, status = 400): ParsedRequest => ({ ok: false, status, error });
  if (!body || typeof body !== 'object') return bad('Expected a JSON body: { "messages": [...] }');
  const raw = (body as { messages?: unknown }).messages;
  if (!Array.isArray(raw) || raw.length === 0) return bad('Write something first.');
  if (raw.length > MAX_TURNS) return bad('This conversation is too long. Start a new one.', 413);

  const turns: Turn[] = [];
  let total = 0;
  for (let i = 0; i < raw.length; i += 1) {
    const turn = raw[i] as { role?: unknown; content?: unknown; mode?: unknown } | null;
    const expected = i % 2 === 0 ? 'user' : 'assistant';
    if (!turn || turn.role !== expected) return bad('Messages must alternate user / assistant, starting with user.');
    if (typeof turn.content !== 'string' || !turn.content.trim()) return bad('Messages cannot be empty.');
    if (turn.content.length > MAX_TURN_CHARS) {
      return bad(`A message is too long (${turn.content.length} characters). The limit is ${MAX_TURN_CHARS}.`, 413);
    }
    total += turn.content.length;
    const mode = turn.mode === undefined ? 'auto' : turn.mode;
    if (typeof mode !== 'string' || !MODES.includes(mode)) return bad(`Unknown mode. Use one of: ${MODES.join(', ')}`);
    turns.push({ role: expected, content: turn.content.trim(), mode: mode as Mode });
  }
  if (total > MAX_TOTAL_CHARS) return bad('This conversation is too long. Start a new one.', 413);
  if (turns[turns.length - 1].role !== 'user') return bad('The last message must be from the user.');
  return { ok: true, turns };
}

/** Events streamed to the browser as NDJSON, one object per line. */
export type StreamEvent =
  | { t: 'intent'; v: Intent; auto: boolean }
  | { t: 'search'; q: string }
  | { t: 'sources'; v: { url: string; title: string }[] }
  | { t: 'text'; v: string }
  | { t: 'note'; v: string }
  | { t: 'error'; v: string };
