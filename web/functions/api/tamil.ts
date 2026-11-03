/**
 * POST /api/tamil — Cloudflare Pages Function, powered by Sarvam AI.
 *
 * Body: { "messages": [{ "role": "user", "content": "...", "mode": "auto" }, ...] }
 * Response: NDJSON stream of StreamEvent objects: the detected intent, any
 * research (search + sources), then the Tamil text.
 *
 * Secrets / vars on the Pages project:
 *   SARVAM_API_KEY     required
 *   SARVAM_MODEL       optional, default sarvam-105b
 *   SARVAM_BASE_URL    optional, default https://api.sarvam.ai
 *   WIKI_API_TEMPLATE  optional, default https://{lang}.wikipedia.org/w/api.php
 */
import {
  CLASSIFIER_PROMPT,
  CLASSIFIER_SCHEMA,
  conversionPayload,
  detectIntent,
  parseClassifierAnswer,
  scriptRatios,
  type Detection,
  type Intent,
} from '../../server/intent';
import { CONVERSIONS, generationSettings, renderUserTurn, systemPrompt } from '../../server/prompts';
import { parseRequest, type StreamEvent, type Turn } from '../../server/request';
import { research, type WikiSource } from '../../server/research';
import {
  DEFAULT_MODEL,
  SarvamError,
  createThinkFilter,
  readSarvamStream,
  sarvamComplete,
  sarvamFetch,
  type SarvamConfig,
  type SarvamMessage,
} from '../../server/sarvam';

interface Env {
  SARVAM_API_KEY?: string;
  SARVAM_MODEL?: string;
  SARVAM_BASE_URL?: string;
  WIKI_API_TEMPLATE?: string;
}

type PagesContext = { request: Request; env: Env };

const json = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

