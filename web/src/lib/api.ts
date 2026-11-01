import type { ToolId } from '../types';

/**
 * Stream a Tamil result from the server toolbox. `onText` receives the full
 * text so far on every chunk. Resolves with the final text.
 */
export async function streamTamil(
  tool: Exclude<ToolId, 'translit'>,
  text: string,
  onText: (soFar: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const res = await fetch('/api/tamil', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ tool, text }),
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
  let out = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    out += decoder.decode(value, { stream: true });
    onText(out);
  }
  out += decoder.decode();
  onText(out);
  return out;
}
