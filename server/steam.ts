const KEY = process.env.STEAM_API_KEY ?? "";
const STEAM_ID = process.env.STEAM_ID ?? "";

export interface SteamGame {
  appid: number;
  name: string;
  hours_2weeks: number | null;
  hours_total: number;
  last_played: number; // unix timestamp
  cover: string;
  url: string;
}
export interface SteamRecent { games: SteamGame[]; achievement?: string; }

function coverUrl(appid: number) {
  return `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/header.jpg`;
}

function mapGame(g: any): SteamGame {
  return {
    appid: g.appid,
    name: g.name ?? `App ${g.appid}`,
    hours_2weeks: g.playtime_2weeks > 0
      ? Math.round((g.playtime_2weeks / 60) * 10) / 10
      : null,
    hours_total: Math.round((g.playtime_forever / 60) * 10) / 10,
    last_played: g.rtime_last_played ?? 0,
    cover: coverUrl(g.appid),
    url: `https://store.steampowered.com/app/${g.appid}`,
  };
}

export async function getSteamRecent(): Promise<SteamRecent | null> {
  if (!KEY || !STEAM_ID) return null;
  try {
    // GetOwnedGames with rtime_last_played lets us sort the full library by
    // most recently played — not limited to the 2-week window of GetRecentlyPlayedGames
    const r = await fetch(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${KEY}&steamid=${STEAM_ID}&include_appinfo=1&include_played_free_games=1&format=json`
    );
    if (!r.ok) throw new Error(`Steam GetOwnedGames ${r.status}`);
    const data = await r.json();
    const rawGames: any[] = data.response?.games ?? [];

    const games = rawGames
      .filter(g => g.rtime_last_played > 0 && g.playtime_forever > 0)
      .sort((a, b) => b.rtime_last_played - a.rtime_last_played)
      .slice(0, 8)
      .map(mapGame);

    // Fallback: if profile is private or library empty, try recent-2weeks endpoint
    if (games.length === 0) {
      const r2 = await fetch(
        `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?key=${KEY}&steamid=${STEAM_ID}&count=8&format=json`
      );
      if (r2.ok) {
        const d2 = await r2.json();
        const fallback = (d2.response?.games ?? []).map((g: any) => ({
          ...g, rtime_last_played: Math.floor(Date.now() / 1000) - 86400,
        })).map(mapGame);
        return { games: fallback };
      }
    }

    // Fetch last achievement for the top game
    const topGame = games[0];
    const achievement = topGame ? await getLastAchievement(topGame.appid).catch(() => null) : null;

    return { games, achievement: achievement ?? undefined };
  } catch (e) {
    console.error("Steam error:", e);
    return null;
  }
}

// Fetch last unlocked achievement for the most recently played game
async function getLastAchievement(appid: number): Promise<string | null> {
  try {
    const r = await fetch(
      `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${KEY}&steamid=${STEAM_ID}&appid=${appid}&l=en`
    );
    if (!r.ok) return null;
    const d = await r.json();
    const achievements: any[] = d.playerstats?.achievements ?? [];
    const unlocked = achievements.filter(a => a.achieved === 1);
    if (unlocked.length === 0) return null;
    const last = unlocked[unlocked.length - 1];
    return `«${last.name}»`;
  } catch { return null; }
}

export async function getSteamWishlist(): Promise<WishlistData | null> {
  if (!KEY || !STEAM_ID) return null;
  try {
    const r = await fetch(
      `https://api.steampowered.com/IWishlistService/GetWishlist/v1/?key=${KEY}&steamid=${STEAM_ID}`
    );
    if (!r.ok) throw new Error(`Wishlist ${r.status}`);
    const data = await r.json();
    const rawItems: { appid: number; priority: number }[] = data.response?.items ?? [];
    if (!rawItems.length) return { items: [] };

    rawItems.sort((a, b) => a.priority - b.priority);
    const appids = rawItems.slice(0, 15).map(i => i.appid);

    // Steam store API doesn't support batch requests — fetch individually in parallel
    const storeResults = await Promise.all(
      appids.map(async appid => {
        try {
          const r = await fetch(
            `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=us&l=en`,
            { signal: AbortSignal.timeout(6000) }
          );
          if (!r.ok) return null;
          const j = await r.json();
          return j?.[String(appid)]?.success ? j[String(appid)].data : null;
        } catch { return null; }
      })
    );

    const items: WishlistItem[] = appids.map((appid, idx) => {
      const d = storeResults[idx];
      const po = d?.price_overview;
      let price: string | null = null;
      let price_original: string | null = null;
      let discount_pct: number | null = null;
      const unreleased = d?.release_date?.coming_soon === true;
      if (d?.is_free) {
        price = 'free';
      } else if (po) {
        price = po.final_formatted ?? null;
        if (po.discount_percent > 0) {
          price_original = po.initial_formatted ?? null;
          discount_pct = po.discount_percent;
        }
      }
      return {
        appid,
        name: d?.name ?? `App ${appid}`,
        cover: `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/header.jpg`,
        url: `https://store.steampowered.com/app/${appid}`,
        price,
        price_original,
        discount_pct,
        unreleased,
      };
    });

    return { items };
  } catch (e) {
    console.error('Wishlist error:', e);
    return null;
  }
}
