import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DEFAULT_TMDB_KEY, getCachedCatalog, getActiveCatalog, catalog,
  formatTvTotals, fetchPopularCatalog, TMDB_CACHE_KEY, isFavorite, toggleFavorite,
  fetchTvStats, getSavedProgress, searchTmdb, getUsername, isLoggedIn
} from './app.js';
import './royal-theme.css';

function PosterCard({ item, forceRender }) {
  const catalogType = item.mediaType || 'movie';
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

const ALL_GENRES = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 27, name: "Horror" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Sci-Fi" },
  { id: 53, name: "Thriller" },
  { id: 10759, name: "Action & Adventure" },
  { id: 10765, name: "Sci-Fi & Fantasy" },
  { id: 10762, name: "Kids" },
  { id: 10764, name: "Reality" }
].sort((a, b) => a.name.localeCompare(b.name));

function GenreRow({ title, items, forceRender }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>{title}</h3>
      <div style={{ display: 'flex', gap: '18px', overflowX: 'auto', paddingBottom: '1rem', scrollSnapType: 'x mandatory' }}>
        {items.map((item, idx) => (
          <div key={`${item.id}-${idx}`} style={{ flex: '0 0 170px', scrollSnapAlign: 'start' }}>
            <PosterCard item={item} forceRender={forceRender} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SelectionPage() {
  const [filterMediaType, setFilterMediaType] = useState('all');
  const [status, setStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [renderTrigger, setRenderTrigger] = useState(0);
  const [displayLimit, setDisplayLimit] = useState(60);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [selectedSort, setSelectedSort] = useState('popular');
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
        let results = [];
        if (filterMediaType === 'all') {
          const [movieRes, tvRes] = await Promise.all([
            searchTmdb(searchQuery, 'movie', DEFAULT_TMDB_KEY),
            searchTmdb(searchQuery, 'tv', DEFAULT_TMDB_KEY)
          ]);
          results = [
            ...movieRes.map(r => ({ ...r, mediaType: 'movie' })),
            ...tvRes.map(r => ({ ...r, mediaType: 'tv' }))
          ];
        } else {
          const res = await searchTmdb(searchQuery, filterMediaType, DEFAULT_TMDB_KEY);
          results = res.map(r => ({ ...r, mediaType: filterMediaType }));
        }
        setSearchResults(results);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, filterMediaType]);

  useEffect(() => {
    setDisplayLimit(60);
  }, [searchQuery, filterMediaType, selectedGenre, filterYear, selectedSort]);

  const activeCatalog = getActiveCatalog();
  const movies = (activeCatalog.movie || []).map(item => ({ ...item, mediaType: 'movie' }));
  const tvShows = (activeCatalog.tv || []).map(item => ({ ...item, mediaType: 'tv' }));
  const combinedItems = [...movies, ...tvShows];

  let items = searchQuery.trim() ? searchResults : combinedItems;
  
  if (filterMediaType !== 'all') {
    items = items.filter(item => item.mediaType === filterMediaType);
  }
  if (selectedGenre) {
    items = items.filter(item => item.genreIds?.includes(Number(selectedGenre)));
  }
  if (filterYear) {
    items = items.filter(item => item.year && String(item.year).includes(filterYear));
  }

  // Sort logic
  if (selectedSort === 'year-desc') {
    items = [...items].sort((a, b) => String(b.year || '').localeCompare(String(a.year || '')));
  } else if (selectedSort === 'year-asc') {
    items = [...items].sort((a, b) => String(a.year || '').localeCompare(String(b.year || '')));
  } else if (selectedSort === 'alpha-asc') {
    items = [...items].sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')));
  } else if (selectedSort === 'alpha-desc') {
    items = [...items].sort((a, b) => String(b.title || '').localeCompare(String(a.title || '')));
  }
  
  const displayedItems = items.slice(0, displayLimit);
  const isGridView = searchQuery.trim() !== '' || selectedGenre !== '' || filterYear !== '' || filterMediaType !== 'all' || selectedSort !== 'popular';

  return (
    <main className="selection-shell">
      <header className="page-header">
        <div><p className="eyebrow">FreeVid</p><h1>Choose What to Watch</h1></div>
        <div className="header-actions">
          <Link className="secondary-button" to="/">Home</Link>
          <Link className="secondary-button" to="/profile">
            {isLoggedIn() ? `👤 ${getUsername()}` : 'Profile'}
          </Link>
        </div>
      </header>
      <section className="tmdb-panel">
        <div><p className="eyebrow">Catalog Source</p><h2>Dashboard Statistics</h2></div>
        <p className="status-line">{status}</p>
      </section>
      <section className="catalog-section">
        <div className="section-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2>
                {searchQuery.trim() 
                  ? 'Search Results' 
                  : selectedGenre 
                    ? `${ALL_GENRES.find(g => g.id === Number(selectedGenre))?.name} Titles` 
                    : 'Popular Movies & TV Shows'} 
                {items.length > 0 && ` (${items.length})`}
              </h2>
              <p>{searchQuery.trim() ? `Showing results for "${searchQuery}"` : 'Browse consolidated movie and TV show titles. Adjust parameters below to narrow results.'}</p>
            </div>
          </div>

          {/* Detailed Search & Filter Panel */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px'
          }}>
            {/* Search Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Search Title</span>
              <input 
                type="search" 
                placeholder="Search movies & TV shows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', minHeight: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--panel)' }}
              />
            </div>

            {/* Content Type Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Content Type</span>
              <select 
                value={filterMediaType} 
                onChange={(e) => setFilterMediaType(e.target.value)}
                style={{ width: '100%', minHeight: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--panel)', color: 'var(--text)' }}
              >
                <option value="all">All Content Types</option>
                <option value="movie">Movies</option>
                <option value="tv">TV Shows</option>
              </select>
            </div>

            {/* Genre Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Genre</span>
              <select 
                value={selectedGenre} 
                onChange={(e) => setSelectedGenre(e.target.value)}
                style={{ width: '100%', minHeight: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--panel)', color: 'var(--text)' }}
              >
                <option value="">All Genres</option>
                {ALL_GENRES.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>

            {/* Year Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Release Year</span>
              <input 
                type="number" 
                placeholder="e.g. 2026"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                style={{ width: '100%', minHeight: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--panel)' }}
              />
            </div>

            {/* Sort Order */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Sort By</span>
              <select 
                value={selectedSort} 
                onChange={(e) => setSelectedSort(e.target.value)}
                style={{ width: '100%', minHeight: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--panel)', color: 'var(--text)' }}
              >
                <option value="popular">Popularity</option>
                <option value="year-desc">Year (Newest First)</option>
                <option value="year-asc">Year (Oldest First)</option>
                <option value="alpha-asc">Title (A-Z)</option>
                <option value="alpha-desc">Title (Z-A)</option>
              </select>
            </div>
          </div>
        </div>
        
        {isGridView ? (
          <>
            <div className="poster-grid">
              {isSearching ? (
                <p style={{ gridColumn: '1 / -1', padding: '2rem 0' }}>Searching...</p>
              ) : displayedItems.length > 0 ? (
                displayedItems.map((item, idx) => <PosterCard key={`${item.id}-${idx}`} item={item} forceRender={forceRender} />)
              ) : (
                <p style={{ gridColumn: '1 / -1', padding: '2rem 0' }}>
                  No titles found matching your search and filter criteria.
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
            <GenreRow title="Trending Hits" items={items.slice(0, 25)} forceRender={forceRender} />
            {ALL_GENRES.map(genre => (
              <GenreRow 
                key={genre.id} 
                title={genre.name} 
                items={items.filter(item => item.genreIds?.includes(genre.id)).slice(0, 25)} 
                forceRender={forceRender} 
              />
            ))}

            <div style={{ marginTop: '2rem' }}>
              <div className="section-header" style={{ marginBottom: '1rem' }}>
                <h2>All Content Grid</h2>
              </div>
              <div className="poster-grid">
                {displayedItems.map((item, idx) => <PosterCard key={`${item.id}-${idx}`} item={item} forceRender={forceRender} />)}
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