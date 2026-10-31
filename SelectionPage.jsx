import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from './components/SiteHeader.jsx';
import { CloseIcon, HeartIcon, PlayIcon, SearchIcon, SparklesIcon, StarIcon } from './components/Icons.jsx';
import {
  DEFAULT_TMDB_KEY, getCachedCatalog, getActiveCatalog,
  formatTvTotals, fetchPopularCatalog, TMDB_CACHE_KEY, isFavorite, toggleFavorite,
  fetchTvStats, searchTmdb, getPersonalizedRecommendations,
  getHistory, clearAllHistory, deleteFromHistory
} from './app.js';

function buildPlayerHref(item) {
  const mediaType = item.mediaType || 'movie';
  const params = new URLSearchParams({ type: mediaType, id: item.id, title: item.title });
  if (mediaType === 'tv') {
    params.set('season', item.season || 1);
    params.set('episode', item.episode || 1);
  }
  return `/player?${params.toString()}`;
}

const HERO_CARD_COUNT = 6;
const HERO_INTERVAL_MS = 7000;

const heroItemKey = (item) => `${item.mediaType || 'movie'}:${item.id}`;

// Most picks come from the front of the catalog (popular/trending order), the
// rest are random so older titles keep appearing too.
function pickHeroSet(pool, count, exclude = new Set()) {
  const fresh = pool.filter(item => !exclude.has(heroItemKey(item)));
  const source = fresh.length >= count ? fresh : pool;
  const popularEnd = Math.max(count, Math.ceil(source.length * 0.4));
  const popular = source.slice(0, popularEnd);
  const rest = source.slice(popularEnd);
  const picks = [];
  const take = (list) => {
    if (!list.length) return false;
    picks.push(list.splice(Math.floor(Math.random() * list.length), 1)[0]);
    return true;
  };

  while (picks.length < Math.ceil(count * 0.65)) {
    if (!take(popular) && !take(rest)) break;
  }
  while (picks.length < count) {
    if (!take(rest) && !take(popular)) break;
  }
  return picks;
}

function PosterCard({ item, forceRender }) {
  const mediaType = item.mediaType || 'movie';
  const [stats, setStats] = useState('');
  const year = item.year || 'Unknown year';
  const meta = mediaType === 'tv' ? formatTvTotals(item) : 'Movie';
  const favoriteEntry = { ...item, mediaType };
  const saved = isFavorite(favoriteEntry);
  const rating = Number(item.vote_average ?? item.rating ?? 0);

  useEffect(() => {
    if (mediaType === 'tv' && DEFAULT_TMDB_KEY) {
      fetchTvStats(item.id, DEFAULT_TMDB_KEY).then(res => {
        if (res) setStats(`${res} \u00B7 ${year}`);
      });
    }
  }, [item.id, mediaType, year]);

  return (
    <article className="poster-card">
      <span className="poster-media">
        <Link className="poster-image-link" to={buildPlayerHref(item)}>
          <img src={item.poster} alt={`${item.title} poster`} loading="lazy" draggable="false" />
        </Link>
        {rating > 0 && (
          <span className="poster-rating"><StarIcon size={11} />{rating.toFixed(1)}</span>
        )}
        <button
          className={`favorite-button ${saved ? 'is-active' : ''}`}
          type="button"
          aria-pressed={saved}
          title={saved ? 'Remove from favorites' : 'Add to favorites'}
          onClick={() => { toggleFavorite(favoriteEntry); forceRender(); }}
        >
          <HeartIcon size={13} filled={saved} />
          <span>{saved ? 'Saved' : 'Favorite'}</span>
        </button>
      </span>
      <Link className="poster-link" to={buildPlayerHref(item)}>
        <span className="poster-copy">
          <strong>{item.title}</strong>
          <span className={mediaType === 'tv' ? 'dynamic-tv-meta' : ''}>{stats || `${meta} \u00B7 ${year}`}</span>
        </span>
      </Link>
    </article>
  );
}

const ALL_GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 27, name: 'Horror' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
  { id: 10759, name: 'Action & Adventure' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 10762, name: 'Kids' },
  { id: 10764, name: 'Reality' },
  { id: 99999, name: 'Anime' },
  { id: 88888, name: 'K-Drama' }
].sort((a, b) => a.name.localeCompare(b.name));

