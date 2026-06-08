// ==========================================
// CONFIGURATION & CONSTANTS
// ==========================================
const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p";
const TMDB_CACHE_KEY = "freevid_tmdb_catalog_v2";
const DEFAULT_TMDB_KEY = (typeof window !== 'undefined' && window.ENV?.TMDB_API_KEY) || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_TMDB_API_KEY) || "";
const FAVORITES_KEY = "freevid_favorites_v1";
const HISTORY_KEY = "freevid_history_v1";
const PROGRESS_KEY = "freevid_progress_v1";
const WATCH_TIME_KEY = "freevid_watchtime_v1";
const SERVER_KEY = "freevid_server_v1";
const TMDB_PAGE_COUNT = 25;
const TMDB_BATCH_SIZE = 5;

// ==========================================
// DEFAULT CATALOG DATA
// ==========================================
const catalog = {
  movie: [
    {
      id: "1078605",
      title: "Weapons",
      year: "2025",
      poster: "https://image.tmdb.org/t/p/w342/rysFRTQL7D7YuPH9YHrNt3q35FJ.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/tCQfubckzzcuCbsGugkpLhfjS5z.jpg",
    },
    {
      id: "299534",
      title: "Avengers: Endgame",
      year: "2019",
      poster: "https://image.tmdb.org/t/p/w342/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg",
    },
    {
      id: "550",
      title: "Fight Club",
      year: "1999",
      poster: "https://image.tmdb.org/t/p/w342/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/hZkgoQYus5vegHoetLkCJzb17zJ.jpg",
    },
    {
      id: "603",
      title: "The Matrix",
      year: "1999",
      poster: "https://image.tmdb.org/t/p/w342/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/fNG7i7RqMErkcqhohV2a6cV1Ehy.jpg",
    },
    {
      id: "27205",
      title: "Inception",
      year: "2010",
      poster: "https://image.tmdb.org/t/p/w342/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
    },
    {
      id: "157336",
      title: "Interstellar",
      year: "2014",
      poster: "https://image.tmdb.org/t/p/w342/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/pbrkL804c8yAv3zBZR4QPEafpAR.jpg",
    },
    {
      id: "155",
      title: "The Dark Knight",
      year: "2008",
      poster: "https://image.tmdb.org/t/p/w342/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/hkBaDkMWbLaf8B1lsWsKX7Ew3Xq.jpg",
    },
    {
      id: "475557",
      title: "Joker",
      year: "2019",
      poster: "https://image.tmdb.org/t/p/w342/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/n6bUvigpRFqSwmPp1m2YADdbRBc.jpg",
    },
    {
      id: "438631",
      title: "Dune",
      year: "2021",
      poster: "https://image.tmdb.org/t/p/w342/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/iopYFB1b6Bh7FWZh3onQhph1sih.jpg",
    },
    {
      id: "19995",
      title: "Avatar",
      year: "2009",
      poster: "https://image.tmdb.org/t/p/w342/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/vL5LR6WdxWPjLPFRLe133jXWsh5.jpg",
    },
    {
      id: "597",
      title: "Titanic",
      year: "1997",
      poster: "https://image.tmdb.org/t/p/w342/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/rzdPqYx7Um4FUZeD8wpXqjAUcEm.jpg",
    },
    {
      id: "680",
      title: "Pulp Fiction",
      year: "1994",
      poster: "https://image.tmdb.org/t/p/w342/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg",
    },
    {
      id: "13",
      title: "Forrest Gump",
      year: "1994",
      poster: "https://image.tmdb.org/t/p/w342/arw2vcBveWOVZr6pxd9XTd1TdQaR.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/3h1JZGDhZ8nzxdgvkxha0qBqi05.jpg",
    },
    {
      id: "278",
      title: "The Shawshank Redemption",
      year: "1994",
      poster: "https://image.tmdb.org/t/p/w342/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg",
    },
    {
      id: "238",
      title: "The Godfather",
      year: "1972",
      poster: "https://image.tmdb.org/t/p/w342/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/tmU7GeKVybMWFButWEGl2M4GeiP.jpg",
    },
    {
      id: "120",
      title: "The Lord of the Rings: The Fellowship of the Ring",
      year: "2001",
      poster: "https://image.tmdb.org/t/p/w342/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/x2RS3uTcsJJ9IfjNPcgDmukoEcQ.jpg",
    },
    {
      id: "634649",
      title: "Spider-Man: No Way Home",
      year: "2021",
      poster: "https://image.tmdb.org/t/p/w342/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/14QbnygCuTO0vl7CAFmPf1fgZfV.jpg",
    },
    {
      id: "346698",
      title: "Barbie",
      year: "2023",
      poster: "https://image.tmdb.org/t/p/w342/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/ctMserH8g2SeOAnCw5gFjdQF8mo.jpg",
    },
    {
      id: "872585",
      title: "Oppenheimer",
      year: "2023",
      poster: "https://image.tmdb.org/t/p/w342/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
    },
    {
      id: "533535",
      title: "Deadpool & Wolverine",
      year: "2024",
      poster: "https://image.tmdb.org/t/p/w342/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/yDHYTfA3R0jFYba16jBB1ef8oIt.jpg",
    },
    {
      id: "1022789",
      title: "Inside Out 2",
      year: "2024",
      poster: "https://image.tmdb.org/t/p/w342/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/stKGOm8UyhuLPR9sZLjs5AkmncA.jpg",
    },
    {
      id: "414906",
      title: "The Batman",
      year: "2022",
      poster: "https://image.tmdb.org/t/p/w342/74xTEgt7R36Fpooo50r9T25onhq.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg",
    },
    {
      id: "76341",
      title: "Mad Max: Fury Road",
      year: "2015",
      poster: "https://image.tmdb.org/t/p/w342/hA2ple9q4qnwxp3hKVNhroipsir.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/phszHPFVhPHhMZgo0fWTKBDQsJA.jpg",
    },
    {
      id: "324552",
      title: "John Wick: Chapter 2",
      year: "2017",
      poster: "https://image.tmdb.org/t/p/w342/hXWBc0ioZP3cN4zCu6SN3YHXZVO.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/r17jFHAemzcWPPtoO0UxjIX0xas.jpg",
    },
  ],
  tv: [
    {
      id: "119051",
      title: "Wednesday",
      year: "2022",
      season: 1,
      episode: 8,
      poster: "https://image.tmdb.org/t/p/w342/9PFonBhy4cQy7Jz20NpMygczOkv.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/iHSwvRVsRyxpX7FE7GbviaDvgGZ.jpg",
    },
    {
      id: "1399",
      title: "Game of Thrones",
      year: "2011",
      season: 1,
      episode: 1,
      poster: "https://image.tmdb.org/t/p/w342/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/2OMB0ynKlyIenMJWI2Dy9IWT4c.jpg",
    },
    {
      id: "66732",
      title: "Stranger Things",
      year: "2016",
      season: 1,
      episode: 1,
      poster: "https://image.tmdb.org/t/p/w342/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
    },
    {
      id: "60625",
      title: "Rick and Morty",
      year: "2013",
      season: 1,
      episode: 1,
      poster: "https://image.tmdb.org/t/p/w342/cvhNj9eoRBe5SxjCbQTkh05UP5K.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/rBF8wVQN8hTWHspVZBlI3h7HZJ.jpg",
    },
    {
      id: "1396",
      title: "Breaking Bad",
      year: "2008",
      season: 1,
      episode: 1,
      poster: "https://image.tmdb.org/t/p/w342/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
    },
    {
      id: "76479",
      title: "The Boys",
      year: "2019",
      season: 1,
      episode: 1,
      poster: "https://image.tmdb.org/t/p/w342/stTEycfG9928HYGEISBFaG1ngjM.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/mGVrXeIjyecj6TKmwPVpHlscEmw.jpg",
    },
    {
      id: "100088",
      title: "The Last of Us",
      year: "2023",
      season: 1,
      episode: 1,
      poster: "https://image.tmdb.org/t/p/w342/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg",
    },
    {
      id: "94997",
      title: "House of the Dragon",
      year: "2022",
      season: 1,
      episode: 1,
      poster: "https://image.tmdb.org/t/p/w342/z2yahl2uefxDCl0nogcRBstwruJ.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/etj8E2o0Bud0HkONVQPjyCkIvpv.jpg",
    },
    {
      id: "82856",
      title: "The Mandalorian",
      year: "2019",
      season: 1,
      episode: 1,
      poster: "https://image.tmdb.org/t/p/w342/eU1i6eHXlzMOlEq0ku1Rzq7Y4wA.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/9ijMGlJKqcslswWUzTEwScm82Gs.jpg",
    },
    {
      id: "84958",
      title: "Loki",
      year: "2021",
      season: 1,
      episode: 1,
      poster: "https://image.tmdb.org/t/p/w342/voHUmluYmKyleFkTu3lOXQG702u.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/Afp8OhiO0Ajb3NPoCBvfu2pqaeO.jpg",
    },
    {
      id: "71912",
      title: "The Witcher",
      year: "2019",
      season: 1,
      episode: 1,
      poster: "https://image.tmdb.org/t/p/w342/cZ0d3rtvXPVvuiX22sP79K3Hmjz.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/foGkPxpw9h8zln81j63mix5B7m8.jpg",
    },
    {
      id: "1402",
      title: "The Walking Dead",
      year: "2010",
      season: 1,
      episode: 1,
      poster: "https://image.tmdb.org/t/p/w342/xf9wuDcqlUPWABZNeDKPbZUjWx0.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/wXXaPMgrv96NkH8KD1TMdS2d7iq.jpg",
    },
    {
      id: "60059",
      title: "Better Call Saul",
      year: "2015",
      season: 1,
      episode: 1,
      poster: "https://image.tmdb.org/t/p/w342/fC2HDm5t0kHl7mTm7jxMR31b7by.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/84XPpjGvxNyExjSuLQe0SzioErt.jpg",
    },
    {
      id: "2316",
      title: "The Office",
      year: "2005",
      season: 1,
      episode: 1,
      poster: "https://image.tmdb.org/t/p/w342/qWnJzyZhyy74gjpSjIXWmuk0ifX.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/vNpuAxGTl9HsUbHqam3E9CzqCvX.jpg",
    },
    {
      id: "1668",
      title: "Friends",
      year: "1994",
      season: 1,
      episode: 1,
      poster: "https://image.tmdb.org/t/p/w342/f496cm9enuEsZkSPzCwnTESEK5s.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/l0qVZIpXtIo7km9u5Yqh0nKPOr5.jpg",
    },
    {
      id: "456",
      title: "The Simpsons",
      year: "1989",
      season: 1,
      episode: 1,
      poster: "https://image.tmdb.org/t/p/w342/vHqeLzYl3dEAutojCO26g0LIkom.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/a0iM3Fus9vO4V7r4LpiQQ5mnOxJ.jpg",
    },
    {
      id: "42009",
      title: "Black Mirror",
      year: "2011",
      season: 1,
      episode: 1,
      poster: "https://image.tmdb.org/t/p/w342/7PRddO3z7mcPi21nZTCMGShAyy1.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/5UaYsGZOFhjFDwQh6GuLjjA1WlF.jpg",
    },
    {
      id: "60574",
      title: "Peaky Blinders",
      year: "2013",
      season: 1,
      episode: 1,
      poster: "https://image.tmdb.org/t/p/w342/vUUqzWa2LnHIVqkaKVlVGkVcZIW.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/wiE9doxiLwq3WCGamDIOb2PqBqc.jpg",
    },
    {
      id: "19885",
      title: "Sherlock",
      year: "2010",
      season: 1,
      episode: 1,
      poster: "https://image.tmdb.org/t/p/w342/7WTsnHkbA0FaG6R9twfFde0I9hl.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/9S6nYIsKPQZV5YLGjIuNqPUgB70.jpg",
    },
    {
      id: "136315",
      title: "The Bear",
      year: "2022",
      season: 1,
      episode: 1,
      poster: "https://image.tmdb.org/t/p/w342/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/7QSM3AsgWXctWBm7OFov9dGdZgt.jpg",
    },
    {
      id: "93405",
      title: "Squid Game",
      year: "2021",
      season: 1,
      episode: 1,
      poster: "https://image.tmdb.org/t/p/w342/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/oaGvjB0DvdhXhOAuADfHb261ZHa.jpg",
    },
    {
      id: "94605",
      title: "Arcane",
      year: "2021",
      season: 1,
      episode: 1,
      poster: "https://image.tmdb.org/t/p/w342/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/rndAzE3O3yOSbagXjG1tR5Uwh9x.jpg",
    },
    {
      id: "37854",
      title: "One Piece",
      year: "1999",
      season: 1,
      episode: 1,
      poster: "https://image.tmdb.org/t/p/w342/cMD9Ygz11zjJzAovURpO75Qg7rT.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/2rmK7mnchw9Xr3XdiTFSxTTLXqv.jpg",
    },
    {
      id: "63247",
      title: "Westworld",
      year: "2016",
      season: 1,
      episode: 1,
      poster: "https://image.tmdb.org/t/p/w342/8MfgyFHf7XEboZJPZXCIDqqiz6e.jpg",
      backdrop: "https://image.tmdb.org/t/p/w1280/yGNnjoIGOdQy3douq60tULY8teK.jpg",
    },
  ],
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function cleanNumber(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// ==========================================
// STATE & STORAGE MANAGEMENT
// ==========================================
let runtimeCatalogCache = null;

function getCachedCatalog() {
  if (runtimeCatalogCache) return runtimeCatalogCache;

  try {
    const cached = JSON.parse(localStorage.getItem(TMDB_CACHE_KEY));
    if (cached?.movie?.length && cached?.tv?.length) {
      runtimeCatalogCache = cached;
      return cached;
    }
  } catch {
    return null;
  }

  return null;
}

function getActiveCatalog() {
  return getCachedCatalog() || catalog;
}

function findTitle(mediaType, id) {
  return getActiveCatalog()[mediaType]?.find((item) => item.id === id)
    || catalog[mediaType]?.find((item) => item.id === id);
}

function readStore(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function writeStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getContentKey(entry) {
  if (entry.mediaType === "tv") {
    return `tv:${entry.id}:s${entry.season || 1}:e${entry.episode || 1}`;
  }

  return `movie:${entry.id}`;
}

function getTitleFromEntry(entry) {
  const found = findTitle(entry.mediaType, String(entry.id));
  return {
    id: String(entry.id),
    mediaType: entry.mediaType,
    title: entry.title || found?.title || "Untitled",
    year: entry.year || found?.year || "",
    poster: entry.poster || found?.poster || "",
    backdrop: entry.backdrop || found?.backdrop || "",
    season: Number(entry.season || found?.season || 1),
    episode: Number(entry.episode || found?.episode || 1),
    totalSeasons: Number(entry.totalSeasons || found?.totalSeasons || 0),
    totalEpisodes: Number(entry.totalEpisodes || found?.totalEpisodes || 0),
    genreIds: entry.genreIds || found?.genreIds || [],
  };
}

function getFavorites() {
  return readStore(FAVORITES_KEY, []);
}

function getHistory() {
  return readStore(HISTORY_KEY, []);
}

function getProgressStore() {
  const store = readStore(PROGRESS_KEY, {});
  let cleaned = false;
  Object.keys(store).forEach((key) => {
    if (store[key].currentTime > 360000) {
      delete store[key];
      cleaned = true;
    }
  });
  if (cleaned) writeStore(PROGRESS_KEY, store);
  return store;
}

function getGlobalWatchTime() {
  let watchTime = readStore(WATCH_TIME_KEY, null);
  // Migration & Auto-Healing: Estimates initial watch time using previous saves.
  // It also recovers from corrupted huge values (e.g., if an epoch timestamp was mistakenly tracked).
  if (watchTime === null || watchTime > 31536000) {
    watchTime = Object.values(getProgressStore()).reduce((sum, item) => sum + Number(item.currentTime || 0), 0);
    writeStore(WATCH_TIME_KEY, watchTime);
  }
  return Number(watchTime);
}

function addGlobalWatchTime(seconds) {
  writeStore(WATCH_TIME_KEY, getGlobalWatchTime() + seconds);
}

function isFavorite(entry) {
  const key = getContentKey(entry);
  return getFavorites().some((item) => getContentKey(item) === key);
}

function toggleFavorite(entry) {
  const normalized = getTitleFromEntry(entry);
  const key = getContentKey(normalized);
  const favorites = getFavorites();
  const exists = favorites.some((item) => getContentKey(item) === key);
  const next = exists
    ? favorites.filter((item) => getContentKey(item) !== key)
    : [{ ...normalized, savedAt: Date.now() }, ...favorites];

  writeStore(FAVORITES_KEY, next);
  if (isLoggedIn()) apiSyncPush().catch(() => {});
  return !exists;
}

function saveHistory(entry) {
  const normalized = getTitleFromEntry(entry);
  const key = getContentKey(normalized);
  const next = [
    { ...normalized, watchedAt: Date.now() },
    ...getHistory().filter((item) => getContentKey(item) !== key),
  ].slice(0, 80);

  writeStore(HISTORY_KEY, next);
}

function saveProgress(entry, playerData) {
  const normalized = getTitleFromEntry(entry);
  const key = getContentKey(normalized);
  let currentTime = Number(playerData.currentTime !== undefined ? playerData.currentTime : playerData.timestamp || 0);
  const duration = Number(playerData.duration || 0);
  let progress = Number(playerData.progress || (duration ? (currentTime / duration) * 100 : 0));

  // Sanity check: no video is over 100 hours (360,000s). Ignores epoch timestamps.
  if (!Number.isFinite(currentTime) || currentTime <= 0 || currentTime > 360000) {
    return;
  }

  if (!Number.isFinite(progress) || isNaN(progress)) {
    progress = 0;
  }

  const store = getProgressStore();
  const previousEntry = store[key];
  const previousTime = previousEntry ? Number(previousEntry.currentTime || 0) : 0;
  const timeDelta = currentTime - previousTime;

  // Accumulate actual watch time for small forward progressions (ignores scrubbing/seeking)
  if (timeDelta > 0 && timeDelta <= 30) {
    addGlobalWatchTime(timeDelta);
  }

  store[key] = {
    ...normalized,
    currentTime,
    duration,
    progress,
    updatedAt: Date.now(),
  };
  writeStore(PROGRESS_KEY, store);
  saveHistory(normalized);
  if (isLoggedIn()) throttledSyncPush();
}

function getSavedProgress(entry) {
  return getProgressStore()[getContentKey(entry)];
}

// ==========================================
// FORMATTING & NORMALIZATION
// ==========================================
function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function formatDate(timestamp) {
  if (!timestamp) {
    return "";
  }

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTvTotals(item) {
  const seasons = Number(item.totalSeasons || 0);
  const episodes = Number(item.totalEpisodes || 0);

  if (seasons && episodes) {
    return `${seasons} season${seasons === 1 ? "" : "s"} | ${episodes} episode${episodes === 1 ? "" : "s"}`;
  }

  if (seasons) {
    return `${seasons} season${seasons === 1 ? "" : "s"}`;
  }

  if (episodes) {
    return `${episodes} episode${episodes === 1 ? "" : "s"}`;
  }

  return "TV Series";
}

function getYear(value) {
  return value ? value.slice(0, 4) : "";
}

function getImageUrl(path, size, fallbackPath = "") {
  if (path) {
    return `${TMDB_IMAGE_URL}/${size}${path}`;
  }

  return fallbackPath;
}

function normalizeMovie(item) {
  return {
    id: String(item.id),
    title: item.title || item.original_title || "Untitled Movie",
    year: getYear(item.release_date),
    poster: getImageUrl(item.poster_path, "w342"),
    backdrop: getImageUrl(item.backdrop_path, "w1280"),
    genreIds: item.genre_ids || [],
  };
}

function normalizeTv(item) {
  return {
    id: String(item.id),
    title: item.name || item.original_name || "Untitled TV Show",
    year: getYear(item.first_air_date),
    season: 1,
    episode: 1,
    totalSeasons: Number(item.number_of_seasons || 0),
    totalEpisodes: Number(item.number_of_episodes || 0),
    poster: getImageUrl(item.poster_path, "w342"),
    backdrop: getImageUrl(item.backdrop_path, "w1280"),
    genreIds: item.genre_ids || [],
  };
}

// ==========================================
// TMDB API INTEGRATION
// ==========================================
const tvStatsCache = {};

async function fetchTvStats(tmdbId, credential) {
  if (tvStatsCache[tmdbId]) return tvStatsCache[tmdbId];
  
  try {
    const url = new URL(`${TMDB_API_URL}/tv/${tmdbId}`);
    url.searchParams.set("language", "en-US");
    
    if (!credential.startsWith("ey")) {
      url.searchParams.set("api_key", credential);
    }
    
    const response = await fetch(url, { headers: getTmdbHeaders(credential) });
    if (response.ok) {
      const data = await response.json();
      const sCount = data.number_of_seasons || 0;
      const eCount = data.number_of_episodes || 0;
      
      if (sCount && eCount) {
        const result = `${sCount} Season${sCount === 1 ? "" : "s"} | ${eCount} Episode${eCount === 1 ? "" : "s"}`;
        tvStatsCache[tmdbId] = result;
        return result;
      }
    }
  } catch (err) {
    // Ignore background fetch errors
  }
  return null;
}

function getTmdbHeaders(credential) {
  if (credential.startsWith("ey")) {
    return {
      Authorization: `Bearer ${credential}`,
      "Content-Type": "application/json;charset=utf-8",
    };
  }

  return {};
}

function getTmdbUrl(path, page, credential) {
  const url = new URL(`${TMDB_API_URL}${path}`);
  url.searchParams.set("language", "en-US");
  url.searchParams.set("page", String(page));

  if (!credential.startsWith("ey")) {
    url.searchParams.set("api_key", credential);
  }

  return url;
}

async function fetchTmdbPage(path, page, credential) {
  const response = await fetch(getTmdbUrl(path, page, credential), {
    headers: getTmdbHeaders(credential),
  });

  if (!response.ok) {
    throw new Error(`TMDB request failed with ${response.status}`);
  }

  return response.json();
}

async function fetchTmdbPages(path, credential) {
  const pages = Array.from({ length: TMDB_PAGE_COUNT }, (_, index) => index + 1);
  const responses = [];

  for (let index = 0; index < pages.length; index += TMDB_BATCH_SIZE) {
    const batch = pages.slice(index, index + TMDB_BATCH_SIZE);
    const batchResponses = await Promise.all(
      batch.map((page) => fetchTmdbPage(path, page, credential)),
    );
    responses.push(...batchResponses);
  }

  return responses;
}

async function searchTmdb(query, mediaType, credential) {
  if (!query) return [];
  const url = getTmdbUrl(`/search/${mediaType}`, 1, credential);
  url.searchParams.set("query", query);
  const response = await fetch(url, { headers: getTmdbHeaders(credential) });
  if (!response.ok) throw new Error("Search failed");
  const data = await response.json();
  return (data.results || []).filter((item) => item.poster_path).map(mediaType === "tv" ? normalizeTv : normalizeMovie);
}

async function fetchPopularCatalog(credential) {
  const movieResponses = await fetchTmdbPages("/movie/popular", credential);
  const tvResponses = await fetchTmdbPages("/tv/popular", credential);

  const movie = movieResponses
    .flatMap((page) => page.results || [])
    .filter((item) => item.poster_path)
    .map(normalizeMovie);

  const tv = tvResponses
    .flatMap((page) => page.results || [])
    .filter((item) => item.poster_path)
    .map(normalizeTv);

  return {
    movie,
    tv,
    loadedAt: new Date().toISOString(),
  };
}

async function autoFetchSubtitles(tmdbId, mediaType, season, episode) {
  const apiKey = (typeof window !== 'undefined' && window.ENV?.SUBDL_API_KEY) || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUBDL_API_KEY) || "";
  if (!apiKey) throw new Error("SubDL API key not configured in env.js");

  const url = new URL("https://api.subdl.com/api/v1/subtitles");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("tmdb_id", tmdbId);
  url.searchParams.set("type", mediaType);
  if (mediaType === "tv") {
    url.searchParams.set("season_number", season);
    url.searchParams.set("episode_number", episode);
  }
  url.searchParams.set("languages", "EN");

  const targetApiUrls = [
    url.toString(),
    `https://corsproxy.io/?${encodeURIComponent(url.toString())}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url.toString())}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url.toString())}`
  ];

  let data = null;
  for (const targetUrl of targetApiUrls) {
    try {
      const res = await fetch(targetUrl);
      if (!res.ok) continue;
      const json = await res.json();
      // Basic validation to ensure the proxy didn't return an HTML error page
      if (json && (json.subtitles || json.results || json.status !== undefined)) {
        data = json;
        break;
      }
    } catch (e) {
      continue; // Suppress "Failed to fetch" network errors and try the next proxy
    }
  }

  if (!data) {
    throw new Error("Failed to reach the SubDL API (Network or CORS blocked). Please use Manual Search.");
  }

  const subs = data.subtitles || data.results || [];
  if (!data.status || subs.length === 0) throw new Error("No English subtitles found.");

  // Intelligently prioritize WEB-DL / WEBRip releases since those match streaming sites
  const preferredZipUrls = [];
  const otherZipUrls = [];
  
  for (const sub of subs) {
    const subStr = JSON.stringify(sub);
    const isWebRip = subStr.toLowerCase().includes("web") || subStr.toLowerCase().includes("nf") || subStr.toLowerCase().includes("amzn") || subStr.toLowerCase().includes("hulu");
    
    const regex = /"url"\s*:\s*"([^"]+\.zip)"/gi;
    let match;
    let found = false;
    while ((match = regex.exec(subStr)) !== null) {
      const url = match[1].replace(/\\/g, "");
      if (isWebRip) {
        if (!preferredZipUrls.includes(url)) preferredZipUrls.push(url);
      } else {
        if (!otherZipUrls.includes(url)) otherZipUrls.push(url);
      }
      found = true;
    }
    
    if (!found) {
      const fallbackRegex = /"([^"]+\.zip)"/gi;
      while ((match = fallbackRegex.exec(subStr)) !== null) {
        const url = match[1].replace(/\\/g, "");
        if (isWebRip) {
          if (!preferredZipUrls.includes(url)) preferredZipUrls.push(url);
        } else {
          if (!otherZipUrls.includes(url)) otherZipUrls.push(url);
        }
      }
    }
  }

  const zipUrls = [...preferredZipUrls, ...otherZipUrls];

  if (zipUrls.length === 0) {
    throw new Error("Could not parse subtitle download link from API response.");
  }

  let zipBuffer = null;

  // Try up to 3 different subtitle URLs in case some are broken/blocked
  for (const extractedUrl of zipUrls.slice(0, 3)) {
    if (zipBuffer) break;

    const path = extractedUrl.startsWith('/') ? extractedUrl : `/${extractedUrl}`;
    const targetUrls = extractedUrl.startsWith('http') 
      ? [
          extractedUrl,
          `https://corsproxy.io/?${encodeURIComponent(extractedUrl)}`,
          `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(extractedUrl)}`,
          `https://api.allorigins.win/raw?url=${encodeURIComponent(extractedUrl)}`
        ]
      : [
          `https://dl.subdl.com${path}`,
          `https://corsproxy.io/?${encodeURIComponent(`https://dl.subdl.com${path}`)}`,
          `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`https://dl.subdl.com${path}`)}`,
          `https://subdl.com${path}`,
          `https://corsproxy.io/?${encodeURIComponent(`https://subdl.com${path}`)}`,
          `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://dl.subdl.com${path}`)}`
        ];

    for (const targetUrl of targetUrls) {
      try {
        const zipRes = await fetch(targetUrl);
        if (!zipRes.ok) continue;
        
        const buffer = await zipRes.arrayBuffer();
        const uint8 = new Uint8Array(buffer);
        // Validate ZIP magic number (PK) to ensure it's not an HTML/JSON error page
        if (uint8.length > 4 && uint8[0] === 0x50 && uint8[1] === 0x4B) {
          zipBuffer = buffer;
          break;
        }
      } catch (e) {
        continue;
      }
    }
  }

  if (!zipBuffer) {
    throw new Error("Subtitle archive was blocked or corrupted by the provider. Please use Manual Search.");
  }

  // Dynamically imports the fflate zip library to unpack the folder purely in memory
  const fflate = await import('https://cdn.jsdelivr.net/npm/fflate@0.8.2/esm/browser.js');
  const unzipped = fflate.unzipSync(new Uint8Array(zipBuffer));

  const allValidFiles = Object.keys(unzipped).filter(k => 
    !k.includes('__MACOSX') && 
    (k.toLowerCase().endsWith('.srt') || k.toLowerCase().endsWith('.vtt'))
  );
  
  if (allValidFiles.length === 0) throw new Error("No valid subtitle file found inside the archive.");

  let subFilename = allValidFiles[0];

  if (mediaType === "tv") {
    const s = String(season).padStart(2, '0');
    const e = String(episode).padStart(2, '0');
    
    const exactMatch = allValidFiles.find(f => {
      const lower = f.toLowerCase();
      return lower.includes(`s${s}e${e}`) || 
             lower.includes(`s${season}e${episode}`) || 
             lower.includes(`${season}x${e}`) ||
             lower.includes(`${season}x${episode}`);
    });
    
    if (exactMatch) {
      subFilename = exactMatch;
    } else {
      const partialMatch = allValidFiles.find(f => {
        const lower = f.toLowerCase();
        return lower.includes(`e${e}`) || lower.includes(`-${e}`) || lower.includes(`episode ${e}`) || lower.includes(`ep${e}`);
      });
      if (partialMatch) subFilename = partialMatch;
    }
  }

  const subData = unzipped[subFilename];
  let text = new TextDecoder("utf-8").decode(subData);

  // Normalize line endings to prevent parser issues on different operating systems
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Remove sequential SRT line numbers (digits on a single line immediately preceding a timestamp)
  // Replacing with \n\n guarantees we don't accidentally swallow the blank line separating cues.
  text = text.replace(/(^|\n)\s*\d+\s*\n(?=[ \t]*\d{2,}:\d{2}:\d{2})/g, '\n\n');

  // Enforce a strict blank line before every timestamp to prevent WebVTT cues from merging and displaying all at once
  text = text.replace(/([^\n])\n(?=[ \t]*\d{2,}:\d{2}:\d{2})/g, '$1\n\n');

  // Strip HTML styling tags which often cause web players to merge words together
  text = text.replace(/<\/?(?:i|b|u|font|color)[^>]*>/gi, '');

  const isVtt = text.startsWith("WEBVTT");

  // Add a trailing space to dialogue lines. This prevents words from combining 
  // when custom video players (like Vidking) blindly strip newlines to render subtitles.
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() !== '' && !lines[i].includes('-->') && !lines[i].startsWith('WEBVTT')) {
      lines[i] = lines[i] + ' ';
    }
  }
  text = lines.join('\n');

  if (!isVtt) {
    text = "WEBVTT\n\n" + text.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
  }

  return text;
}

async function uploadSubtitleToTempHost(text, filename) {
  const file = new File([text], filename, { type: "text/vtt" });

  // Primary: Litterbox via CORS Proxy (keeps file for 12 hours)
  try {
    const formData = new FormData();
    formData.append("reqtype", "fileupload");
    formData.append("time", "12h");
    formData.append("fileToUpload", file);

    const res = await fetch(`https://corsproxy.io/?${encodeURIComponent("https://litterbox.catbox.moe/user/api.php")}`, {
      method: "POST",
      body: formData
    });
    if (res.ok) {
      const url = await res.text();
      if (url.startsWith("http")) return url.trim();
    }
  } catch (e) {
    console.error("Litterbox upload via proxy failed:", e);
  }

  // Secondary: tmpfiles.org directly (has native CORS, keeps file for 60 minutes)
  try {
    const formData = new FormData();
    formData.append("file", file);
    
    const res = await fetch("https://tmpfiles.org/api/v1/upload", {
      method: "POST",
      body: formData
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.data?.url) {
        // tmpfiles returns a viewer link. We must inject /dl/ to get the raw file download link.
        return json.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
      }
    }
  } catch (e) {
    console.error("tmpfiles upload failed:", e);
  }

  throw new Error("All temporary hosting services failed or were blocked by CORS.");
}

