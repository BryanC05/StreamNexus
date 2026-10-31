import { useState } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from './components/SiteHeader.jsx';
import ThemePicker from './components/ThemePicker.jsx';
import { ClockIcon, HeartIcon, StarIcon, TrashIcon, UserIcon } from './components/Icons.jsx';
import { setActiveTheme, useActiveTheme } from './lib/theme.js';
import {
  getFavorites, getHistory, getGlobalWatchTime,
  formatDuration, formatDate, getTitleFromEntry, toggleFavorite,
  FAVORITES_KEY, HISTORY_KEY, PROGRESS_KEY, WATCH_TIME_KEY, TOMBSTONES_KEY, HISTORY_CLEARED_KEY,
  getUsername, isLoggedIn, logout, apiRegister, apiLogin, apiClearCloud
} from './app.js';

function ProfileList({ items, emptyText, allowRemove, forceRender }) {
  if (!items || items.length === 0) return <p className="empty-state">{emptyText}</p>;
  return (
    <div className="profile-list">
      {items.map((item, idx) => {
        const n = getTitleFromEntry({ ...item, mediaType: item.mediaType || 'movie' });
        const url = `/player?type=${n.mediaType}&id=${n.id}&title=${encodeURIComponent(n.title)}&season=${n.season}&episode=${n.episode}`;
        return (
          <article key={idx} className="profile-item">
            <Link className="profile-item-link" to={url}>
              <img src={n.poster} alt={n.title} loading="lazy" />
              <span className="profile-item-copy">
                <strong>{n.title}</strong>
                <span>
                  {[
                    n.mediaType === 'tv' ? `S${n.season} · E${n.episode}` : 'Movie',
                    n.year,
                    formatDate(item.updatedAt || item.watchedAt)
                  ].filter(Boolean).join('  ·  ')}
                </span>
              </span>
            </Link>
            {allowRemove && (
              <button className="ghost-button danger compact-button" onClick={() => { toggleFavorite(n); forceRender(); }}>
                <TrashIcon size={14} /> Remove
              </button>
            )}
          </article>
        );
      })}
    </div>
  );
}

