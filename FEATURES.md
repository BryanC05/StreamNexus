# StreamNexus (FreeVid) - Feature Overview

## 🎬 Content Discovery & Catalog
- **Dual Catalogs**: Browse and toggle between Movies and TV Shows seamlessly.
- **TMDB Integration**: Automatically fetches popular movies and TV shows from The Movie Database (TMDB).
- **Offline/Fallback Catalog**: Built-in curated lists of popular movies and TV shows when TMDB API is unavailable or unconfigured.
- **Advanced Search**: Real-time debounced search functionality across the entire TMDB library.
- **Genre Filtering**: Filter content by specific categories (e.g., Action, Comedy, Sci-Fi, Animation).
- **Pagination**: "Load More" functionality to comfortably browse large catalogs (+60 items per click).

## ▶️ Advanced Video Player
- **Multi-Server Support**: Choose between multiple streaming providers (VidSrc.me, VidSrc.in, VidSrc.pm, Vidking) for maximum reliability.
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
- **Responsive UI**: Mobile-first, fully responsive grid layouts utilizing CSS scroll-snapping for carousels.
- **Optimized API Usage**: Search inputs are debounced (500ms) to prevent TMDB API rate-limiting.
- **Intersection Observers**: Lazy-loads TV show stats (Seasons/Episodes count) only when the posters scroll into view to conserve bandwidth.
- **Dynamic Auto-Healing**: Automatically self-heals corrupted watch times or invalid configuration states in local storage.
- **Environment Variables**: Clean separation of API keys (TMDB, SubDL) using an external `env.js` configuration file.

## 🎹 Keyboard Shortcuts (Feature #6)
- **Space**: Play/Pause video playback
- **F**: Toggle fullscreen mode
- **M**: Mute/Unmute audio
- **Arrow Left/Right**: Seek backward/forward 10 seconds
- **Arrow Up/Down**: Increase/decrease volume
- **Escape**: Exit lights-out mode
- *Shortcuts disabled when typing in input fields*

## 🎨 Theme Customization (Feature #8)
- **4 Distinct Themes**:
  - Royal Gold (default) - Elegant gold & dark aesthetic
  - Modern Dark - Sleek contemporary dark with blue accents
  - Netflix Red - Bold streaming service style
  - Minimal Light - Clean, airy light interface
- **Theme Selector**: Visual theme picker in Profile page with live previews
- **Persistent Preference**: Selected theme saved to localStorage
- **Dynamic Loading**: Theme CSS loaded before React renders for instant application

## 🎯 Personalized Recommendations (Feature #11)
- **Genre Analysis**: Analyzes watch history to identify top 3 preferred genres
- **Smart Discovery**: Fetches TMDB recommendations based on favorite genres
- **Duplicate Prevention**: Excludes already-watched content from recommendations
- **"Because You Watched" Row**: Dedicated carousel on SelectionPage showing personalized picks
- **Fallback Logic**: Fills with popular items when insufficient watch history exists