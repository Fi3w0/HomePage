const LASTFM_API_KEY = process.env.LASTFM_API_KEY ?? "";
const LASTFM_USER = process.env.LASTFM_USER ?? "Fi3w0";

export interface NowPlaying {
  is_playing: boolean;
  song: string;
  artist: string;
  album: string;
  album_art_url: string;
  progress_ms: number;
  duration_ms: number;
}

export interface RecentTrack {
  song: string;
  artist: string;
  album: string;
  album_art_url: string;
  played_at: string;
}

export interface SpotifyData {
  now: NowPlaying | null;
  recent: RecentTrack[];
  user: string;
}

export async function getSpotifyData(): Promise<SpotifyData | null> {
  if (!LASTFM_API_KEY) return null;
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USER}&api_key=${LASTFM_API_KEY}&format=json&limit=10`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Last.fm ${r.status}`);
    const d = await r.json();
    const tracks = d?.recenttracks?.track ?? [];

    let now: NowPlaying | null = null;
    const nowTrack = tracks.find((t: any) => t["@attr"]?.nowplaying === "true");
    if (nowTrack) {
      now = {
        is_playing: true,
        song: nowTrack.name ?? "",
        artist: nowTrack.artist?.["#text"] ?? "",
        album: nowTrack.album?.["#text"] ?? "",
        album_art_url: nowTrack.image?.find((i: any) => i["#text"]?.includes("300x300") || i["#text"]?.includes("640x640"))?.["#text"]
          ?? nowTrack.image?.find((i: any) => i.size === "extralarge")?.["#text"]
          ?? nowTrack.image?.find((i: any) => i.size === "large")?.["#text"]
          ?? "",
        progress_ms: 0,
        duration_ms: 0,
      };
    }

    const recent: RecentTrack[] = tracks
      .filter((t: any) => t["@attr"]?.nowplaying !== "true")
      .slice(0, 3)
      .map((t: any) => ({
        song: t.name ?? "",
        artist: t.artist?.["#text"] ?? "",
        album: t.album?.["#text"] ?? "",
        album_art_url: t.image?.find((i: any) => i["#text"]?.includes("300x300") || i["#text"]?.includes("640x640"))?.["#text"]
          ?? t.image?.find((i: any) => i.size === "extralarge")?.["#text"]
          ?? "",
        played_at: t.date?.uts ? new Date(Number(t.date.uts) * 1000).toISOString() : "",
      }));

    return { now, recent, user: LASTFM_USER };
  } catch (e) {
    console.error("Last.fm error:", e);
    return null;
  }
}
