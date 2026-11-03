import { describe, expect, it } from 'vitest';
import { createThinkFilter, readSarvamStream, stripThinking } from './sarvam';

function sse(chunks: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    start(c) {
      for (const ch of chunks) c.enqueue(enc.encode(ch));
      c.close();
    },
  });
}

const chunk = (delta: Record<string, string>, finish: string | null = null) =>
  `data: ${JSON.stringify({ id: 'x', object: 'chat.completion.chunk', created: 1, model: 'sarvam-105b', choices: [{ index: 0, delta, finish_reason: finish }] })}\n\n`;

describe('readSarvamStream', () => {
  it('yields reasoning and content, split across network chunks, until [DONE]', async () => {
    const whole = chunk({ reasoning_content: 'thinking…' }) + chunk({ content: 'வணக்கம்' }) + chunk({ content: '!' }, 'stop') + 'data: [DONE]\n\n' + chunk({ content: 'ignored' });
    const pieces = [];
    for await (const p of readSarvamStream(sse([whole.slice(0, 50), whole.slice(50, 180), whole.slice(180)]))) pieces.push(p);
    expect(pieces.map((p) => p.content ?? '').join('')).toBe('வணக்கம்!');
    expect(pieces[0].reasoning).toBe('thinking…');
    expect(pieces.at(-1)?.finish).toBe('stop');
  });
});

describe('think filtering', () => {
  it('drops think blocks even when tags are split', () => {
    const f = createThinkFilter();
    const out = ['<thi', 'nk>plan the answer</th', 'ink>வண', 'க்கம் <', 'b>'].map(f.push).join('') + f.flush();
    expect(out).toBe('வணக்கம் <b>');
  });

  it('passes plain text through untouched', () => {
    const f = createThinkFilter();
    expect(f.push('a < b') + f.flush()).toBe('a < b');
  });

  it('strips think blocks from full replies', () => {
    expect(stripThinking('<think>x</think>\n{"intent":"write"}')).toBe('{"intent":"write"}');
  });
});
