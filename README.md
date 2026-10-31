# StreamNexus (FreeVid)

A React streaming discovery and playback UI backed by an optional Express API for accounts, cloud sync, and reviews. Catalog data comes from TMDB; playback uses third-party embed providers; subtitles come from SubDL.

## Features

- **Shared app shell** — sticky glass header with browse/sources/profile navigation, account state, and a theme switcher available on every page
- **Dual catalogs** — browse and filter movies and TV shows with search, genre, year, and sort controls
- **Rotating hero wall** — the browse hero is backed edge-to-edge by poster cards that reshuffle every few seconds, mixing trending picks with older titles
- **Multi-server player** — VidCore (default), VidSrc.pm, Vidy, Atlantic, 2Embed, and Rivestream, plus a custom embed URL; an optional iframe sandbox (off by default, one click to enable) blocks popups and top-level redirects
- **Ambiance glow** — an optional light halo around the player, tinted from the title's TMDB artwork; off by default, remembered per device, and hidden in fullscreen
- **Sources page** — `/sources` lists every playback provider with its URL shape and capabilities, plus the other services and libraries the app uses
- **Player-first mobile layout** — on narrow screens the video sits above the poster, with a collapsible playback/subtitle tools panel
- **TV show support** — season/episode selector with TMDB metadata and episode progress
- **Smart subtitles** — fetch, extract, convert, and offset subtitles in the browser
- **Profile and sync** — favorites, watch history, continue watching, watch time; local-first with optional cloud sync
- **Personalized recommendations** — genre-based suggestions from watch history
- **Keyboard shortcuts** — Space, F, M, and arrow keys
- **Themes** — Air (dark, default), Air Light, Modern Dark, and Netflix Red, all sharing the Air layout and switched from the header modal or the profile picker, remembered per device

## Architecture

| Part | Location |
| --- | --- |
| React app (Vite) | `main.jsx`, `App.jsx`, `SelectionPage.jsx`, `PlayerPage.jsx`, `ProfilePage.jsx`, `SourcesPage.jsx` |
| Shared UI | `components/SiteHeader.jsx`, `components/ThemeMenu.jsx`, `components/ThemePicker.jsx`, `components/Icons.jsx` |
| Design system | `public/styles.css` (tokens and component styles) |
| Air structure | `public/themes/air.css` (shared component language for every skin) |
| Theme skins | `public/themes/royal-theme.css`, `minimal-light.css`, `modern-dark.css`, `netflix-red.css` (palette and semantic tokens only) |
| Shared client logic | `app.js`, `lib/sync.js`, `lib/theme.js`, `lib/validate.js` |
| API (Express, Vercel function) | `server.js`, `api/index.js` |
| Persistence | `storage.js` (Vercel KV / Upstash REST, local JSON file fallback) |

The client and API are same-origin in production. During local development Vite proxies `/api` to `http://localhost:5001`.

## Theming

Every page reads from design tokens in `public/styles.css` (`--bg`, `--panel`, `--text`, `--accent`, `--font-display`, and so on). `public/themes/air.css` layers the shared Air component language on top: full-bleed poster hero with a flat scrim, Inter 500 UI, Anton + Caveat display cuts, 4/8/11/12px radii, flat surfaces without shadows or gradients, ghost and haze buttons, and Haze light-island cards. Each theme file loaded last supplies only a palette plus semantic `--canvas-*`, `--card-*`, and `--media-*` tokens. Air (dark) and Air Light mirror each other around the same structure; Modern Dark and Netflix Red keep the structure with slate/blue and black/red signals. Switching applies live through `<link id="theme-stylesheet">` plus a `theme-changed` event, persists in `localStorage` under `streamnexus_active_theme`, and updates the `theme-color` meta tag. Visual effects are CSS/SVG only — no image assets.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create the environment file:
   ```bash
   cp .env.example .env
   ```
   Fill in `VITE_TMDB_API_KEY`, `VITE_SUBDL_API_KEY`, and `JWT_SECRET`.
3. Start the UI and API:
   ```bash
   npm run dev:all
   ```
   Or run them separately with `npm run dev` and `npm run server`.

> `VITE_*` values are inlined into the client bundle at build time. TMDB and SubDL keys are therefore visible to anyone using the app — restrict them to the intended domains/quotas and rotate them if they have ever been committed to git.

## Production

```bash
npm run build
```

Required environment variables:

- `VITE_TMDB_API_KEY`, `VITE_SUBDL_API_KEY` — build-time client configuration
- `JWT_SECRET` — required; the server refuses to start in production without it
- `KV_REST_API_URL`, `KV_REST_API_TOKEN` — Vercel KV or Upstash Redis REST credentials. Without them the API falls back to the local filesystem (read-only on Vercel except `/tmp`), so accounts and sync data will be lost between cold starts
- `ALLOWED_ORIGINS` — optional comma-separated list; only needed when the UI and API are served from different origins

## Data and privacy

- Favorites, history, progress, and watch time are stored in `localStorage`.
- When signed in, the client merges local data with the server (`/api/user/sync`). Deletions are propagated with tombstones and a clear-history timestamp.
- The server stores passwords as bcrypt hashes and issues 7-day JWTs.
- Subtitle files are uploaded to third-party temporary hosts when auto-attaching; do not use that flow for sensitive content.
- Never commit `env.js`, `.env`, or `database.json`. If a key was committed previously, rotate it and purge it from git history (`git filter-repo --path env.js --invert-paths`, then force-push) — removing the file in a new commit does not remove it from history.

## Tests and lint

```bash
npm test
npm run lint
```

CI runs lint, tests, and a production build on every push and pull request (`.github/workflows/ci.yml`).
