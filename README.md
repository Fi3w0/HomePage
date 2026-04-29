<p align="center">
  <img src="https://img.shields.io/badge/status-live-22c55e?style=flat-square" alt="status">
  <img src="https://img.shields.io/badge/stack-bun-f9a8d4?style=flat-square" alt="bun">
  <img src="https://img.shields.io/badge/theme-obsidian-a78bfa?style=flat-square" alt="obsidian">
</p>

<h1 align="center">🏠 fiw's HomePage</h1>
<h3 align="center"><em>your new tab, but homelabbed.</em></h3>

<p align="center">
  A live, self-hosted dashboard that replaces your browser's new tab page —<br>
  real-time widgets for your homelab, all inside a fully themed, pixel-perfect shell.
</p>

<p align="center">
  Running behind Traefik at <strong>home.fiwservers.lol</strong>.
</p>

---

## ✨ Features

### Live Widgets
| Widget | Source | Refresh |
|--------|--------|---------|
| **Spotify** | Last.fm (scrobbles) | 30s |
| **Discord** | Discord RPC via bot | 60s |
| **GitHub** | GraphQL API | 5m |
| **Twitch** | Twitch API | 90s |
| **Steam** | Steam API | 15m |
| **Minecraft** | Server ping + Docker stats | 30s |
| **Docker** | Docker socket | 30s |
| **RSS News** | Configurable feeds | 15m |

### Widget Details
- **Spotify**: now playing album art, progress, 3 recent tracks
- **GitHub**: contribution heatmap (98 days), real commit feed, streak counter
- **Minecraft**: online status, ping, player list, CPU/RAM usage bars
- **Docker**: container list, running/stopped count, host CPU/RAM
- **Discord**: presence, current activity, recent history timeline
- **Steam**: recently played games with playtime bars, last achievement sync

### Interactive
- **Search bar** with bangs: `g`, `yt`, `gh`, `w`, `r`, `map`, `npm`, `so`, `mdn`
- **Editable quicklinks** — add/edit/delete with custom colors (persists in localStorage)
- **Drag & drop** widget reordering (edit mode)
- **Settings panel** — theme switcher (6 themes), accent colors, fonts, greeting styles

### Silly Fun
- Confetti on greeting clicks
- Cursor sparkles ✨
- Konami code rotation
- Comic sans / rainbow / upside-down / wiggle modes
- Tiny & chonky scaling
- CRT scanlines & typewriter effect
- Pet rock 🪨 (click to pet, name it)

---

## 🏗 Stack

| Layer | Tech |
|-------|------|
| Server | [Bun](https://bun.sh) |
| Backend | TypeScript (Bun.serve, no framework) |
| Frontend | Vanilla JS, CSS custom properties |
| Proxy | Traefik with auto TLS |
| Containers | Docker Compose |

---

## 🚀 Getting Started

```bash
git clone https://github.com/Fi3w0/HomePage
cd HomePage
cp .env.example .env
# fill in your API keys
docker compose up -d
```

### Required API Keys
- `GITHUB_TOKEN` — [GitHub PAT](https://github.com/settings/tokens) (public repos)
- `STEAM_API_KEY` — [Steam API key](https://steamcommunity.com/dev/apikey)
- `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` — [Twitch dev app](https://dev.twitch.tv/console)
- `LASTFM_API_KEY` — [Last.fm API](https://www.last.fm/api/account/create)
- `DISCORD_BOT_TOKEN` — Discord bot token for presence data

### Optional
- `DOCKER_SOCKET` — for Docker container stats
- `MC_HOST` / `MC_PORT` — Minecraft server ping
- `NEWS_TECH_FEEDS` / `NEWS_GAMES_FEEDS` — custom RSS feeds

---

## 🎨 Themes

Obsidian · Neon · Paper · Catppuccin · Forest · Rose

Each theme sets a full palette of CSS custom properties — accent colors, backgrounds, surface tones, and fonts.

---

## 📁 Project Structure

```
├── compose.yml         # Docker Compose + Traefik labels
├── Dockerfile          # Bun container build
├── .env.example        # All config keys documented
├── server/
│   ├── index.ts        # Main server + route table
│   ├── docker.ts       # Docker socket reader
│   ├── github.ts       # GitHub GraphQL + REST
│   ├── mc.ts           # Minecraft server ping
│   ├── spotify.ts      # Last.fm scrobbles proxy
│   ├── steam.ts        # Steam API + wishlist
│   ├── twitch.ts       # Twitch API
│   ├── discord.ts      # Discord bot proxying
│   └── news.ts         # RSS feed parser
└── public/
    ├── index.html       # Single-page shell
    ├── app.v2.js        # All frontend logic (~1150 lines)
    ├── styles.css       # All styles (~1800 lines)
    └── tweaks.css       # Card layout overrides
```

---

## 📜 License

**CC BY-NC-SA 4.0** — You are free to share and adapt this project for non-commercial purposes, as long as you give appropriate credit, provide a link to the original repository, and distribute your contributions under the same license.

See [Creative Commons BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) for details.
