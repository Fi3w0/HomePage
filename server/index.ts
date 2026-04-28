import { file } from "bun";
import { join, normalize } from "node:path";

const PORT = Number(process.env.PORT ?? 3000);
const PUBLIC_DIR = new URL("../public/", import.meta.url).pathname;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const notImplemented = (provider: string) =>
  json({ error: "not_implemented", provider }, 501);

const apiRoutes: Record<string, () => Response | Promise<Response>> = {
  "/api/health": () => json({ ok: true, ts: Date.now() }),
  "/api/spotify/now": () => notImplemented("spotify"),
  "/api/spotify/recent": () => notImplemented("spotify"),
  "/api/discord/presence": () => notImplemented("discord"),
  "/api/github/activity": () => notImplemented("github"),
  "/api/twitch/following": () => notImplemented("twitch"),
  "/api/steam/recent": () => notImplemented("steam"),
  "/api/steam/wishlist": () => notImplemented("steam"),
  "/api/mc/status": () => notImplemented("mc"),
  "/api/docker/list": () => notImplemented("docker"),
  "/api/news/tech": () => notImplemented("news"),
  "/api/news/games": () => notImplemented("news"),
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
