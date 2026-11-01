/**
 * POST /api/tamil — Cloudflare Pages Function.
 *
 * Body: { "tool": "clean" | "translate" | "grammar" | "formal", "text": "..." }
 * Response: the Tamil result streamed as plain UTF-8 text.
 *
 * Requires the ANTHROPIC_API_KEY secret on the Pages project.
 */
import Anthropic from '@anthropic-ai/sdk';
import {
  MAX_OUTPUT_TOKENS,
  MODEL,
  parseRequest,
  systemPrompt,
  userMessage,
} from '../../server/tools';

interface Env {
  ANTHROPIC_API_KEY?: string;
  /** Optional: route through a gateway (e.g. Cloudflare AI Gateway). */
  ANTHROPIC_BASE_URL?: string;
}

type PagesContext = { request: Request; env: Env };

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
  const stream = client.beta.messages.stream(
    {
      model: MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      output_config: { effort: 'medium' },
      // Server-side fallback: if the request is declined, the API re-runs it
      // on a suitable model inside the same call.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: systemPrompt(parsed.tool),
      messages: [{ role: 'user', content: userMessage(parsed.text) }],
    },
    { signal: request.signal }
  );

  // Wait for the HTTP response so auth / rate-limit errors become real status
  // codes instead of a broken 200 stream.
  try {
    await stream.withResponse();
  } catch (error) {
    return apiError(error);
  }

  const encoder = new TextEncoder();
  const body$ = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === 'refusal') {
          controller.enqueue(encoder.encode('\n\n⚠️ இந்த உரையை மாற்ற இயலவில்லை.'));
        } else if (final.stop_reason === 'max_tokens') {
          controller.enqueue(encoder.encode('\n\n⚠️ உரை மிக நீளம் — பகுதிகளாகப் பிரித்து முயலவும்.'));
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body$, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
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
