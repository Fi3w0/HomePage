export interface NewsItem {
  title: string;
  url: string;
  source: string;
  age_min: number;
}
export interface NewsData {
  items: NewsItem[];
  refreshed_at: number;
}

const DEFAULT_TECH_FEEDS = [
  { url: 'https://feeds.arstechnica.com/arstechnica/index', label: 'arstechnica' },
  { url: 'https://www.theverge.com/rss/index.xml',          label: 'the verge' },
];
const DEFAULT_GAMES_FEEDS = [
  { url: 'https://www.pcgamer.com/rss/',          label: 'pc gamer' },
  { url: 'https://www.rockpapershotgun.com/feed', label: 'rps' },
  { url: 'https://www.eurogamer.net/feed',        label: 'eurogamer' },
];

function parseRss(xml: string, label: string): NewsItem[] {
  const out: NewsItem[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null) {
    const inner = m[1];
    const title = (inner.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1] ?? '')
      .trim()
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#\d+;/g, '');
    const link =
      inner.match(/<link>(.*?)<\/link>/)?.[1]?.trim() ??
      inner.match(/<link[^>]+href="([^"]+)"/)?.[1]?.trim() ?? '';
    const pub =
      inner.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ??
      inner.match(/<published>([\s\S]*?)<\/published>/)?.[1]?.trim() ?? '';
    if (!title || !link) continue;
    const pubMs = pub ? new Date(pub).getTime() : Date.now();
    const age_min = isNaN(pubMs) ? 0 : Math.max(0, Math.round((Date.now() - pubMs) / 60_000));
    out.push({ title, url: link, source: label, age_min });
  }
  return out;
}

async function fetchFeed(url: string, label: string): Promise<NewsItem[]> {
  try {
    const r = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: { 'user-agent': 'Mozilla/5.0 homepage-rss/1.0', accept: 'application/rss+xml,application/xml,text/xml' },
    });
    if (!r.ok) return [];
    return parseRss(await r.text(), label);
  } catch { return []; }
}

async function fetchHN(n = 8): Promise<NewsItem[]> {
  try {
    const r = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', {
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return [];
    const ids: number[] = await r.json();
    const items = await Promise.all(
      ids.slice(0, n + 5).map(async id => {
        try {
          const r2 = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
            signal: AbortSignal.timeout(3000),
          });
          if (!r2.ok) return null;
          const d = await r2.json();
          if (!d?.title || !d?.url) return null;
          const age_min = Math.max(0, Math.round((Date.now() / 1000 - d.time) / 60));
          return { title: d.title, url: d.url, source: 'hn', age_min } as NewsItem;
        } catch { return null; }
      })
    );
    return items.filter(Boolean).slice(0, n) as NewsItem[];
  } catch { return []; }
}

function parseFeedList(env: string, defaults: { url: string; label: string }[]) {
  const raw = env.trim();
  if (!raw) return defaults;
  return raw.split(',').map((u, i) => ({ url: u.trim(), label: `feed${i + 1}` }));
}

export async function getTechNews(): Promise<NewsData | null> {
  const feeds = parseFeedList(process.env.NEWS_TECH_FEEDS ?? '', DEFAULT_TECH_FEEDS);
  const [hn, ...rssResults] = await Promise.all([
    fetchHN(8),
    ...feeds.map(f => fetchFeed(f.url, f.label)),
  ]);
  const all = [...hn, ...rssResults.flat()]
    .filter((item, idx, arr) => arr.findIndex(x => x.title === item.title) === idx)
    .sort((a, b) => a.age_min - b.age_min)
    .slice(0, 8);
  if (!all.length) return null;
  return { items: all, refreshed_at: Date.now() };
}

export async function getGamesNews(): Promise<NewsData | null> {
  const feeds = parseFeedList(process.env.NEWS_GAMES_FEEDS ?? '', DEFAULT_GAMES_FEEDS);
  const results = await Promise.all(feeds.map(f => fetchFeed(f.url, f.label)));
  const all = results.flat()
    .filter((item, idx, arr) => arr.findIndex(x => x.title === item.title) === idx)
    .sort((a, b) => a.age_min - b.age_min)
    .slice(0, 8);
  if (!all.length) return null;
  return { items: all, refreshed_at: Date.now() };
}