// ==========================================
// UI: SELECTION PAGE
// ==========================================
function buildPlayerHref(item, mediaType) {
  const params = new URLSearchParams({
    type: mediaType,
    id: item.id,
    title: item.title,
  });

  if (mediaType === "tv") {
    params.set("season", String(item.season || 1));
    params.set("episode", String(item.episode || 1));
  }

  const saved = getSavedProgress({ ...item, mediaType });
  if (saved?.currentTime && (!saved.progress || saved.progress < 95)) {
    params.set("progress", String(Math.floor(saved.currentTime)));
  }

  return `player.html?${params.toString()}`;
}

function initSelectionPage() {
  const catalogGrid = document.querySelector("#catalogGrid");
  const featuredCard = document.querySelector("#featuredCard");
  const catalogTitle = document.querySelector("#catalogTitle");
  const catalogTypeInputs = document.querySelectorAll("input[name='catalogType']");
  const catalogStatus = document.querySelector("#catalogStatus");

  if (!catalogGrid || !featuredCard) {
    return;
  }

  const tvStatsObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(async (entry) => {
      if (entry.isIntersecting) {
        const card = entry.target;
        const tmdbId = card.dataset.tvId;
        const year = card.dataset.year;
        const metaSpan = card.querySelector('.dynamic-tv-meta');
        
        if (tmdbId && metaSpan && DEFAULT_TMDB_KEY) {
          const stats = await fetchTvStats(tmdbId, DEFAULT_TMDB_KEY);
          if (stats) {
            metaSpan.innerHTML = `${stats} &middot; ${year}`;
          }
        }
        observer.unobserve(card); // Unobserve so it only fetches once
      }
    });
  }, { rootMargin: "300px" }); // Starts fetching right before the poster scrolls into view

  function getCatalogType() {
    return document.querySelector("input[name='catalogType']:checked").value;
  }

  function renderFeatured(item, mediaType) {
    const href = buildPlayerHref(item, mediaType);
    const year = item.year || "Unknown year";
    const meta = mediaType === "tv" ? formatTvTotals(item) : "Movie";
    featuredCard.style.backgroundImage = item.backdrop
      ? `linear-gradient(90deg, rgba(17, 19, 21, 0.92), rgba(17, 19, 21, 0.46)), url("${item.backdrop}")`
      : "linear-gradient(90deg, rgba(17, 19, 21, 0.92), rgba(17, 19, 21, 0.46))";
    featuredCard.innerHTML = `
      <div class="featured-content">
        <p class="eyebrow">Featured ${mediaType === "tv" ? "TV Show" : "Movie"}</p>
        <h2>${item.title}</h2>
        <p id="featuredMeta">${meta} &middot; ${year}</p>
        <a class="primary-link" href="${href}">Watch Now</a>
      </div>
    `;

    if (mediaType === "tv" && DEFAULT_TMDB_KEY) {
      fetchTvStats(item.id, DEFAULT_TMDB_KEY).then((stats) => {
        const metaEl = featuredCard.querySelector("#featuredMeta");
        if (stats && metaEl) {
          metaEl.innerHTML = `${stats} &middot; ${year}`;
        }
      });
    }
  }

  function renderCatalog() {
    const catalogType = getCatalogType();
    const activeCatalog = getActiveCatalog();
    const items = activeCatalog[catalogType];
    catalogTitle.textContent = catalogType === "tv" ? `TV Shows (${items.length})` : `Movies (${items.length})`;
    catalogGrid.innerHTML = "";
    renderFeatured(items[0], catalogType);

    items.forEach((item) => {
      const href = buildPlayerHref(item, catalogType);
      const year = item.year || "Unknown year";
      const meta = catalogType === "tv" ? formatTvTotals(item) : "Movie";
      const favoriteEntry = { ...item, mediaType: catalogType };
      const saved = isFavorite(favoriteEntry);
      const card = document.createElement("article");
      card.className = "poster-card";
      if (catalogType === "tv") {
        card.dataset.tvId = item.id;
        card.dataset.year = year;
      }
      card.innerHTML = `
        <span class="poster-media">
          <a class="poster-image-link" href="${href}">
            <img src="${item.poster}" alt="${item.title} poster" loading="lazy" onerror="this.onerror=null; this.removeAttribute('src');">
          </a>
          <button class="favorite-button${saved ? " is-active" : ""}" type="button" aria-pressed="${saved}" data-favorite-key="${getContentKey(favoriteEntry)}">
            ${saved ? "Saved" : "Favorite"}
          </button>
        </span>
        <a class="poster-link" href="${href}">
          <span class="poster-copy">
            <strong>${item.title}</strong>
            <span class="${catalogType === "tv" ? 'dynamic-tv-meta' : ''}">${meta} &middot; ${year}</span>
          </span>
        </a>
      `;
      card.querySelector(".favorite-button").addEventListener("click", () => {
        toggleFavorite(favoriteEntry);
        renderCatalog();
      });
      catalogGrid.append(card);
      if (catalogType === "tv") {
        tvStatsObserver.observe(card);
      }
    });
  }

  function updateStatus() {
    const cached = getCachedCatalog();
    if (!cached) {
      catalogStatus.textContent = `Using the built-in catalog: ${catalog.movie.length} movies and ${catalog.tv.length} TV shows. Add TMDB to load popular titles.`;
      return;
    }

    catalogStatus.textContent = `Loaded ${cached.movie.length} movies and ${cached.tv.length} TV shows from TMDB.`;
  }

  async function loadRemoteCatalog(credential) {
    const trimmed = credential.trim();

    if (!trimmed) {
      catalogStatus.textContent = "No TMDB API Key found. Using built-in catalog.";
      return;
    }

    catalogStatus.textContent = "Loading popular movies and TV shows from TMDB. This may take a moment...";
    const remoteCatalog = await fetchPopularCatalog(trimmed);
    runtimeCatalogCache = remoteCatalog;
    
    try {
      localStorage.setItem(TMDB_CACHE_KEY, JSON.stringify(remoteCatalog));
    } catch (err) {
      console.warn("Catalog too large to cache in localStorage. Operating from memory.");
    }

    updateStatus();
    renderCatalog();
  }

  catalogTypeInputs.forEach((input) => {
    input.addEventListener("change", renderCatalog);
  });

  updateStatus();
  renderCatalog();

  if (DEFAULT_TMDB_KEY && !getCachedCatalog()) {
    loadRemoteCatalog(DEFAULT_TMDB_KEY).catch((error) => {
      catalogStatus.textContent = error.message;
    });
  }
}

