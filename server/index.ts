import { file } from "bun";
import { join, normalize } from "node:path";
import { pingServer, type McStatus } from "./mc";
import { getGithubActivity, type GithubActivity } from "./github";
import { getTwitchFollowing, type TwitchStreamer } from "./twitch";
import { getDiscordPresence, type DiscordPresence } from "./discord";
import { getSteamRecent, getSteamWishlist, type SteamRecent } from "./steam";
import { getTechNews, getGamesNews, type NewsData } from "./news";
import { getSpotifyData, type SpotifyData } from "./spotify";

const PORT = Number(process.env.PORT ?? 3000);
const PUBLIC_DIR = new URL("../public/", import.meta.url).pathname;
const MC_HOST = process.env.MC_HOST ?? "minecraft-main";
const MC_PORT = Number(process.env.MC_PORT ?? 25565);

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-cache" },
  });

const notImplemented = (provider: string) =>
  json({ error: "not_implemented", provider }, 501);

// ── caches ──
function makeCache<T>(ttlMs: number, fn: () => Promise<T | null>) {
  let cached: { at: number; data: T } | null = null;
  return async (): Promise<T | null> => {
    if (cached && Date.now() - cached.at < ttlMs) return cached.data;
    const data = await fn();
    if (data != null) cached = { at: Date.now(), data };
    return data;
  };
}

let mcCache: { at: number; data: McStatus } | null = null;
async function getMcStatus(): Promise<McStatus> {
  if (mcCache && Date.now() - mcCache.at < 20_000) return mcCache.data;
  const data = await pingServer(MC_HOST, MC_PORT);
  mcCache = { at: Date.now(), data };
  return data;
}

const getCachedSpotify   = makeCache(30_000,        getSpotifyData);
const getCachedGithub    = makeCache(5 * 60_000,   getGithubActivity);
const getCachedTwitch    = makeCache(60_000,        getTwitchFollowing);
const getCachedDiscord   = makeCache(60_000,        getDiscordPresence);
const getCachedSteam     = makeCache(15 * 60_000,  getSteamRecent);
const getCachedWishlist  = makeCache(30 * 60_000,  getSteamWishlist);
const getCachedTechNews  = makeCache(15 * 60_000,  getTechNews);
const getCachedGamesNews = makeCache(15 * 60_000,  getGamesNews);

// ── routes ──
const apiRoutes: Record<string, () => Response | Promise<Response>> = {
  "/api/health":            () => json({ ok: true, ts: Date.now() }),
  "/api/mc/status":         async () => json(await getMcStatus()),
  "/api/github/activity":   async () => {
    const d = await getCachedGithub();
    return d ? json(d) : notImplemented("github");
  },
  "/api/twitch/following":  async () => {
    const d = await getCachedTwitch();
    return d ? json(d) : notImplemented("twitch");
  },
  "/api/steam/recent":      async () => {
    const d = await getCachedSteam();
    return d ? json(d) : notImplemented("steam");
  },
  "/api/steam/wishlist":    async () => {
    const d = await getCachedWishlist();
    return d ? json(d) : notImplemented("steam");
  },
  "/api/news/tech":         async () => {
    const d = await getCachedTechNews();
    return d ? json(d) : notImplemented("news");
  },
  "/api/news/games":        async () => {
    const d = await getCachedGamesNews();
    return d ? json(d) : notImplemented("news");
  },
  "/api/spotify/data":      async () => {
    const d = await getCachedSpotify();
    return d ? json(d) : notImplemented("spotify");
  },
  "/api/discord/presence":  async () => {
    const d = await getCachedDiscord();
    return d ? json(d) : notImplemented("discord");
  },
  "/api/docker/list":       () => notImplemented("docker"),
};

async function serveStatic(pathname: string): Promise<Response> {
  const rel = pathname === "/" ? "/index.html" : pathname;
  const safe = normalize(rel).replace(/^(\.\.[/\\])+/, "");
  const full = join(PUBLIC_DIR, safe);
  if (!full.startsWith(PUBLIC_DIR)) return new Response("forbidden", { status: 403 });
  const f = file(full);
  if (!(await f.exists())) return new Response("not found", { status: 404 });
  return new Response(f);
}

const server = Bun.serve({
  port: PORT,
  hostname: "0.0.0.0",
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    if (path.startsWith("/api/")) {
      const handler = apiRoutes[path];
      if (handler) return handler();
      return json({ error: "not_found" }, 404);
    }
    return serveStatic(path);
  },
});

console.log(`homepage server listening on http://${server.hostname}:${server.port}`);