export const onRequestPost = async ({ request, env }: PagesContext): Promise<Response> => {
  if (!env.SARVAM_API_KEY) {
    return json(503, { error: 'The Tamil service is not configured yet (missing SARVAM_API_KEY).' });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: 'Expected a JSON body.' });
  }
  const parsed = parseRequest(body);
  if (!parsed.ok) return json(parsed.status, { error: parsed.error });

  const config: SarvamConfig = { apiKey: env.SARVAM_API_KEY, baseUrl: env.SARVAM_BASE_URL };
  const model = env.SARVAM_MODEL || DEFAULT_MODEL;
  const turns = parsed.turns;
  const latest = turns[turns.length - 1];
  const history = turns.slice(0, -1);

  // 1. Intent: forced by the chosen mode, or detected.
  const auto = latest.mode === 'auto';
  const detection = auto ? await resolveIntent(config, model, latest.content, history, request.signal) : null;
  const intent: Intent = detection?.intent ?? (latest.mode as Intent);
  const fallbackQuery = latest.content.slice(0, 120);
  const queries =
    detection && (detection.queries.ta || detection.queries.en)
      ? detection.queries
      : scriptRatios(fallbackQuery).tamil > 0.5
        ? { ta: fallbackQuery }
        : { en: fallbackQuery };

  // 2. Research (best effort), then 3. open the Sarvam stream — before
  // answering, so key / quota errors become real HTTP status codes.
  const sources: WikiSource[] = intent === 'research' ? await research(queries, env.WIKI_API_TEMPLATE) : [];
  const settings = generationSettings(intent);
  const messages: SarvamMessage[] = [
    { role: 'system', content: systemPrompt(intent, sources) },
    ...history.map((t) => toSarvamMessage(t)),
    { role: 'user', content: renderUserTurn(auto && CONVERSIONS.has(intent) ? conversionPayload(latest.content) : latest.content, intent) },
  ];

  let upstream: Response;
  try {
    upstream = await sarvamFetch(config, { model, messages, stream: true, ...settings }, request.signal);
  } catch (error) {
    return apiError(error);
  }

  const encoder = new TextEncoder();
  const out = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: StreamEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      send({ t: 'intent', v: intent, auto });
      if (intent === 'research') {
        send({ t: 'search', q: queries.ta || queries.en || '' });
        if (sources.length) send({ t: 'sources', v: sources.map(({ url, title }) => ({ url, title })) });
      }

      const filter = createThinkFilter();
      let finish = '';
      let wrote = false;
      try {
        for await (const piece of readSarvamStream(upstream.body!)) {
          if (piece.content) {
            const text = filter.push(piece.content);
            if (text) {
              // Drop leading whitespace left behind by a removed <think> block.
              const v = wrote ? text : text.replace(/^\s+/, '');
              if (v) {
                wrote = true;
                send({ t: 'text', v });
              }
            }
          }
          if (piece.finish) finish = piece.finish;
        }
        const rest = filter.flush();
        if (rest) send({ t: 'text', v: rest });
        if (finish === 'length') {
          send({ t: 'note', v: 'பதில் நீளம் அதிகம் — "தொடர்க" என்று எழுதித் தொடரலாம்.' });
        } else if (!wrote) {
          send({ t: 'note', v: 'பதில் கிடைக்கவில்லை. மீண்டும் முயலவும்.' });
        }
      } catch (error) {
        if (!request.signal.aborted) {
          console.error('sarvam stream failed', error);
          send({ t: 'error', v: 'இணைப்பில் பிழை. மீண்டும் முயலவும்.' });
        }
      }
      controller.close();
    },
    cancel() {
      void upstream.body?.cancel();
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

/** Replay a past turn the way it was originally sent. */
function toSarvamMessage(turn: Turn): SarvamMessage {
  if (turn.role === 'assistant') return { role: 'assistant', content: turn.content };
  const intent: Intent = turn.mode === 'auto' ? 'write' : turn.mode;
  const content = CONVERSIONS.has(intent) ? conversionPayload(turn.content) : turn.content;
  return { role: 'user', content: renderUserTurn(content, intent) };
}

/** Heuristics first; the model classifier only when they are unsure. */
async function resolveIntent(
  config: SarvamConfig,
  model: string,
  text: string,
  history: Turn[],
  signal: AbortSignal
): Promise<Detection> {
  const guess = detectIntent(text, history.length > 0);
  if (guess.confidence === 'high') return guess;

  const previous = history.length ? history[history.length - 1].content.slice(0, 400) : '';
  try {
    const raw = await sarvamComplete(
      config,
      {
        model,
        temperature: 0,
        max_tokens: 300,
        reasoning_effort: 'none',
        response_format: { type: 'json_schema', json_schema: CLASSIFIER_SCHEMA },
        messages: [
          { role: 'system', content: CLASSIFIER_PROMPT },
          {
            role: 'user',
            content: `${previous ? `<previous_answer>\n${previous}\n</previous_answer>\n` : ''}<message>\n${text.slice(0, 2000)}\n</message>`,
          },
        ],
      },
      AbortSignal.any([signal, AbortSignal.timeout(8000)])
    );
    const answer = parseClassifierAnswer(raw);
    if (answer && (answer.intent !== 'revise' || history.length)) {
      return {
        intent: answer.intent,
        confidence: 'high',
        queries: answer.queries.ta || answer.queries.en ? answer.queries : guess.queries,
      };
    }
  } catch (error) {
    console.warn('intent classifier failed; using heuristic guess', error);
  }
  return guess;
}

function apiError(error: unknown): Response {
  if (error instanceof SarvamError) {
    if (error.status === 401 || error.status === 403) {
      return json(503, { error: 'The Tamil service is misconfigured (Sarvam API key rejected).' });
    }
    if (error.status === 429) return json(429, { error: 'Too many requests right now. Try again in a moment.' });
    if (error.status === 400 || error.status === 422) {
      console.error('sarvam rejected request', error.message);
      return json(400, { error: 'The request could not be processed.' });
    }
    return json(502, { error: `Upstream error (${error.status}). Try again.` });
  }
  return json(502, { error: 'Could not reach the Tamil service. Try again.' });
}
