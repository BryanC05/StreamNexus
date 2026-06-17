# 🎬 StreamNexus

A highly-stylized, React-based streaming content discovery and playback platform. Stream movies and TV shows from multiple embed providers, synchronize your watch history and favorites to the cloud, and enjoy an interface styled after the acclaimed fantasy RPG **Metaphor: ReFantazio**!

---

## 🎨 Metaphor: ReFantazio Thematic UI
StreamNexus features a stunning RPG-inspired interface that brings the aesthetics of Atlus's *Metaphor: ReFantazio* directly to your browser:
- **Royal Canvas Theme:** A high-contrast color scheme utilizing deep ink navy (`#080a0e`), royal gold, and brilliant crimson red, layered over paper/grain watercolor canvas textures.
- **Dynamic Tarot/Archetype Posters:** Catalog posters are styled like Tarot scrolls with double gold borders, wax seals, and kinetic hover flips that tilt off-center.
- **Royal Virtues Dashboard:** The profile page reimagines user statistics as virtues from the game:
  - **Eloquence:** Forged by building bonds with your favorite titles.
  - **Wisdom:** Acquired by watching and logging chronicle history.
  - **Imagination:** Cultivated through hours spent traveling and watching stories.
- **Authentic Typographical Pairings:** Uses high-contrast serifs (`Cinzel` & `Spectral`) for royal story titles, combined with compressed sans-serif (`Oswald`) for bold action prompts.
- **Covenant Oath Gate:** The login and sign-up interface is presented as a royal enlistment parchment.

---

## 🎬 Core Features

- **Dual Catalogs** — Browse and toggle between Movies and TV Shows seamlessly.
- **TMDB Integration** — Automatically fetches popular and searched titles from The Movie Database (TMDB), with genre-based sub-rows.
- **Multi-Server Streaming** — Toggle between reliable servers (VidSrc.me, VidSrc.in, VidSrc.pm, Vidking) or use the **Custom HTML5 Player** for local files.
- **Saga Chapters Selector** — TV Show layout displaying seasons (Acts) and episode list cards with titles, descriptions, and thumbnails.
- **Auto-Fetch Subtitles** — One-click download of English subtitles utilizing the SubDL API, with client-side zip extraction and VTT shifting.
- **Smart Progress Tracking** — Automatically tracks playback progress:
  - Tracks precise playback timestamps on native video.
  - Features an estimated local interval tracking loop for third-party cross-origin iframes.
- **Secure Cloud Sync** — Sync your favorites list, watch history, and progress to a local Express database.

---

## 🚀 Getting Started

### 1. Clone & Setup
```bash
git clone https://github.com/yourusername/StreamNexus.git
cd StreamNexus
npm install
```

### 2. Configure API Keys
Copy the example environment file:
```bash
cp env.example.js env.js
```
Edit `env.js` and insert your API credentials:
* **TMDB API Key** (Get one at [TheMovieDB](https://www.themoviedb.org/settings/api))
* **SubDL API Key** (Get one at [SubDL](https://subdl.com/))

### 3. Running the App
Start the Vite dev server and the Express local auth database:
```bash
# Runs concurrently: starts Vite on port 5173 and express server on port 5001
npm run dev:all
```

---

## 📦 Build for Production
To bundle the frontend application assets for deployment:
```bash
npm run build
npm run preview
```

---

## 🛠️ Tech Stack
- **Frontend:** React 18, React Router 6, Vite, Vanilla CSS
- **Backend:** Node.js, Express, JWT, Bcrypt
- **APIs:** TMDB (Metadata & Images), SubDL (Subtitles)
- **Database:** Local JSON File Storage (`database.json`)

*See `FEATURES.md` for a comprehensive look at the platform's features.*
