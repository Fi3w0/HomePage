const CLIENT_ID = process.env.TWITCH_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET ?? "";
const CHANNELS = (process.env.TWITCH_CHANNELS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

let tokenCache: { token: string; expires: number } | null = null;

async function appToken(): Promise<string> {
  if (tokenCache && tokenCache.expires > Date.now() + 60_000) return tokenCache.token;
  const r = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });
  if (!r.ok) throw new Error(`Twitch token ${r.status}`);
  const d = await r.json();
  tokenCache = { token: d.access_token, expires: Date.now() + d.expires_in * 1000 };
  return d.access_token;
}

async function helix(path: string, token: string) {
  const r = await fetch(`https://api.twitch.tv/helix${path}`, {
    headers: { "Client-Id": CLIENT_ID, Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`Twitch ${path} ${r.status}`);
  return r.json();
}

export interface TwitchStreamer {
  login: string;
  display_name: string;
  profile_image_url: string;
  live: boolean;
  game?: string;
  title?: string;
  viewers?: number;
  duration_min?: number;
}

export async function getTwitchFollowing(): Promise<TwitchStreamer[] | null> {
  if (!CLIENT_ID || !CLIENT_SECRET || !CHANNELS.length) return null;
  try {
    const token = await appToken();

    const loginQs  = CHANNELS.map((c) => `login=${encodeURIComponent(c)}`).join("&");
    const streamQs = CHANNELS.map((c) => `user_login=${encodeURIComponent(c)}`).join("&");
    const [usersData, streamsData] = await Promise.all([
      helix(`/users?${loginQs}`, token),
      helix(`/streams?${streamQs}`, token),
    ]);

    const liveMap = new Map<string, any>();
    for (const s of streamsData.data ?? []) liveMap.set(s.user_login.toLowerCase(), s);

    const gameIds = [...new Set<string>(
      (streamsData.data ?? []).map((s: any) => s.game_id).filter(Boolean)
    )];
    const gameMap = new Map<string, string>();
    if (gameIds.length) {
      const gd = await helix(`/games?${gameIds.map((id) => `id=${id}`).join("&")}`, token);
      for (const g of gd.data ?? []) gameMap.set(g.id, g.name);
    }

    const result: TwitchStreamer[] = CHANNELS.map((ch) => {
      const info = (usersData.data ?? []).find((u: any) => u.login.toLowerCase() === ch);
      const stream = liveMap.get(ch);
      if (stream) {
        const dur = Math.round((Date.now() - new Date(stream.started_at).getTime()) / 60000);
        return {
          login: ch,
          display_name: info?.display_name ?? ch,
          profile_image_url: info?.profile_image_url ?? "",
          live: true,
          game: gameMap.get(stream.game_id) ?? stream.game_name,
          title: stream.title,
          viewers: stream.viewer_count,
          duration_min: dur,
        };
      }
      return { login: ch, display_name: info?.display_name ?? ch, profile_image_url: info?.profile_image_url ?? "", live: false };
    });

    // Live first (sorted by viewers), then offline
    result.sort((a, b) => {
      if (a.live !== b.live) return a.live ? -1 : 1;
      if (a.live && b.live) return (b.viewers ?? 0) - (a.viewers ?? 0);
      return 0;
    });

    return result;
  } catch (e) {
    console.error("Twitch error:", e);
    return null;
  }
}
