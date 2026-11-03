/**
 * POST /api/tamil — Cloudflare Pages Function.
 *
 * Body: { "messages": [{ "role": "user", "content": "...", "tool": "write" }, ...] }
 * Response: NDJSON stream of StreamEvent objects (text deltas, web searches,
 * sources, notes).
 *
 * Requires the ANTHROPIC_API_KEY secret on the Pages project.
 */
import Anthropic from '@anthropic-ai/sdk';
import {
  MAX_OUTPUT_TOKENS,
  MAX_SEARCHES,
  MODEL,
  SYSTEM_PROMPT,
  parseRequest,
  toApiMessages,
  type StreamEvent,
} from '../../server/tools';

interface Env {
  ANTHROPIC_API_KEY?: string;
  /** Optional: route through a gateway (e.g. Cloudflare AI Gateway). */
  ANTHROPIC_BASE_URL?: string;
}

type PagesContext = { request: Request; env: Env };

/** A paused server-tool turn (long research) is resumed at most this many times. */
const MAX_CONTINUATIONS = 3;

const json = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

export const onRequestPost = async ({ request, env }: PagesContext): Promise<Response> => {
  if (!env.ANTHROPIC_API_KEY) {
    return json(503, { error: 'The Tamil service is not configured yet (missing API key).' });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: 'Expected a JSON body.' });
  }
  const parsed = parseRequest(body);
  if (!parsed.ok) return json(parsed.status, { error: parsed.error });

  const client = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    ...(env.ANTHROPIC_BASE_URL ? { baseURL: env.ANTHROPIC_BASE_URL } : {}),
  });

  // Research is only offered to the free-writing mode; conversions stay fast.
  const research = parsed.tool === 'write';
  const messages: Anthropic.Beta.BetaMessageParam[] = toApiMessages(parsed.turns);

  const open = () =>
    client.beta.messages.stream(
      {
        model: MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        output_config: { effort: 'medium' },
        // Server-side fallback: if the request is declined, the API re-runs it
        // on a suitable model inside the same call.
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        system: SYSTEM_PROMPT,
        messages,
        ...(research
          ? { tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: MAX_SEARCHES }] }
          : {}),
      },
      { signal: request.signal }
    );

  const first = open();
  // Wait for the HTTP response so auth / rate-limit errors become real status
  // codes instead of a broken 200 stream.
  try {
    await first.withResponse();
  } catch (error) {
    return apiError(error);
  }

  const encoder = new TextEncoder();
  let current = first;

  const out = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: StreamEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      const sources = new Map<string, string>();

      try {
        for (let round = 0; ; round += 1) {
          current.on('text', (delta) => send({ t: 'text', v: delta }));
          current.on('contentBlock', (block) => {
            if (block.type === 'server_tool_use' && block.name === 'web_search') {
              const q = typeof block.input?.query === 'string' ? block.input.query : '';
              send({ t: 'search', q });
            } else if (block.type === 'text') {
              for (const c of block.citations ?? []) {
                if (c.type === 'web_search_result_location' && !sources.has(c.url)) {
                  sources.set(c.url, c.title ?? c.url);
                }
              }
            }
          });

          const final = await current.finalMessage();

          if (final.stop_reason === 'pause_turn' && round < MAX_CONTINUATIONS) {
            // Long research turn: hand the partial turn back and let it continue.
            messages.push({ role: 'assistant', content: final.content });
            current = open();
            continue;
          }
          if (final.stop_reason === 'refusal') {
            send({ t: 'note', v: 'இந்தக் கோரிக்கைக்குப் பதில் எழுத இயலவில்லை.' });
          } else if (final.stop_reason === 'max_tokens') {
            send({ t: 'note', v: 'பதில் நீளம் அதிகம் — "தொடர்க" என்று எழுதித் தொடரலாம்.' });
          }
          break;
        }

        if (sources.size) {
          send({ t: 'sources', v: [...sources].map(([url, title]) => ({ url, title })) });
        }
        controller.close();
      } catch (error) {
        if (!request.signal.aborted) {
          send({ t: 'error', v: 'இணைப்பில் பிழை. மீண்டும் முயலவும்.' });
          console.error('stream failed', error);
        }
        controller.close();
      }
    },
    cancel() {
      current.abort();
    },
  });

  return new Response(out, {
    headers: {
      'content-type': 'application/x-ndjson; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
};

function apiError(error: unknown): Response {
  if (error instanceof Anthropic.RateLimitError) {
    return json(429, { error: 'Too many requests right now. Try again in a moment.' });
  }
  if (error instanceof Anthropic.AuthenticationError) {
    return json(503, { error: 'The Tamil service is misconfigured (API key rejected).' });
  }
  if (error instanceof Anthropic.BadRequestError) {
    return json(400, { error: 'The request could not be processed.' });
  }
  if (error instanceof Anthropic.APIError) {
    return json(502, { error: `Upstream error (${error.status ?? 'network'}). Try again.` });
  }
  return json(500, { error: 'Unexpected error. Try again.' });
}