function useShelfScroll(itemsLength) {
  const [visibleCount, setVisibleCount] = useState(25);
  const rowRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const hasMoved = useRef(false);

  const handleMouseDown = (event) => {
    isDragging.current = true;
    hasMoved.current = false;
    startX.current = event.pageX - rowRef.current.offsetLeft;
    scrollLeft.current = rowRef.current.scrollLeft;
    rowRef.current.style.cursor = 'grabbing';
    rowRef.current.style.scrollBehavior = 'auto';
    rowRef.current.style.scrollSnapType = 'none';
  };

  const handleMouseMove = (event) => {
    if (!isDragging.current) return;
    const x = event.pageX - rowRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    if (Math.abs(walk) > 8) hasMoved.current = true;
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

  const handleClickCapture = (event) => {
    if (hasMoved.current) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const handleScroll = () => {
    if (!rowRef.current) return;
    const { scrollLeft: sLeft, clientWidth, scrollWidth } = rowRef.current;
    if (sLeft + clientWidth >= scrollWidth - 500) {
      setVisibleCount(prev => Math.min(prev + 25, itemsLength));
    }
  };

  return {
    visibleCount,
    rowRef,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUpOrLeave,
      onMouseLeave: handleMouseUpOrLeave,
      onScroll: handleScroll,
      onClickCapture: handleClickCapture,
      onDragStart: (event) => event.preventDefault(),
    },
  };
}

function GenreRow({ title, icon = null, items, forceRender }) {
  const { visibleCount, rowRef, handlers } = useShelfScroll(items?.length || 0);
  if (!items || items.length === 0) return null;

  return (
    <section className="shelf">
      <div className="shelf-head">
        <h2 className="shelf-title">
          {icon && <span className="shelf-icon">{icon}</span>}
          {title}
          <span className="count-pill">{items.length}</span>
        </h2>
        <span className="shelf-hint">Drag or scroll →</span>
      </div>
      <div ref={rowRef} className="shelf-row" {...handlers}>
        {items.slice(0, visibleCount).map((item, idx) => (
          <div key={`${item.id}-${idx}`} className="shelf-item">
            <PosterCard item={item} forceRender={forceRender} />
          </div>
        ))}
      </div>
    </section>
  );
}

function RecentlyWatchedRow({ items, forceRender, onClearAll, onRemove }) {
  const { visibleCount, rowRef, handlers } = useShelfScroll(items?.length || 0);
  if (!items || items.length === 0) return null;

  return (
    <section className="shelf shelf-recent">
      <div className="shelf-head">
        <h2 className="shelf-title">
          <span className="shelf-icon"><PlayIcon size={13} /></span>
          Recently Watched
          <span className="count-pill">{items.length}</span>
        </h2>
        <button type="button" className="ghost-button danger" onClick={onClearAll}>Clear all</button>
      </div>
      <div ref={rowRef} className="shelf-row" {...handlers}>
        {items.slice(0, visibleCount).map((item, idx) => (
          <div key={`${item.id}-${idx}`} className="shelf-item shelf-item-removable">
            <PosterCard item={item} forceRender={forceRender} />
            <button
              type="button"
              className="shelf-remove"
              aria-label={`Remove ${item.title} from watch history`}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onRemove(item);
              }}
            >
              <CloseIcon size={13} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function SkeletonGrid({ count = 12 }) {
  return (
    <div className="poster-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="poster-card skeleton-card">
          <span className="skeleton-poster" />
          <span className="skeleton-line" />
          <span className="skeleton-line short" />
        </div>
      ))}
    </div>
  );
}

export default function SelectionPage() {
  const [filterMediaType, setFilterMediaType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [, setRenderTrigger] = useState(0);
  const [displayLimit, setDisplayLimit] = useState(60);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [selectedSort, setSelectedSort] = useState('popular');
  const [personalizedRecs, setPersonalizedRecs] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [recentlyWatched, setRecentlyWatched] = useState([]);
  const [heroItems, setHeroItems] = useState([]);
  const [heroCycle, setHeroCycle] = useState(0);
  const forceRender = () => setRenderTrigger(prev => prev + 1);

  useEffect(() => {
    const history = getHistory();
    setRecentlyWatched(history.slice(0, 12));
  }, []);

  const handleRemoveFromHistory = (item) => {
    if (!confirm(`Remove "${item.title}" from watch history?`)) return;
    deleteFromHistory(item);
    setRecentlyWatched(prev => prev.filter(i => {
      if (item.mediaType === 'tv') return String(i.id) !== String(item.id);
      return i.id !== item.id;
    }));
    forceRender();
  };

  const handleClearAllHistory = () => {
    if (!confirm('Clear ALL watch history? This cannot be undone.')) return;
    clearAllHistory();
    setRecentlyWatched([]);
    forceRender();
  };

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
      if (!DEFAULT_TMDB_KEY || getCachedCatalog()) return;
      try {
        const remote = await fetchPopularCatalog(DEFAULT_TMDB_KEY);
        try { localStorage.setItem(TMDB_CACHE_KEY, JSON.stringify(remote)); } catch { /* cache is best effort */ }
        forceRender();
      } catch (err) {
        console.warn('Could not load the popular catalog from TMDB:', err.message);
      }
    };
    loadRemote();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim() || !DEFAULT_TMDB_KEY) {
      setSearchResults([]);
      setIsSearching(false);
      return undefined;
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
        console.error('Search error:', err);
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

  const heroPool = combinedItems.filter(item => item.poster && item.id);
  const heroPoolKey = `${heroPool.length}:${heroPool[0] ? heroItemKey(heroPool[0]) : ''}:${heroPool[heroPool.length - 1] ? heroItemKey(heroPool[heroPool.length - 1]) : ''}`;
  const heroPoolRef = useRef(heroPool);
  heroPoolRef.current = heroPool;

  useEffect(() => {
    const pool = heroPoolRef.current;
    if (!pool.length) {
      setHeroItems([]);
      return undefined;
    }

    let current = pickHeroSet(pool, HERO_CARD_COUNT);
    setHeroItems(current);
    setHeroCycle(0);

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    let timer;
    const rotate = () => {
      if (!document.hidden) {
        const next = pickHeroSet(pool, HERO_CARD_COUNT, new Set(current.map(heroItemKey)));
        if (next.length) {
          current = next;
          setHeroItems(next);
          setHeroCycle(cycle => cycle + 1);
        }
      }
      timer = setTimeout(rotate, HERO_INTERVAL_MS);
    };
    timer = setTimeout(rotate, HERO_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [heroPoolKey]);

  const genreName = ALL_GENRES.find(g => g.id === Number(selectedGenre))?.name;

  const hasActiveFilters = Boolean(searchQuery.trim() || selectedGenre || filterYear || filterMediaType !== 'all' || selectedSort !== 'popular');

  const resetFilters = () => {
    setSearchQuery('');
    setFilterMediaType('all');
    setSelectedGenre('');
    setFilterYear('');
    setSelectedSort('popular');
  };

  const resultsTitle = searchQuery.trim()
    ? `Results for “${searchQuery.trim()}”`
    : genreName
      ? `${genreName} titles`
      : 'Filtered catalog';

  return (
    <main className="selection-shell">
      <div className="home-ambient" aria-hidden="true">
        <span className="home-orb home-orb-a" />
        <span className="home-orb home-orb-b" />
        <span className="home-orb home-orb-c" />
      </div>

      <SiteHeader />

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Curated streaming library</p>
          <h1>Find something <em>worth watching.</em></h1>
          <p className="hero-lede">
            A calm library of movies and series. Search the catalog, browse a shelf, and press play.
          </p>

          <div className="hero-search">
            <span className="hero-search-icon"><SearchIcon size={19} /></span>
            <input
              type="search"
              placeholder="Search movies and TV shows…"
              aria-label="Search the catalog"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" className="hero-search-clear" aria-label="Clear search" onClick={() => setSearchQuery('')}>
                <CloseIcon size={14} />
              </button>
            )}
          </div>

        </div>

        {heroItems.length > 0 && (
          <div className="hero-art" aria-hidden="true">
            <div className="hero-strip">
              {heroItems.map((item, index) => (
                <Link
                  key={`${heroCycle}-${heroItemKey(item)}`}
                  to={buildPlayerHref(item)}
                  className="hero-poster"
                  tabIndex={-1}
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <img src={item.poster} alt="" loading="eager" draggable="false" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="browse-controls" aria-label="Search and filters">
        <div className="media-toggle" role="group" aria-label="Content type">
          {[
            { value: 'all', label: 'All' },
            { value: 'movie', label: 'Movies' },
            { value: 'tv', label: 'Series' },
          ].map(option => (
            <button
              key={option.value}
              type="button"
              className={`toggle-chip ${filterMediaType === option.value ? 'is-active' : ''}`}
              aria-pressed={filterMediaType === option.value}
              onClick={() => setFilterMediaType(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <label className="filter-field">
          <span>Genre</span>
          <select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)}>
            <option value="">All genres</option>
            {ALL_GENRES.map(genre => <option key={genre.id} value={genre.id}>{genre.name}</option>)}
          </select>
        </label>

        <label className="filter-field filter-year">
          <span>Year</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="Any"
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
          />
        </label>

        <label className="filter-field">
          <span>Sort</span>
          <select value={selectedSort} onChange={(e) => setSelectedSort(e.target.value)}>
            <option value="popular">Popularity</option>
            <option value="year-desc">Newest first</option>
            <option value="year-asc">Oldest first</option>
            <option value="alpha-asc">Title A–Z</option>
            <option value="alpha-desc">Title Z–A</option>
            <option value="rating-desc">Highest rated</option>
            <option value="rating-asc">Lowest rated</option>
          </select>
        </label>

        <button type="button" className="ghost-button reset-button" onClick={resetFilters} disabled={!hasActiveFilters}>
          Reset
        </button>
      </section>

      {!searchQuery.trim() && recentlyWatched.length > 0 && (
        <RecentlyWatchedRow
          items={recentlyWatched}
          forceRender={forceRender}
          onClearAll={handleClearAllHistory}
          onRemove={handleRemoveFromHistory}
        />
      )}

      {isGridView ? (
        <section className="results-section">
          <div className="section-head">
            <div>
              <p className="eyebrow">{searchQuery.trim() ? 'Search' : 'Browse'}</p>
              <h2>{resultsTitle} <span className="count-pill">{items.length}</span></h2>
              <p className="section-sub">
                {searchQuery.trim()
                  ? 'Results update as you type. Filters still apply.'
                  : 'Narrow the catalog with the controls above, or reset to see everything.'}
              </p>
            </div>
          </div>

          {isSearching ? (
            <SkeletonGrid />
          ) : displayedItems.length > 0 ? (
            <div className="poster-grid">
              {displayedItems.map((item, idx) => (
                <PosterCard key={`${item.mediaType}-${item.id}-${idx}`} item={item} forceRender={forceRender} />
              ))}
            </div>
          ) : (
            <div className="empty-panel">
              <p className="eyebrow">Nothing here</p>
              <h3>No titles match that combination.</h3>
              <p>Try loosening the year or genre filter, or start over.</p>
              <button type="button" className="primary-button" onClick={resetFilters}>Clear filters</button>
            </div>
          )}

          {items.length > displayLimit && !isSearching && (
            <div className="load-more">
              <button type="button" className="secondary-button" onClick={() => setDisplayLimit(prev => prev + 60)}>
                Load more <span className="count-pill">{Math.min(60, items.length - displayLimit)}</span>
              </button>
            </div>
          )}
        </section>
      ) : (
        <div className="shelf-stack">
          {personalizedRecs.length > 0 && (
            <GenreRow
              title="Because you watched"
              icon={<SparklesIcon size={15} />}
              items={personalizedRecs}
              forceRender={forceRender}
            />
          )}
          {loadingRecs && <p className="shelf-loading">Building recommendations…</p>}

          <GenreRow title="Trending now" items={items} forceRender={forceRender} />

          {ALL_GENRES.map(genre => (
            <GenreRow
              key={genre.id}
              title={genre.name}
              items={items.filter(item => item.genreIds?.includes(genre.id))}
              forceRender={forceRender}
            />
          ))}

          <section className="results-section results-all">
            <div className="section-head">
              <div>
                <p className="eyebrow">Everything</p>
                <h2>All titles <span className="count-pill">{items.length}</span></h2>
                <p className="section-sub">The full catalog, in popularity order.</p>
              </div>
            </div>
            <div className="poster-grid">
              {displayedItems.map((item, idx) => (
                <PosterCard key={`${item.mediaType}-${item.id}-${idx}`} item={item} forceRender={forceRender} />
              ))}
            </div>
            {items.length > displayLimit && (
              <div className="load-more">
                <button type="button" className="secondary-button" onClick={() => setDisplayLimit(prev => prev + 60)}>
                  Load more <span className="count-pill">{Math.min(60, items.length - displayLimit)}</span>
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
