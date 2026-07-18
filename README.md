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
- **Keyboard Shortcuts** — Space (play/pause), F (fullscreen), M (mute), Arrow keys (seek/volume)
- **Theme Customization** — Choose from 4 UI themes: Royal Gold, Modern Dark, Netflix Red, Minimal Light
- **Personalized Recommendations** — "Because You Watched" suggestions based on your viewing history

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
   cp .env.example .env
   ```
   Edit `.env` and add your TMDB and SubDL API keys as environment variables (e.g., `VITE_TMDB_API_KEY=your_key`).

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