// ==========================================
// UI: PLAYER PAGE
// ==========================================
function getMediaType() {
  return document.querySelector("input[name='mediaType']:checked").value;
}

function setMediaType(mediaType) {
  const input = document.querySelector(`input[name='mediaType'][value='${mediaType}']`);

  if (input) {
    input.checked = true;
  }
}

function buildEmbedUrl() {
  const mediaType = getMediaType();
  const tmdbIdInput = document.querySelector("#tmdbId");
  const serverInput = document.querySelector("#serverProvider");
  const baseUrl = serverInput ? serverInput.value : "https://vidsrc.me/embed";
  const seasonInput = document.querySelector("#season");
  const episodeInput = document.querySelector("#episode");
  const colorInput = document.querySelector("#color");
  const progressInput = document.querySelector("#progress");
  const autoPlayInput = document.querySelector("#autoPlay");
  const subUrlInput = document.querySelector("#subUrl");
  const tmdbId = cleanNumber(tmdbIdInput.value, 1078605);
  const params = new URLSearchParams();
  const color = colorInput.value.replace("#", "");
  const progress = Number.parseInt(progressInput.value, 10);

  let path = `${baseUrl}/movie/${tmdbId}`;

  if (mediaType === "tv") {
    const season = cleanNumber(seasonInput.value, 1);
    const episode = cleanNumber(episodeInput.value, 1);
    path = `${baseUrl}/tv/${tmdbId}/${season}/${episode}`;
  }

  if (color) {
    params.set("color", color);
  }

  if (autoPlayInput.checked) {
    params.set("autoPlay", "true");
  }

  if (Number.isFinite(progress) && progress > 0) {
    params.set("progress", String(progress));
  }

  if (subUrlInput && subUrlInput.value) {
    params.set("sub_url", subUrlInput.value);
    params.set("sub_default", "true");
  }

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

function buildIframeCode(url) {
  return `<iframe
  src="${url}"
  width="100%"
  height="600"
  frameborder="0"
  allow="autoplay; fullscreen"
  allowfullscreen>
</iframe>`;
}

function initPlayerPage() {
  const form = document.querySelector("#embedForm");
  const playerFrame = document.querySelector("#playerFrame");

  if (!form || !playerFrame) {
    return;
  }

  const pageParams = new URLSearchParams(window.location.search);
  const mediaType = pageParams.get("type") === "tv" ? "tv" : "movie";
  const id = pageParams.get("id") || "1078605";
  const selectedTitle = findTitle(mediaType, id);
  const title = pageParams.get("title") || selectedTitle?.title || "Player";
  const eventLog = document.querySelector("#eventLog");
  const tvOptions = document.querySelectorAll(".tv-option");
  const embedUrlOutput = document.querySelector("#embedUrl");
  const iframeCodeOutput = document.querySelector("#iframeCode");
  const playerTitle = document.querySelector("#playerTitle");
  const playerMeta = document.querySelector("#playerMeta");
  const serverProviderInput = document.querySelector("#serverProvider");
  const tmdbIdInput = document.querySelector("#tmdbId");
  const seasonInput = document.querySelector("#season");
  const episodeInput = document.querySelector("#episode");
  const progressInput = document.querySelector("#progress");
  const findSubtitlesBtn = document.querySelector("#findSubtitlesBtn");
  const autoFetchBtn = document.querySelector("#autoFetchBtn");
  const reloadPreviewButton = document.querySelector("#reloadPreview");
  const clearEventsButton = document.querySelector("#clearEvents");
  const favoritePlayerButton = document.querySelector("#favoritePlayer");
  const copyButtons = document.querySelectorAll("[data-copy-target]");
  let eventEntries = [];

  let currentTvSeasons = [];
  let currentTvId = null;
  let currentSeasonRendered = null;
  let currentTmdbIdRendered = null;
  let currentEpisodeRendered = null;
  let fetchSeasonsError = null;
  let currentContentKeyRendered = null;
  let lastRecordedTime = null;

  const episodeListContainer = document.createElement("div");
  episodeListContainer.id = "episodeListContainer";
  episodeListContainer.style.width = "100%";
  episodeListContainer.style.marginTop = "2rem";
  form.insertAdjacentElement("afterend", episodeListContainer);

  function adjustSelectOptions(selectEl, maxVal, intendedValue) {
    const currentCount = selectEl.options.length;
    const targetValue = intendedValue || Number(selectEl.value) || 1;

    if (currentCount === 0 && maxVal > 0) {
      for (let i = 1; i <= maxVal; i++) {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = i;
        selectEl.appendChild(opt);
      }
      selectEl.value = targetValue <= maxVal ? String(targetValue) : String(maxVal);
      return;
    }

    if (currentCount === maxVal) return;

    const currentValue = Number(selectEl.value) || targetValue;

    if (currentCount < maxVal) {
      for (let i = currentCount + 1; i <= maxVal; i++) {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = i;
        selectEl.appendChild(opt);
      }
    } else {
      while (selectEl.options.length > maxVal) {
        selectEl.remove(selectEl.options.length - 1);
      }
    }

    selectEl.value = currentValue > maxVal ? String(maxVal) : String(currentValue);
  }

  function updateSeasonAndEpisodeConstraints() {
    if (getMediaType() !== "tv") return;

    const tmdbId = tmdbIdInput.value.trim();
    if (currentTvId !== tmdbId) {
      currentTvId = tmdbId;
      currentTvSeasons = [];
      fetchTvSeasons(tmdbId);
    }

    let maxSeasons = 1;
    let maxEpisodes = 1;
    const currentSeason = Number(seasonInput.value) || Number(seasonInput.dataset.tempValue) || 1;

    if (currentTvSeasons.length > 0) {
      const regularSeasons = currentTvSeasons.filter((s) => s.season_number > 0);
      maxSeasons = regularSeasons.length > 0 ? Math.max(...regularSeasons.map((s) => s.season_number)) : 1;

      const seasonData = currentTvSeasons.find((s) => s.season_number === currentSeason);
      if (seasonData) {
        maxEpisodes = seasonData.episode_count || 1;
      }
    } else {
      const entry = getCurrentEntry();
      maxSeasons = entry.totalSeasons || 1;
      maxEpisodes = entry.totalEpisodes ? Math.max(1, Math.floor(entry.totalEpisodes / maxSeasons)) : 99;
    }

    if (seasonInput.tagName === "SELECT") {
      adjustSelectOptions(seasonInput, maxSeasons, currentSeason);
    } else {
      seasonInput.max = maxSeasons;
      seasonInput.min = 1;
      if (Number(seasonInput.value) > maxSeasons) seasonInput.value = maxSeasons;
    }

    const currentEpisode = Number(episodeInput.value) || Number(episodeInput.dataset.tempValue) || 1;
    if (episodeInput.tagName === "SELECT") {
      adjustSelectOptions(episodeInput, maxEpisodes, currentEpisode);
    } else {
      episodeInput.max = maxEpisodes;
      episodeInput.min = 1;
      if (Number(episodeInput.value) > maxEpisodes) episodeInput.value = maxEpisodes;
    }
  }

  async function fetchTvSeasons(tmdbId) {
    const credential = DEFAULT_TMDB_KEY;
    if (!credential) return;

    fetchSeasonsError = null;
    try {
      const url = new URL(`${TMDB_API_URL}/tv/${tmdbId}`);
      url.searchParams.set("language", "en-US");
      if (!credential.startsWith("ey")) {
        url.searchParams.set("api_key", credential);
      }

      const response = await fetch(url, { headers: getTmdbHeaders(credential) });
      if (response.ok) {
        const data = await response.json();
        if (data && data.seasons && currentTvId === String(data.id)) {
          currentTvSeasons = data.seasons;
          currentSeasonRendered = null; // Force episodes list to re-render
          
          // Dynamically update the player header with the exact show info!
          const sCount = data.number_of_seasons || 0;
          const eCount = data.number_of_episodes || 0;
          if (sCount && eCount) {
            playerMeta.textContent = `${sCount} Season${sCount === 1 ? "" : "s"} | ${eCount} Episode${eCount === 1 ? "" : "s"}`;
          }
          if (data.name) {
            playerTitle.textContent = data.name;
          }

          updateOutputs(); // Refreshes URL correctly based on verified constraints
        }
      } else {
        fetchSeasonsError = response.status === 401 ? 'invalid_key' : 'not_found';
        currentSeasonRendered = null;
        updateOutputs();
      }
    } catch (err) {
      console.error("Failed to fetch accurate TV seasons:", err);
      fetchSeasonsError = 'network_error';
      currentSeasonRendered = null;
      updateOutputs();
    }
  }

  async function fetchTvEpisodesDetails(tmdbId, seasonNumber) {
    const credential = DEFAULT_TMDB_KEY;
    if (!credential) return null;

    try {
      const url = new URL(`${TMDB_API_URL}/tv/${tmdbId}/season/${seasonNumber}`);
      url.searchParams.set("language", "en-US");
      if (!credential.startsWith("ey")) {
        url.searchParams.set("api_key", credential);
      }

      const response = await fetch(url, { headers: getTmdbHeaders(credential) });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.error("Failed to fetch accurate TV episodes:", err);
    }
    return null;
  }

  async function renderEpisodesList(tmdbId, currentSeason, currentEpisode) {
    const credential = DEFAULT_TMDB_KEY;

    currentTmdbIdRendered = tmdbId;
    currentSeasonRendered = currentSeason;
    currentEpisodeRendered = currentEpisode;

    if (!credential) {
      episodeListContainer.innerHTML = `
        <div style='padding: 1.5rem; text-align: center; border: 1px dashed #444; border-radius: 8px; color: #aaa;'>
          <strong>Episodes List Unavailable</strong><br>
          To view episode names and thumbnails, please add a valid TMDB API Key to your <code>env.js</code> file.
        </div>
      `;
      return;
    }

    if (fetchSeasonsError) {
      let errorTitle = "Failed to load season data";
      let errorDesc = "Please check that your TMDB API Key is valid and try again.";

      if (fetchSeasonsError === 'invalid_key') {
         errorTitle = "Invalid API Key";
         errorDesc = "TMDB rejected this key. Please make sure your <code>env.js</code> contains an actual TMDB API Key (or Read Access Token).";
      } else if (fetchSeasonsError === 'not_found') {
         errorTitle = "TV Show Not Found";
         errorDesc = "TMDB could not find a TV show with this ID. <strong>Note: TMDB uses completely different IDs for Movies and TV Shows!</strong> If you are trying to watch a movie, please select 'Movie' instead of 'TV Show' above.";
      }

      episodeListContainer.innerHTML = `
        <div style='padding: 1.5rem; text-align: center; border: 1px dashed #ff4444; border-radius: 8px; color: #ff6b6b;'>
          <strong>${errorTitle}</strong><br>${errorDesc}
        </div>
      `;
      return;
    }

    if (currentTvSeasons.length === 0) {
      episodeListContainer.innerHTML = "<div style='padding: 1.5rem; text-align: center; color: #aaa;'>Loading seasons and episodes...</div>";
      return;
    }

    const seasonOptions = currentTvSeasons
      .filter((s) => s.season_number > 0)
      .map((s) => `<option value="${s.season_number}" ${s.season_number === currentSeason ? "selected" : ""}>Season ${s.season_number}</option>`)
      .join("");

    episodeListContainer.innerHTML = `
      <style>
        .episodes-grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
        .episode-card-btn { display: flex; gap: 1rem; padding: 0.75rem; border-radius: 8px; cursor: pointer; background: #1a1a1a; transition: all 0.2s; text-align: left; width: 100%; border: 1px solid #333; color: inherit; font-family: inherit; align-items: flex-start; }
        .episode-card-btn:hover { background: #2a2a2a; border-color: #555; }
        .episode-card-btn.is-active { background: #222; border-color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        .episode-card-btn img { width: 120px; height: 68px; object-fit: cover; border-radius: 4px; flex-shrink: 0; background: #333; }
        .episode-card-btn .placeholder-img { width: 120px; height: 68px; background: #333; border-radius: 4px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: #666; }
        .episode-card-btn h4 { margin: 0 0 0.25rem 0; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #eee; }
        .episode-card-btn p { margin: 0; font-size: 0.8rem; color: #aaa; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4; }
        .visual-season-select { padding: 0.5rem; border-radius: 4px; background: #222; color: #fff; border: 1px solid #444; font-size: 1rem; cursor: pointer; }
      </style>
      <div class="episodes-section">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3 style="margin: 0; font-size: 1.25rem;">Episodes</h3>
          <select id="visualSeasonSelect" class="visual-season-select">
            ${seasonOptions}
          </select>
        </div>
        <div id="episodesGrid" class="episodes-grid">
          <div style="padding: 1.5rem; color: #aaa;">Loading episodes for Season ${currentSeason}...</div>
        </div>
      </div>
    `;

    const visualSeasonSelect = document.querySelector("#visualSeasonSelect");
    if (visualSeasonSelect) {
      visualSeasonSelect.addEventListener("change", (e) => {
        seasonInput.value = e.target.value;
        seasonInput.dataset.tempValue = e.target.value;
        episodeInput.value = "1";
        episodeInput.dataset.tempValue = "1";
        updateOutputs({ refreshFrame: true });
      });
    }

    const seasonData = await fetchTvEpisodesDetails(tmdbId, currentSeason);
    const grid = document.querySelector("#episodesGrid");
    if (!grid) return; 

    if (seasonData && seasonData.episodes) {
      if (seasonData.episodes.length === 0) {
        grid.innerHTML = "<div style='color: #aaa;'>No episodes found for this season.</div>";
        return;
      }
      
      grid.innerHTML = seasonData.episodes.map((ep) => {
        const img = ep.still_path ? `${TMDB_IMAGE_URL}/w342${ep.still_path}` : "";
        const isActive = ep.episode_number === currentEpisode;
        return `
          <button type="button" class="episode-card-btn ${isActive ? 'is-active' : ''}" data-episode="${ep.episode_number}">
            ${img ? `<img src="${img}" alt="Episode ${ep.episode_number}" loading="lazy">` : `<div class="placeholder-img">No Image</div>`}
            <div style="overflow: hidden;">
              <h4>${ep.episode_number}. ${ep.name || 'TBA'}</h4>
              <p>${ep.overview || "No description available."}</p>
            </div>
          </button>
        `;
      }).join("");

      grid.querySelectorAll(".episode-card-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          episodeInput.value = btn.dataset.episode;
          episodeInput.dataset.tempValue = btn.dataset.episode;
          updateOutputs({ refreshFrame: true });
          
          playerFrame.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      });
    } else {
      grid.innerHTML = "<div style='color: #ff6b6b;'>Could not load episodes. Please check your TMDB API Key.</div>";
    }
  }

  function updateActiveEpisodeCard(currentEpisode) {
    currentEpisodeRendered = currentEpisode;
    const grid = document.querySelector("#episodesGrid");
    if (!grid) return;
    
    grid.querySelectorAll(".episode-card-btn").forEach((btn) => {
      const isActive = Number(btn.dataset.episode) === currentEpisode;
      btn.classList.toggle("is-active", isActive);
    });
  }

  function getCurrentEntry() {
    const currentMediaType = getMediaType();
    return getTitleFromEntry({
      id: tmdbIdInput.value,
      mediaType: currentMediaType,
      title,
      season: seasonInput.value,
      episode: episodeInput.value,
    });
  }

  function syncFavoriteButton() {
    const currentEntry = getCurrentEntry();
    const saved = isFavorite(currentEntry);
    favoritePlayerButton.textContent = saved ? "Saved" : "Favorite";
    favoritePlayerButton.classList.toggle("is-active", saved);
    favoritePlayerButton.setAttribute("aria-pressed", String(saved));
  }

  function syncTvControls() {
    const isTv = getMediaType() === "tv";
    tvOptions.forEach((option) => {
      option.hidden = !isTv;
    });

    tmdbIdInput.placeholder = isTv ? "TV Show ID (e.g., 1396)" : "Movie ID (e.g., 157336)";

    const parentLabel = tmdbIdInput.closest("label");
    if (parentLabel) {
      const span = parentLabel.querySelector("span");
      if (span) span.textContent = isTv ? "TMDB TV Show ID" : "TMDB Movie ID";
    }
  }

  function updateOutputs({ refreshFrame = false } = {}) {
    syncTvControls();
    syncFavoriteButton();
    updateSeasonAndEpisodeConstraints();

    const currentEntry = getCurrentEntry();
    const newContentKey = getContentKey(currentEntry);
    const isFirstLoadOrChange = !currentContentKeyRendered || currentContentKeyRendered !== newContentKey;

    if (currentContentKeyRendered && currentContentKeyRendered !== newContentKey) {
      const savedProgress = getSavedProgress(currentEntry);
      if (savedProgress?.currentTime && (!savedProgress.progress || savedProgress.progress < 95)) {
        progressInput.value = Math.floor(savedProgress.currentTime);
      } else {
        progressInput.value = "";
      }
    }
    currentContentKeyRendered = newContentKey;

    const url = buildEmbedUrl();
    embedUrlOutput.value = url;
    iframeCodeOutput.value = buildIframeCode(url);

    if (refreshFrame || playerFrame.src !== url) {
      playerFrame.src = url;
      lastRecordedTime = null;
    }

    if (getMediaType() === "tv") {
      const currentSeason = Number(seasonInput.value) || 1;
      const currentEpisode = Number(episodeInput.value) || 1;
      const tmdbId = tmdbIdInput.value.trim();

      if (tmdbId !== currentTmdbIdRendered || currentSeason !== currentSeasonRendered) {
        renderEpisodesList(tmdbId, currentSeason, currentEpisode);
      } else if (currentEpisode !== currentEpisodeRendered) {
        updateActiveEpisodeCard(currentEpisode); // Skips fetching if only the episode changed
      }
    } else {
      episodeListContainer.innerHTML = "";
      currentTmdbIdRendered = null;
      currentSeasonRendered = null;
      currentEpisodeRendered = null;
    }
  }

  async function copyValue(targetId, button) {
    const target = document.querySelector(`#${targetId}`);
    const originalText = button.textContent;

    try {
      await navigator.clipboard.writeText(target.value);
      button.textContent = "Copied";
    } catch {
      target.select();
      document.execCommand("copy");
      button.textContent = "Copied";
    }

    window.setTimeout(() => {
      button.textContent = originalText;
    }, 1400);
  }

  function parsePlayerMessage(data) {
    if (typeof data !== "string") {
      return data;
    }

    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }

  function appendPlayerEvent(message) {
    const parsed = parsePlayerMessage(message);

    if (!parsed || parsed.type !== "PLAYER_EVENT") {
      return;
    }

    const incomingTime = parsed.data?.currentTime ?? parsed.data?.timestamp;
    if (incomingTime !== undefined && incomingTime === lastRecordedTime) {
      return; // Ignore duplicate timestamps when the video is paused
    }
    lastRecordedTime = incomingTime;

    saveProgress(getCurrentEntry(), parsed.data || {});

    eventEntries = [
      JSON.stringify(parsed, null, 2),
      ...eventEntries,
    ].slice(0, 8);

    eventLog.textContent = eventEntries.join("\n\n");
  }

  setMediaType(mediaType);

  if (serverProviderInput) {
    let savedServer = readStore(SERVER_KEY, "https://vidsrc.me/embed");
    if (savedServer.includes("vidsrc.net") || savedServer.includes("vidsrc.to") || savedServer.includes("embed.su")) savedServer = "https://vidsrc.me/embed";
    serverProviderInput.value = savedServer;
    serverProviderInput.addEventListener("change", () => {
      writeStore(SERVER_KEY, serverProviderInput.value);
      updateOutputs({ refreshFrame: true });
    });
  }

  tmdbIdInput.value = id;
  seasonInput.value = pageParams.get("season") || selectedTitle?.season || "1";
  seasonInput.dataset.tempValue = seasonInput.value;
  episodeInput.value = pageParams.get("episode") || selectedTitle?.episode || "1";
  episodeInput.dataset.tempValue = episodeInput.value;

  const savedProgress = getSavedProgress(getCurrentEntry());
  const requestedProgress = pageParams.get("progress");
  if (requestedProgress) {
    progressInput.value = requestedProgress;
  } else if (savedProgress?.currentTime && (!savedProgress.progress || savedProgress.progress < 95)) {
    progressInput.value = Math.floor(savedProgress.currentTime);
  } else {
    progressInput.value = "";
  }
  playerTitle.textContent = title;
  playerMeta.textContent = mediaType === "tv" ? `TV Series - TMDB ${id}` : `Movie - TMDB ${id}`;
  saveHistory(getCurrentEntry());

  form.addEventListener("input", () => updateOutputs());
  form.addEventListener("change", () => updateOutputs());

  favoritePlayerButton.addEventListener("click", () => {
    toggleFavorite(getCurrentEntry());
    syncFavoriteButton();
  });

  reloadPreviewButton.addEventListener("click", () => {
    updateOutputs({ refreshFrame: true });
  });

  clearEventsButton.addEventListener("click", () => {
    eventEntries = [];
    lastRecordedTime = null;
    eventLog.textContent = "Waiting for player events...";
  });

  async function runAutoFetch(silent = false) {
    if (!autoFetchBtn) return;
    try {
      autoFetchBtn.textContent = "Fetching...";
      autoFetchBtn.disabled = true;
      const text = await autoFetchSubtitles(tmdbIdInput.value.trim(), getMediaType(), seasonInput.value, episodeInput.value);
      
      const blob = new Blob([text], { type: "text/vtt" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      const entry = getCurrentEntry();
      const filename = getMediaType() === "tv" 
        ? `${entry.title.replace(/[^a-zA-Z0-9]/g, '_')}_S${entry.season}E${entry.episode}.vtt`
        : `${entry.title.replace(/[^a-zA-Z0-9]/g, '_')}_Subtitle.vtt`;
        
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (!silent) alert("Subtitle downloaded successfully! \n\nIf your current player supports it (like Vidking or VidSrc.pm), click the 'CC' button to upload.");
    } catch (err) {
      if (!silent) alert(`Error: ${err.message}`);
    } finally {
      autoFetchBtn.textContent = "Auto-Fetch Subtitles";
      autoFetchBtn.disabled = false;
    }
  }

  if (autoFetchBtn) {
    autoFetchBtn.addEventListener("click", () => runAutoFetch(false));
  }

  if (findSubtitlesBtn) {
    findSubtitlesBtn.addEventListener("click", () => {
      const entry = getCurrentEntry();
      let query = entry.title;
      if (getMediaType() !== "tv" && entry.year) {
        query += ` ${entry.year}`;
      }
      window.open(`https://subdl.com/search/${encodeURIComponent(query)}`, "_blank");
    });
  }

  copyButtons.forEach((button) => {
    button.addEventListener("click", () => {
      copyValue(button.dataset.copyTarget, button);
    });
  });

  window.addEventListener("message", (event) => {
    appendPlayerEvent(event.data);
  });

  updateOutputs({ refreshFrame: true });
}

// ==========================================
// UI: PROFILE PAGE
// ==========================================
function initProfilePage() {
  const continueList = document.querySelector("#continueList");
  const favoriteList = document.querySelector("#favoriteList");
  const historyList = document.querySelector("#historyList");
  const clearProfileDataButton = document.querySelector("#clearProfileData");

  if (!continueList || !favoriteList || !historyList) {
    return;
  }

  const favoriteCount = document.querySelector("#favoriteCount");
  const historyCount = document.querySelector("#historyCount");
  const watchTimeTotal = document.querySelector("#watchTimeTotal");

  function renderEmpty(target, text) {
    target.innerHTML = `<p class="empty-state">${text}</p>`;
  }

  function renderProfileItem(item, options = {}) {
    const mediaType = item.mediaType || "movie";
    const normalized = getTitleFromEntry({ ...item, mediaType });
    const href = buildPlayerHref(normalized, mediaType);
    const progressText = item.currentTime
      ? `${formatDuration(item.currentTime)} saved${item.duration ? ` of ${formatDuration(item.duration)}` : ""}`
      : "";
    const dateText = formatDate(item.updatedAt || item.watchedAt || item.savedAt);
    const metaParts = [
      mediaType === "tv" ? `S${normalized.season} E${normalized.episode}` : "Movie",
      normalized.year || "Unknown year",
      progressText,
      dateText,
    ].filter(Boolean);

    const article = document.createElement("article");
    article.className = "profile-item";
    article.innerHTML = `
      <a class="profile-item-link" href="${href}">
        <img src="${normalized.poster}" alt="${normalized.title} poster" loading="lazy" onerror="this.onerror=null; this.removeAttribute('src');">
        <span class="profile-item-copy">
          <strong>${normalized.title}</strong>
          <span>${metaParts.join(" | ")}</span>
        </span>
      </a>
    `;

    if (options.removeFavorite) {
      const button = document.createElement("button");
      button.className = "secondary-button compact-button";
      button.type = "button";
      button.textContent = "Remove";
      button.addEventListener("click", () => {
        toggleFavorite(normalized);
        renderProfile();
      });
      article.append(button);
    }

    return article;
  }

  function renderProfile() {
    const favorites = getFavorites();
    const history = getHistory();
    const progressItems = Object.values(getProgressStore())
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    
    const continueItems = progressItems.filter((item) => (item.progress || 0) < 95);

    favoriteCount.textContent = String(favorites.length);
    historyCount.textContent = String(history.length);
    watchTimeTotal.textContent = formatDuration(getGlobalWatchTime());

    continueList.innerHTML = "";
    favoriteList.innerHTML = "";
    historyList.innerHTML = "";

    if (continueItems.length) {
      continueItems.forEach((item) => continueList.append(renderProfileItem(item)));
    } else {
      renderEmpty(continueList, "No active titles in progress.");
    }

    if (favorites.length) {
      favorites.forEach((item) => favoriteList.append(renderProfileItem(item, { removeFavorite: true })));
    } else {
      renderEmpty(favoriteList, "No favorites yet.");
    }

    if (history.length) {
      history.forEach((item) => historyList.append(renderProfileItem(item)));
    } else {
      renderEmpty(historyList, "No watch history yet.");
    }
  }

  clearProfileDataButton.addEventListener("click", () => {
    localStorage.removeItem(FAVORITES_KEY);
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem(WATCH_TIME_KEY);
    renderProfile();
  });

  renderProfile();
}

// ==========================================
// APP BOOTSTRAP
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  initSelectionPage();
  initPlayerPage();
  initProfilePage();
});

