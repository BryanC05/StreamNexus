# StreamNexus (FreeVid)

A React-based streaming content discovery platform. Browse movies and TV shows from TMDB, stream via multiple providers, and track your watch history — all client-side with no backend.

## Features

- **Dual Catalogs** — Browse Movies and TV Shows with seamless toggle
- **TMDB Integration** — Fetches popular, searched, and genre-filtered content
- **Multi-Server Player** — Choose between VidSrc, Vidking, and other streaming providers
- **TV Show Support** — Season/episode selector with TMDB metadata
- **Smart Subtitles** — Auto-fetch, extract, and convert subtitles via SubDL
- **User Profile** — Continue Watching, Favorites, Watch History, Watch Time (all in `localStorage`)
- **Privacy-First** — No data leaves your browser; one-click data clear in Profile settings

## Getting Started

1. **Clone the repo**
   ```bash
   git clone https://github.com/yourusername/StreamNexus.git
   cd StreamNexus
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API keys**
   ```bash
   cp env.example.js env.js
   ```
   Edit `env.js` and add your [TMDB](https://www.themoviedb.org/settings/api) and [SubDL](https://subdl.com/) API keys.

4. **Start the dev server**
   ```bash
   npm run dev
   ```

## Build for Production

```bash
npm run build
npm run preview
```

## Tech Stack

- React 18 + React Router 6
- Vite
- TMDB API
- SubDL API
- VidSrc / Vidking embed providers

```
See `FEATURES.md` for a detailed breakdown of all capabilities.