export default function ProfilePage() {
  const [, setTrigger] = useState(0);
  const forceRender = () => setTrigger(x => x + 1);
  const [activeTab, setActiveTab] = useState('favorites');
  const activeTheme = useActiveTheme();

  const [authMode, setAuthMode] = useState('login');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (authMode === 'login') {
        await apiLogin(usernameInput, passwordInput);
      } else {
        await apiRegister(usernameInput, passwordInput);
      }
      setUsernameInput('');
      setPasswordInput('');
      forceRender();
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    forceRender();
  };

  const clearData = async () => {
    if (!confirm('Are you sure you want to clear all data? This will also clear cloud sync data if logged in.')) return;
    if (isLoggedIn()) {
      await apiClearCloud().catch(() => {});
    }
    [FAVORITES_KEY, HISTORY_KEY, PROGRESS_KEY, WATCH_TIME_KEY, TOMBSTONES_KEY, HISTORY_CLEARED_KEY]
      .forEach(key => localStorage.removeItem(key));
    forceRender();
  };

  if (!isLoggedIn()) {
    return (
      <main className="profile-shell">
        <SiteHeader />
        <section className="auth-stage">
          <article className="auth-card">
            <header className="auth-card-head">
              <span className="auth-badge"><UserIcon size={16} /></span>
              <p className="eyebrow">StreamNexus Cinema</p>
              <h1 className="auth-card-title">{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
              <p className="auth-lede">
                {authMode === 'login'
                  ? 'Sign in to sync favorites, watch history and progress to the cloud.'
                  : 'Pick a username and a password of at least 8 characters to start syncing.'}
              </p>
            </header>

            <form onSubmit={handleAuthSubmit} className="auth-form">
              <label className="field">
                <span>Username</span>
                <input
                  type="text"
                  autoComplete="username"
                  required
                  placeholder="Enter username"
                  value={usernameInput}
                  onChange={e => setUsernameInput(e.target.value)}
                />
              </label>
              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                  minLength={8}
                  required
                  placeholder="At least 8 characters"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                />
              </label>

              {authError && <p className="form-error" role="alert">{authError}</p>}

              <button type="submit" className="primary-button auth-submit" disabled={authLoading}>
                {authLoading ? 'Verifying…' : authMode === 'login' ? 'Sign in' : 'Register'}
              </button>

              <p className="auth-switch">
                {authMode === 'login' ? 'New to StreamNexus?' : 'Already have an account?'}{' '}
                <button
                  type="button"
                  onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}
                >
                  {authMode === 'login' ? 'Create an account' : 'Sign in instead'}
                </button>
              </p>
            </form>

            <p className="auth-foot">No account needed to browse or use the player — sync is optional.</p>
          </article>
        </section>
      </main>
    );
  }

  const favorites = getFavorites();
  const history = getHistory();
  const username = getUsername();

  return (
    <main className="profile-shell">
      <SiteHeader
        actions={(
          <>
            <button type="button" className="ghost-button" onClick={handleLogout}>Sign out</button>
            <button type="button" className="ghost-button danger" onClick={clearData}>Clear data</button>
          </>
        )}
      />

      <section className="profile-hero">
        <span className="profile-avatar" aria-hidden="true">{username.slice(0, 1).toUpperCase()}</span>
        <div className="profile-identity">
          <p className="eyebrow">Signed in <span className="sync-dot" aria-hidden="true" /> Cloud synced</p>
          <h1>{username}</h1>
          <p>Your favorites, history and watch time follow you across devices.</p>
        </div>
      </section>

      <section className="stats-grid">
        <button
          type="button"
          className={`stat-tile ${activeTab === 'favorites' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('favorites')}
          aria-pressed={activeTab === 'favorites'}
        >
          <span className="stat-icon"><HeartIcon size={17} filled /></span>
          <strong>{favorites.length}</strong>
          <p>Favorites</p>
        </button>
        <button
          type="button"
          className={`stat-tile ${activeTab === 'history' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('history')}
          aria-pressed={activeTab === 'history'}
        >
          <span className="stat-icon"><ClockIcon size={17} /></span>
          <strong>{history.length}</strong>
          <p>History</p>
        </button>
        <article className="stat-tile stat-static">
          <span className="stat-icon"><StarIcon size={17} /></span>
          <strong>{formatDuration(getGlobalWatchTime())}</strong>
          <p>Watch time</p>
        </article>
      </section>

      <section className="profile-collections">
        <div className="collection-head">
          <div className="segmented" role="tablist" aria-label="Collections">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'favorites'}
              className={`toggle-chip ${activeTab === 'favorites' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('favorites')}
            >
              <HeartIcon size={14} /> Favorites <span className="count-pill">{favorites.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'history'}
              className={`toggle-chip ${activeTab === 'history' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <ClockIcon size={14} /> History <span className="count-pill">{history.length}</span>
            </button>
          </div>
        </div>

        {activeTab === 'favorites' ? (
          favorites.length === 0 ? (
            <div className="empty-panel">
              <p className="eyebrow">Nothing saved yet</p>
              <h3>Your favorites will live here.</h3>
              <p>Browse the catalog and tap the heart on anything you want to keep.</p>
              <Link className="primary-button" to="/">Browse the catalog</Link>
            </div>
          ) : (
            <div className="favorites-grid-5">
              {favorites.map((item, idx) => {
                const n = getTitleFromEntry({ ...item, mediaType: item.mediaType || 'movie' });
                const url = `/player?type=${n.mediaType}&id=${n.id}&title=${encodeURIComponent(n.title)}&season=${n.season}&episode=${n.episode}`;
                return (
                  <article key={idx} className="poster-card">
                    <span className="poster-media">
                      <Link className="poster-image-link" to={url}>
                        <img src={n.poster} alt={n.title} loading="lazy" />
                      </Link>
                      <button
                        className="favorite-button is-active"
                        type="button"
                        onClick={() => { toggleFavorite(n); forceRender(); }}
                        title="Remove from favorites"
                      >
                        <HeartIcon size={13} filled /> <span>Saved</span>
                      </button>
                    </span>
                    <Link className="poster-link" to={url}>
                      <span className="poster-copy">
                        <strong>{n.title}</strong>
                        <span>{[n.mediaType === 'tv' ? 'Series' : 'Movie', n.year].filter(Boolean).join(' · ')}</span>
                      </span>
                    </Link>
                  </article>
                );
              })}
            </div>
          )
        ) : (
          <ProfileList items={history} emptyText="Nothing watched yet. Your history appears here after you play something." forceRender={forceRender} />
        )}
      </section>

      <section className="appearance">
        <div className="appearance-head">
          <p className="eyebrow">Appearance</p>
          <h2>Choose your look</h2>
          <p>Themes apply instantly and are remembered on this device.</p>
        </div>
        <ThemePicker activeId={activeTheme} onPick={setActiveTheme} />
      </section>
    </main>
  );
}
