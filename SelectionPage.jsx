import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DEFAULT_TMDB_KEY, getCachedCatalog, getActiveCatalog, catalog,
  formatTvTotals, fetchPopularCatalog, TMDB_CACHE_KEY, isFavorite, toggleFavorite,
  fetchTvStats, getSavedProgress, searchTmdb
} from './app.js';

function PosterCard({ item, catalogType, forceRender }) {
  const [stats, setStats] = useState('');
  const year = item.year || "Unknown year";
  const meta = catalogType === "tv" ? formatTvTotals(item) : "Movie";
  const favoriteEntry = { ...item, mediaType: catalogType };
  const saved = isFavorite(favoriteEntry);

  useEffect(() => {
    if (catalogType === 'tv' && DEFAULT_TMDB_KEY) {
      fetchTvStats(item.id, DEFAULT_TMDB_KEY).then(res => {
        if (res) setStats(`${res} \u00B7 ${year}`);
      });
    }
  }, [item.id, catalogType, year]);

  const buildHref = () => {
    const params = new URLSearchParams({ type: catalogType, id: item.id, title: item.title });
    if (catalogType === 'tv') {
      params.set('season', item.season || 1);
      params.set('episode', item.episode || 1);
    }
    const pSaved = getSavedProgress({ ...item, mediaType: catalogType });
    if (pSaved?.currentTime && (!pSaved.progress || pSaved.progress < 95)) {
      params.set("progress", String(Math.floor(pSaved.currentTime)));
    }
    return `/player?${params.toString()}`;
  };

  return (
    <article className="poster-card">
      <span className="poster-media">
        <Link className="poster-image-link" to={buildHref()}>
          <img src={item.poster} alt={`${item.title} poster`} loading="lazy" />
        </Link>
        <button className={`favorite-button ${saved ? 'is-active' : ''}`} type="button" onClick={() => { toggleFavorite(favoriteEntry); forceRender(); }}>
          {saved ? "Saved" : "Favorite"}
        </button>
      </span>
      <Link className="poster-link" to={buildHref()}>
        <span className="poster-copy">
          <strong>{item.title}</strong>
          <span className={catalogType === 'tv' ? 'dynamic-tv-meta' : ''}>{stats || `${meta} \u00B7 ${year}`}</span>
        </span>
      </Link>
    </article>
  );
}

const GENRE_MAP = {
  movie: [
    { id: 28, name: "Action" },
    { id: 35, name: "Comedy" },
    { id: 18, name: "Drama" },
    { id: 878, name: "Sci-Fi" },
    { id: 27, name: "Horror" },
    { id: 53, name: "Thriller" },
    { id: 12, name: "Adventure" },
    { id: 80, name: "Crime" },
    { id: 10751, name: "Family" },
    { id: 9648, name: "Mystery" },
    { id: 16, name: "Animation" },
    { id: 10749, name: "Romance" },
    { id: 99, name: "Documentary" }
  ],
  tv: [
    { id: 10759, name: "Action & Adventure" },
    { id: 35, name: "Comedy" },
    { id: 18, name: "Drama" },
    { id: 10765, name: "Sci-Fi & Fantasy" },
    { id: 9648, name: "Mystery" },
    { id: 80, name: "Crime" },
    { id: 16, name: "Animation" },
    { id: 10751, name: "Family" },
    { id: 10762, name: "Kids" },
    { id: 10764, name: "Reality" },
    { id: 99, name: "Documentary" }
  ]
};

