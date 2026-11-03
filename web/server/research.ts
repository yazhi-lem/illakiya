/**
 * Research for Illakiya: Sarvam's chat API has no web search, so we look the
 * topic up on Tamil and English Wikipedia and hand the extracts to the model.
 */

export type WikiSource = { lang: 'ta' | 'en'; title: string; url: string; extract: string };

const DEFAULT_TEMPLATE = 'https://{lang}.wikipedia.org/w/api.php';
const PER_WIKI = 3;
const EXTRACT_CHARS = 2500;
const USER_AGENT = 'Illakiya/0.3 (https://illakiya.yazhi.dev; Tamil writing assistant by Yazhi)';

export function wikiSearchUrl(lang: 'ta' | 'en', query: string, template = DEFAULT_TEMPLATE): string {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    generator: 'search',
    gsrsearch: query,
    gsrlimit: String(PER_WIKI),
    prop: 'extracts|info',
    inprop: 'url',
    exintro: '1',
    explaintext: '1',
    exchars: String(EXTRACT_CHARS),
    exlimit: String(PER_WIKI),
    origin: '*',
  });
  return `${template.replace('{lang}', lang)}?${params}`;
}

type WikiResponse = {
  query?: { pages?: { title?: string; fullurl?: string; extract?: string; index?: number }[] };
};

export function parseWikiResponse(lang: 'ta' | 'en', data: unknown): WikiSource[] {
  const pages = (data as WikiResponse)?.query?.pages ?? [];
  return [...pages]
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .filter((p) => p.title && p.fullurl && p.extract && p.extract.trim().length > 40)
    .map((p) => ({ lang, title: p.title!, url: p.fullurl!, extract: p.extract!.trim() }));
}

async function searchWiki(lang: 'ta' | 'en', query: string, template?: string): Promise<WikiSource[]> {
  const res = await fetch(wikiSearchUrl(lang, query, template), {
    headers: { 'user-agent': USER_AGENT, accept: 'application/json' },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) return [];
  return parseWikiResponse(lang, await res.json());
}

/**
 * Look up Tamil Wikipedia (with the Tamil query, or the English one) and
 * English Wikipedia (with the English query). Never throws: research is best
 * effort and an empty result just means the model writes without sources.
 */
export async function research(queries: { ta?: string; en?: string }, template?: string): Promise<WikiSource[]> {
  const tasks: Promise<WikiSource[]>[] = [];
  const taQuery = queries.ta || queries.en;
  if (taQuery) tasks.push(searchWiki('ta', taQuery, template));
  if (queries.en) tasks.push(searchWiki('en', queries.en, template));
  const settled = await Promise.allSettled(tasks);
  const seen = new Set<string>();
  const out: WikiSource[] = [];
  for (const r of settled) {
    if (r.status !== 'fulfilled') continue;
    for (const s of r.value) {
      if (!seen.has(s.url)) {
        seen.add(s.url);
        out.push(s);
      }
    }
  }
  return out;
}