// ==========================================
// JWT AUTH & SYNC INTEGRATION
// ==========================================
const TOKEN_KEY = "freevid_token_v1";
const USERNAME_KEY = "freevid_username_v1";

function getToken() {
  return readStore(TOKEN_KEY, "");
}

function getUsername() {
  return readStore(USERNAME_KEY, "");
}

function isLoggedIn() {
  return !!getToken();
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(FAVORITES_KEY);
  localStorage.removeItem(HISTORY_KEY);
  localStorage.removeItem(PROGRESS_KEY);
  localStorage.removeItem(WATCH_TIME_KEY);
}

async function apiRegister(username, password) {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Registration failed');
  }
  const data = await response.json();
  writeStore(TOKEN_KEY, data.token);
  writeStore(USERNAME_KEY, data.username);
  await apiSyncPush();
  return data;
}

async function apiLogin(username, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Login failed');
  }
  const data = await response.json();
  writeStore(TOKEN_KEY, data.token);
  writeStore(USERNAME_KEY, data.username);
  await apiSyncPull();
  return data;
}

async function apiSyncPull() {
  if (!isLoggedIn()) return;
  try {
    const response = await fetch('/api/user/sync', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!response.ok) return;
    const data = await response.json();
    
    if (data.favorites) writeStore(FAVORITES_KEY, data.favorites);
    if (data.history) writeStore(HISTORY_KEY, data.history);
    if (data.progress) writeStore(PROGRESS_KEY, data.progress);
    if (data.watchTime !== undefined) writeStore(WATCH_TIME_KEY, data.watchTime);
  } catch (err) {
    console.warn('Sync pull failed:', err);
  }
}

