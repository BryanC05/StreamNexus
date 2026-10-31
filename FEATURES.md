# StreamNexus (FreeVid) - Feature Overview

## 🎬 Content Discovery & Catalog
- **Dual Catalogs**: Browse and toggle between Movies and TV Shows seamlessly.
- **Rotating Hero Wall**: The hero panel is filled edge-to-edge with poster cards that reshuffle every few seconds, weighing trending/popular titles while still surfacing older ones. Rotation pauses on hidden tabs and respects reduced-motion preferences.
- **TMDB Integration**: Automatically fetches popular movies and TV shows from The Movie Database (TMDB).
- **Offline/Fallback Catalog**: Built-in curated lists of popular movies and TV shows when TMDB API is unavailable or unconfigured.
- **Advanced Search**: Real-time debounced search functionality across the entire TMDB library.
- **Genre Filtering**: Filter content by specific categories (e.g., Action, Comedy, Sci-Fi, Animation).
- **Pagination**: "Load More" functionality to comfortably browse large catalogs (+60 items per click).

## ▶️ Advanced Video Player
- **Multi-Server Support**: Choose between streaming providers (VidCore by default, plus VidSrc.pm, Vidy, Atlantic, 2Embed, and Rivestream) for maximum reliability, with one-click switching next to the player. A player-chip toggle switches the iframe sandbox on or off (default: off); when on, embeds cannot open popups or navigate the tab. Vidy refuses to run sandboxed, and the player warns when that combination is selected.
- **Ambiance Glow**: An optional soft light halo around the player, tinted from the current episode still or title backdrop. Toggled from a chip next to the server switcher, off by default, remembered per device, and hidden while the player is fullscreen.
- **TV Show Interface**: Dedicated UI for TV series, including visual season dropdowns and dynamic episode lists with TMDB thumbnails and descriptions.
- **Seamless Progress Tracking**: Automatically tracks video playback progress via cross-origin iframe events (`postMessage`).
- **Resume Playback**: Automatically appends URL parameters to resume playback exactly where you left off.
- **Customizable Player**: Support for custom player UI colors and AutoPlay configuration.

## 💬 Smart Subtitles Integration
- **Auto-Fetch Subtitles**: One-click download of English subtitles utilizing the SubDL API.
- **In-Browser Extraction**: Automatically unzips subtitle archives (`.zip`) purely in the browser memory using `fflate` (no backend required).
- **Season Pack Intelligence**: Intelligently searches inside TV season packs to extract the exact `.srt` or `.vtt` file for the specific episode currently being watched.
- **Auto-Format Conversion**: Converts raw SubRip (`.srt`) texts to WebVTT (`.vtt`) format for native browser compatibility.
- **CORS & Proxy Fallbacks**: Uses a robust chain of multiple CORS proxies (Corsproxy.io, CodeTabs, AllOrigins) to bypass provider blocks or Cloudflare checks.
- **Manual URL Injection**: Support for pasting external subtitle URLs (`&subtitles=`) directly into the player iframe.

## 👤 User Profile & Tracking
- **Continue Watching**: A dedicated section displaying currently active titles (titles with < 95% completion).
- **Favorites List**: Save titles to your favorites for quick access. Accessible from any poster card or player page.
- **Watch History**: Automatically logs every movie and episode you watch.
- **Global Watch Time**: Accumulates and tracks your total time spent watching content across the application.
- **Privacy First**: All data is stored locally in your browser (`localStorage`). No tracking servers.
- **One-Click Data Clear**: Easily wipe your watch history, favorites, and progress data in the Profile settings.

## ⚙️ Technical & Advanced Capabilities
- **Responsive UI**: Mobile-first layout with shelves that drag-scroll and never force horizontal page overflow, including edge-case long titles and touch gestures.
- **Shared Header**: A sticky, glassy site header on every page with brand, browse/sources/profile navigation, account actions, and a theme switcher, collapsing to a compact two-row layout on phones.
- **Sources Page**: `/sources` documents every playback provider with its movie/TV URL shape, subtitle and sandbox capabilities, and outbound links, plus the other services and libraries the app uses (TMDB, SubDL, CORS proxies, React, Vite, storage, fonts).
- **Optimized API Usage**: Search inputs are debounced (500ms) to prevent TMDB API rate-limiting.
- **Intersection Observers**: Lazy-loads TV show stats (Seasons/Episodes count) only when the posters scroll into view to conserve bandwidth.
- **Dynamic Auto-Healing**: Automatically self-heals corrupted watch times or invalid configuration states in local storage.
- **Environment Variables**: API keys (TMDB, SubDL) load from `VITE_*` environment variables at build time.
- **Cloud Sync & Accounts**: Optional Express API with bcrypt password hashing, JWT auth, merge-based sync, deletion tombstones, and durable Vercel KV/Upstash storage.

## 🎹 Keyboard Shortcuts (Feature #6)
- **Space**: Play/Pause video playback
- **F**: Toggle fullscreen mode
- **M**: Mute/Unmute audio
- **Arrow Left/Right**: Seek backward/forward 10 seconds
- **Arrow Up/Down**: Increase/decrease volume
- **Escape**: Exit lights-out mode
- *Shortcuts disabled when typing in input fields*

## 🎨 Theme Customization (Feature #8)
- **4 Distinct Themes** (all built on the Air design language):
  - Air (default) - Midnight sky through glass; black canvas, Haze cards, Anton + Caveat headlines
  - Air Light - Warm paper canvas, white cards, ink chrome, same Air geometry
  - Modern Dark - Slate sky with an electric blue signal
  - Netflix Red - Black canvas with a red signal
- **Air Design System**: `public/themes/air.css` supplies the shared component language (4/8/11/12px radii, flat surfaces, ghost/haze buttons, Haze light-island cards, Inter 500 UI), while each skin supplies only palette and semantic canvas/card tokens, so every component stays consistent in dark and light modes
- **Theme Selector Everywhere**: Portal-based picker in the header plus live preview cards in the Profile appearance panel
- **Persistent Preference**: Selected theme saved to localStorage and applied before React renders
- **Live Switching**: Stylesheet, `theme-color` meta tag, and accents update instantly without a reload

## 🎯 Personalized Recommendations (Feature #11)
- **Genre Analysis**: Analyzes watch history to identify top 3 preferred genres
- **Smart Discovery**: Fetches TMDB recommendations based on favorite genres
- **Duplicate Prevention**: Excludes already-watched content from recommendations
- **"Because You Watched" Row**: Dedicated carousel on SelectionPage showing personalized picks
- **Fallback Logic**: Fills with popular items when insufficient watch history exists