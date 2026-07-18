import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  DEFAULT_TMDB_KEY, getCachedCatalog, getActiveCatalog, catalog,
  formatTvTotals, fetchPopularCatalog, TMDB_CACHE_KEY, isFavorite, toggleFavorite,
  fetchTvStats, getSavedProgress, searchTmdb, getUsername, isLoggedIn, getPersonalizedRecommendations,
  getHistory, getEpisodeProgress, setEpisodeProgress, getWatchedEpisodes, clearAllHistory, deleteFromHistory
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
          <img src={item.poster} alt={`${item.title} poster`} loading="lazy" draggable="false" />
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
  { id: 10764, name: "Reality" },
  { id: 99999, name: "Anime" },
  { id: 88888, name: "K-Drama" }
].sort((a, b) => a.name.localeCompare(b.name));

function GenreRow({ title, items, forceRender }) {
  if (!items || items.length === 0) return null;

  const [visibleCount, setVisibleCount] = useState(25);
  const rowRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const hasMoved = useRef(false);

  const handleMouseDown = (e) => {
    isDragging.current = true;
    hasMoved.current = false;
    startX.current = e.pageX - rowRef.current.offsetLeft;
    scrollLeft.current = rowRef.current.scrollLeft;
    rowRef.current.style.cursor = 'grabbing';
    rowRef.current.style.scrollBehavior = 'auto';
    rowRef.current.style.scrollSnapType = 'none';
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const x = e.pageX - rowRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    if (Math.abs(walk) > 8) {
      hasMoved.current = true;
    }
    rowRef.current.scrollLeft = scrollLeft.current - walk;
    handleScroll();
  };

  const handleMouseUpOrLeave = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    rowRef.current.style.cursor = 'grab';
    rowRef.current.style.scrollBehavior = 'smooth';
    rowRef.current.style.scrollSnapType = 'x mandatory';
  };

  const handleClickCapture = (e) => {
    if (hasMoved.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleScroll = () => {
    if (!rowRef.current) return;
    const { scrollLeft: sLeft, clientWidth, scrollWidth } = rowRef.current;
    if (sLeft + clientWidth >= scrollWidth - 500) {
      setVisibleCount(prev => Math.min(prev + 25, items.length));
    }
  };

  const displayed = items.slice(0, visibleCount);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>{title}</h3>
      <div 
        ref={rowRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onScroll={handleScroll}
        onClickCapture={handleClickCapture}
        onDragStart={(e) => e.preventDefault()}
        style={{ 
          display: 'flex', 
          gap: '18px', 
          overflowX: 'auto', 
          paddingBottom: '1rem', 
          scrollSnapType: 'x mandatory',
          cursor: 'grab',
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
      >
        {displayed.map((item, idx) => (
          <div key={`${item.id}-${idx}`} style={{ flex: '0 0 170px', scrollSnapAlign: 'start', pointerEvents: 'auto' }}>
            <PosterCard item={item} forceRender={forceRender} />
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentlyWatchedRow({ items, forceRender, onClearAll, onRemove }) {
  if (!items || items.length === 0) return null;

  const [visibleCount, setVisibleCount] = useState(25);
  const rowRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const hasMoved = useRef(false);

  const handleMouseDown = (e) => {
    isDragging.current = true;
    hasMoved.current = false;
    startX.current = e.pageX - rowRef.current.offsetLeft;
    scrollLeft.current = rowRef.current.scrollLeft;
    rowRef.current.style.cursor = 'grabbing';
    rowRef.current.style.scrollBehavior = 'auto';
    rowRef.current.style.scrollSnapType = 'none';
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const x = e.pageX - rowRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    if (Math.abs(walk) > 8) {
      hasMoved.current = true;
    }
    rowRef.current.scrollLeft = scrollLeft.current - walk;
    handleScroll();
  };

  const handleMouseUpOrLeave = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    rowRef.current.style.cursor = 'grab';
    rowRef.current.style.scrollBehavior = 'smooth';
    rowRef.current.style.scrollSnapType = 'x mandatory';
  };

  const handleClickCapture = (e) => {
    if (hasMoved.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleScroll = () => {
    if (!rowRef.current) return;
    const { scrollLeft: sLeft, clientWidth, scrollWidth } = rowRef.current;
    if (sLeft + clientWidth >= scrollWidth - 500) {
      setVisibleCount(prev => Math.min(prev + 25, items.length));
    }
  };

  const displayed = items.slice(0, visibleCount);

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem' }}>🕐 Recently Watched</h3>
        <button 
          type="button" 
          onClick={onClearAll}
          style={{
            background: 'rgba(220, 53, 69, 0.15)',
            color: '#dc3545',
            border: '1px solid rgba(220, 53, 69, 0.3)',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '0.8rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(220, 53, 69, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(220, 53, 69, 0.15)';
          }}
        >
          Clear All
        </button>
      </div>
      <div 
        ref={rowRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onScroll={handleScroll}
        onClickCapture={handleClickCapture}
        onDragStart={(e) => e.preventDefault()}
        style={{ 
          display: 'flex', 
          gap: '18px', 
          overflowX: 'auto', 
          paddingBottom: '1rem', 
          scrollSnapType: 'x mandatory',
          cursor: 'grab',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          position: 'relative'
        }}
      >
        {displayed.map((item, idx) => (
          <div key={`${item.id}-${idx}`} style={{ flex: '0 0 170px', scrollSnapAlign: 'start', pointerEvents: 'auto', position: 'relative' }}>
            <PosterCard item={item} forceRender={forceRender} />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove(item);
              }}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.7)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                opacity: 0,
                transition: 'opacity 0.2s ease',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(220, 53, 69, 0.9)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(0, 0, 0, 0.7)';
              }}
            >
              ×
            </button>
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
  const [personalizedRecs, setPersonalizedRecs] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [recentlyWatched, setRecentlyWatched] = useState([]);
  const forceRender = () => setRenderTrigger(prev => prev + 1);

  // Feature #1: Load recently watched on mount (deployed 2026-07-18T16:40:00Z)
  useEffect(() => {
    const history = getHistory();
    setRecentlyWatched(history.slice(0, 12));
  }, []);

  // Handle removing a specific item from history
  const handleRemoveFromHistory = (item) => {
    if (!confirm(`Remove "${item.title}" from watch history?`)) return;
    deleteFromHistory(item);
    setRecentlyWatched(prev => prev.filter(i => {
      if (item.mediaType === "tv") {
        return String(i.id) !== String(item.id);
      }
      return i.id !== item.id;
    }));
    forceRender();
  };

  // Handle clearing entire history
  const handleClearAllHistory = () => {
    if (!confirm('Clear ALL watch history? This cannot be undone.')) return;
    clearAllHistory();
    setRecentlyWatched([]);
    forceRender();
  };

  // Feature #11: Load personalized recommendations on mount
  useEffect(() => {
    const loadRecs = async () => {
      setLoadingRecs(true);
      try {
        const recs = await getPersonalizedRecommendations('all', 20);
        setPersonalizedRecs(recs);
      } catch (err) {
        console.warn('Failed to load personalized recommendations:', err);
      } finally {
        setLoadingRecs(false);
      }
    };
    loadRecs();
  }, []);

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

  // Deduplicate items by unique mediaType and ID to prevent duplicate show rendering
  const uniqueMap = new Map();
  items.forEach(item => {
    uniqueMap.set(`${item.mediaType || 'movie'}:${item.id}`, item);
  });
  items = Array.from(uniqueMap.values());
  
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
  } else if (selectedSort === 'rating-desc') {
    items = [...items].sort((a, b) => (b.vote_average || b.rating || 0) - (a.vote_average || a.rating || 0));
  } else if (selectedSort === 'rating-asc') {
    items = [...items].sort((a, b) => (a.vote_average || a.rating || 0) - (b.vote_average || b.rating || 0));
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
                <option value="rating-desc">Rating (Highest First)</option>
                <option value="rating-asc">Rating (Lowest First)</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Feature #1: Recently Watched Row with history management (deployed 2026-07-18T17:12:00Z) */}
        {!searchQuery.trim() && recentlyWatched.length > 0 && (
          <RecentlyWatchedRow 
            items={recentlyWatched}
            forceRender={forceRender}
            onClearAll={handleClearAllHistory}
            onRemove={handleRemoveFromHistory}
          />
        )}

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
            {/* Feature #11: Personalized Recommendations Row */}
            {personalizedRecs.length > 0 && (
              <GenreRow 
                title="🎯 Because You Watched" 
                items={personalizedRecs} 
                forceRender={forceRender} 
              />
            )}
            {loadingRecs && (
              <p style={{ padding: '1rem 0', color: 'var(--text-dim)' }}>Loading personalized recommendations...</p>
            )}
            <GenreRow title="Trending Hits" items={items} forceRender={forceRender} />
            {ALL_GENRES.map(genre => (
              <GenreRow 
                key={genre.id} 
                title={genre.name} 
                items={items.filter(item => item.genreIds?.includes(genre.id))} 
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