function GenreRow({ title, items, catalogType, forceRender }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', color: '#fff' }}>{title}</h3>
      <div style={{ display: 'flex', gap: '18px', overflowX: 'auto', paddingBottom: '1rem', scrollSnapType: 'x mandatory' }}>
        {items.map(item => (
          <div key={item.id} style={{ flex: '0 0 170px', scrollSnapAlign: 'start' }}>
            <PosterCard item={item} catalogType={catalogType} forceRender={forceRender} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SelectionPage() {
  const [catalogType, setCatalogType] = useState('movie');
  const [status, setStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [renderTrigger, setRenderTrigger] = useState(0);
  const [displayLimit, setDisplayLimit] = useState(60);
  const [selectedGenre, setSelectedGenre] = useState('');
  const forceRender = () => setRenderTrigger(prev => prev + 1);

  useEffect(() => {
    const loadRemote = async () => {
      if (DEFAULT_TMDB_KEY && !getCachedCatalog()) {
        setStatus("Loading popular catalog from TMDB...");
        try {
          const remote = await fetchPopularCatalog(DEFAULT_TMDB_KEY);
          try { localStorage.setItem(TMDB_CACHE_KEY, JSON.stringify(remote)); } catch (e) {}
          setStatus(`Loaded ${remote.movie.length} movies and ${remote.tv.length} TV shows from TMDB.`);
          forceRender();
        } catch (err) {
          setStatus(err.message);
        }
      } else {
        const cached = getCachedCatalog();
        setStatus(cached ? `Loaded ${cached.movie.length} movies and ${cached.tv.length} TV shows from TMDB.` : `Using the built-in catalog: ${catalog.movie.length} movies and ${catalog.tv.length} TV shows.`);
      }
    };
    loadRemote();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim() || !DEFAULT_TMDB_KEY) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const results = await searchTmdb(searchQuery, catalogType, DEFAULT_TMDB_KEY);
        setSearchResults(results);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, catalogType]);

  useEffect(() => {
    setDisplayLimit(60);
  }, [searchQuery, catalogType, selectedGenre]);

  const activeCatalog = getActiveCatalog();
  let items = searchQuery.trim() ? searchResults : (activeCatalog[catalogType] || []);
  
  if (selectedGenre && !searchQuery.trim()) {
    items = items.filter(item => item.genreIds?.includes(Number(selectedGenre)));
  }
  
  const displayedItems = items.slice(0, displayLimit);
  const isGridView = searchQuery.trim() !== '' || selectedGenre !== '';

  return (
    <main className="selection-shell">
      <header className="page-header">
        <div><p className="eyebrow">FreeVid</p><h1>Choose What to Watch</h1></div>
        <div className="header-actions">
          <Link className="secondary-button" to="/">Home</Link>
          <Link className="secondary-button" to="/profile">Profile</Link>
          <fieldset className="catalog-tabs">
            <legend>Catalog Type</legend>
            <label><input type="radio" checked={catalogType === 'movie'} onChange={() => { setCatalogType('movie'); setSearchQuery(''); setSelectedGenre(''); }} /><span>Movies</span></label>
            <label><input type="radio" checked={catalogType === 'tv'} onChange={() => { setCatalogType('tv'); setSearchQuery(''); setSelectedGenre(''); }} /><span>TV Shows</span></label>
          </fieldset>
        </div>
      </header>
      <section className="tmdb-panel">
        <div><p className="eyebrow">Catalog Source</p><h2>Built-in Titles</h2></div>
        <p className="status-line">{status}</p>
      </section>
      <section className="catalog-section">
        <div className="section-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2>
              {searchQuery.trim() 
                ? 'Search Results' 
                : selectedGenre 
                  ? `${GENRE_MAP[catalogType].find(g => g.id === Number(selectedGenre))?.name} ${catalogType === 'tv' ? 'TV Shows' : 'Movies'}` 
                  : (catalogType === 'tv' ? 'Popular TV Shows' : 'Popular Movies')} 
              {items.length > 0 && ` (${items.length})`}
            </h2>
            <p>{searchQuery.trim() ? `Showing results for "${searchQuery}"` : 'Pick a thumbnail to open the dedicated player page.'}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {DEFAULT_TMDB_KEY && (
              <input 
                type="search" 
                placeholder={`Search any ${catalogType === 'tv' ? 'TV Show' : 'Movie'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #333', background: '#111', color: '#fff', minWidth: '220px', fontSize: '1rem' }}
              />
            )}
            <select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #333', background: '#111', color: '#fff', fontSize: '1rem' }} disabled={!!searchQuery.trim()}>
              <option value="">All Genres</option>
              {GENRE_MAP[catalogType].map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        </div>
        
        {isGridView ? (
          <>
            <div className="poster-grid">
              {isSearching ? (
                <p style={{ gridColumn: '1 / -1', padding: '2rem 0', color: '#aaa' }}>Searching...</p>
              ) : displayedItems.length > 0 ? (
                displayedItems.map(item => <PosterCard key={item.id} item={item} catalogType={catalogType} forceRender={forceRender} />)
              ) : (
                <p style={{ gridColumn: '1 / -1', padding: '2rem 0', color: '#aaa' }}>
                  {searchQuery.trim() ? `No titles found for "${searchQuery}".` : "No titles found in this genre."}
                </p>
              )}
            </div>
            {items.length > displayLimit && !isSearching && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                <button type="button" className="secondary-button" onClick={() => setDisplayLimit(prev => prev + 60)}>
                  Load More (+60)
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1rem' }}>
            <GenreRow title={`Trending ${catalogType === 'tv' ? 'TV Shows' : 'Movies'}`} items={items.slice(0, 25)} catalogType={catalogType} forceRender={forceRender} />
            {GENRE_MAP[catalogType].map(genre => (
              <GenreRow 
                key={genre.id} 
                title={genre.name} 
                items={items.filter(item => item.genreIds?.includes(genre.id)).slice(0, 25)} 
                catalogType={catalogType} 
                forceRender={forceRender} 
              />
            ))}

        <div style={{ marginTop: '2rem' }}>
          <div className="section-header" style={{ marginBottom: '1rem' }}>
            <h2>All {catalogType === 'tv' ? 'TV Shows' : 'Movies'}</h2>
          </div>
          <div className="poster-grid">
            {displayedItems.map(item => <PosterCard key={item.id} item={item} catalogType={catalogType} forceRender={forceRender} />)}
          </div>
          {items.length > displayLimit && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
              <button type="button" className="secondary-button" onClick={() => setDisplayLimit(prev => prev + 60)}>
                Load More (+60)
              </button>
            </div>
          )}
        </div>
          </div>
        )}
      </section>
    </main>
  );
}