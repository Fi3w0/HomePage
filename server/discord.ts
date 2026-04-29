const PRESENCE_URL = process.env.DISCORD_PRESENCE_URL ?? "";
const USER_ID = process.env.DISCORD_USER_ID ?? "";

export interface DiscordActivity {
  type: number;
  name: string;
  details?: string;
  state?: string;
  duration?: string;
  label?: string;
  text?: string;
}

export interface SpotifyInfo {
  song: string;
  artist: string;
  album: string;
  album_art_url: string;
  timestamps: { start: number; end: number };
}

export interface HistoryEntry {
  type: number;
  name: string;
  duration: number;
  label: string;
  time_ago: string;
}

export interface DiscordPresence {
  username: string;
  display_name?: string;
  avatar_url: string;
  status: "online" | "idle" | "dnd" | "offline";
  current_activities: DiscordActivity[];
  spotify?: SpotifyInfo;
  last_activity?: HistoryEntry;
  longest_activities: HistoryEntry[];
}

export async function getDiscordPresence(): Promise<DiscordPresence | null> {
  if (!PRESENCE_URL || !USER_ID) return null;
  try {
    const r = await fetch(`${PRESENCE_URL.replace(/\/$/, "")}/${USER_ID}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}