async function apiSyncPush() {
  if (!isLoggedIn()) return;
  try {
    const favorites = readStore(FAVORITES_KEY, []);
    const history = readStore(HISTORY_KEY, []);
    const progress = readStore(PROGRESS_KEY, {});
    const watchTime = readStore(WATCH_TIME_KEY, 0);

    const response = await fetch('/api/user/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ favorites, history, progress, watchTime })
    });
    if (!response.ok) return;
    const data = await response.json();
    
    if (data.favorites) writeStore(FAVORITES_KEY, data.favorites);
    if (data.history) writeStore(HISTORY_KEY, data.history);
    if (data.progress) writeStore(PROGRESS_KEY, data.progress);
    if (data.watchTime !== undefined) writeStore(WATCH_TIME_KEY, data.watchTime);
  } catch (err) {
    console.warn('Sync push failed:', err);
  }
}

async function apiClearCloud() {
  if (!isLoggedIn()) return;
  try {
    await fetch('/api/user/clear', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
  } catch (err) {
    console.warn('Clear cloud failed:', err);
  }
}

let syncTimeout = null;
function throttledSyncPush() {
  if (!isLoggedIn()) return;
  if (syncTimeout) return;
  
  syncTimeout = setTimeout(async () => {
    syncTimeout = null;
    await apiSyncPush();
  }, 10000);
}

export {
  TMDB_API_URL, TMDB_IMAGE_URL, TMDB_CACHE_KEY, DEFAULT_TMDB_KEY,
  FAVORITES_KEY, HISTORY_KEY, PROGRESS_KEY, WATCH_TIME_KEY, SERVER_KEY,
  catalog, cleanNumber, getCachedCatalog, getActiveCatalog,
  findTitle, readStore, writeStore, getContentKey, getTitleFromEntry,
  getFavorites, getHistory, getProgressStore, getGlobalWatchTime,
  addGlobalWatchTime, isFavorite, toggleFavorite, saveHistory,
  saveProgress, getSavedProgress, formatDuration, formatDate,
  formatTvTotals, getYear, getImageUrl, normalizeMovie, normalizeTv,
  fetchTvStats, getTmdbHeaders, getTmdbUrl, fetchTmdbPage,
  fetchTmdbPages, fetchPopularCatalog, searchTmdb, autoFetchSubtitles,
  uploadSubtitleToTempHost,
  
  getToken, getUsername, isLoggedIn, logout, apiRegister, apiLogin,
  apiSyncPull, apiSyncPush, apiClearCloud
};
