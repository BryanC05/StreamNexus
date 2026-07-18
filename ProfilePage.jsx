import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getFavorites, getHistory, getProgressStore, getGlobalWatchTime,
  formatDuration, formatDate, getTitleFromEntry, toggleFavorite,
  FAVORITES_KEY, HISTORY_KEY, PROGRESS_KEY, WATCH_TIME_KEY,
  getUsername, isLoggedIn, logout, apiRegister, apiLogin, apiClearCloud
} from './app.js';
import './royal-theme.css';

// Feature #8: Theme management
const AVAILABLE_THEMES = [
  { id: 'royal-theme', name: 'Royal Gold', description: 'Elegant gold & dark', icon: '👑' },
  { id: 'modern-dark', name: 'Modern Dark', description: 'Sleek blue accents', icon: '🌙' },
  { id: 'netflix-red', name: 'Netflix Red', description: 'Bold streaming style', icon: '🎬' },
  { id: 'minimal-light', name: 'Minimal Light', description: 'Clean & airy', icon: '☀️' }
];

const THEME_STORAGE_KEY = 'streamnexus_active_theme';

function getActiveTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) || 'royal-theme';
}

function setActiveTheme(themeId) {
  localStorage.setItem(THEME_STORAGE_KEY, themeId);
}

function ProfileList({ items, emptyText, allowRemove, forceRender }) {
  if (!items || items.length === 0) return <p className="empty-state">{emptyText}</p>;
  return (
    <div className="profile-list">
      {items.map((item, idx) => {
        const n = getTitleFromEntry({ ...item, mediaType: item.mediaType || "movie" });
        const url = `/player?type=${n.mediaType}&id=${n.id}&title=${encodeURIComponent(n.title)}&season=${n.season}&episode=${n.episode}`;
        return (
          <article key={idx} className="profile-item">
            <Link className="profile-item-link" to={url}>
              <img src={n.poster} alt={n.title} loading="lazy" />
              <span className="profile-item-copy">
                <strong>{n.title}</strong>
                <span>{[n.mediaType === "tv" ? `S${n.season} E${n.episode}` : "Movie", n.year, formatDate(item.updatedAt || item.watchedAt)].filter(Boolean).join(" | ")}</span>
              </span>
            </Link>
            {allowRemove && <button className="secondary-button compact-button" onClick={() => { toggleFavorite(n); forceRender(); }}>Remove</button>}
          </article>
        );
      })}
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [trigger, setTrigger] = useState(0);
  const forceRender = () => setTrigger(x => x + 1);
  const [activeTab, setActiveTab] = useState('favorites'); // 'favorites' or 'history'

  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
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
    if (confirm("Are you sure you want to clear all data? This will also clear cloud sync data if logged in.")) {
      if (isLoggedIn()) {
        await apiClearCloud().catch(() => {});
      }
      [FAVORITES_KEY, HISTORY_KEY, PROGRESS_KEY, WATCH_TIME_KEY].forEach(k => localStorage.removeItem(k));
      forceRender();
    }
  };

  // Auth Guard Screen
  if (!isLoggedIn()) {
    return (
      <main className="profile-shell" onClick={() => navigate('/')} style={{ display: 'grid', placeItems: 'center', minHeight: '80vh' }}>
        <article className="auth-parchment-scroll" onClick={(e) => e.stopPropagation()} style={{ display: 'block', width: '100%', maxWidth: '450px', padding: '2.5rem' }}>
          <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <p className="eyebrow">StreamNexus Cinema</p>
            <h1 className="auth-card-title">{authMode === 'login' ? 'Sign In' : 'Join Us'}</h1>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
              Sync your watch history and favorites to the cloud.
            </p>
          </header>
          
          <form onSubmit={handleAuthSubmit} className="control-grid">
            <label className="field">
              <span>Username</span>
              <input 
                type="text" 
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
                required 
                placeholder="Enter password" 
                value={passwordInput} 
                onChange={e => setPasswordInput(e.target.value)} 
              />
            </label>
            
            {authError && (
              <p style={{ color: '#ef4444', fontSize: '0.88rem', margin: '0', textAlign: 'center', fontWeight: '600' }}>
                ⚠️ {authError}
              </p>
            )}
            
            <button type="submit" className="primary-link" style={{ width: '100%', minHeight: '44px', marginTop: '0.5rem' }} disabled={authLoading}>
              {authLoading ? 'Verifying...' : authMode === 'login' ? 'Sign In' : 'Register'}
            </button>
            
            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
              {authMode === 'login' ? "New to StreamNexus?" : "Already have an account?"}{' '}
              <button 
                type="button" 
                onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }} 
                style={{ background: 'none', border: 'none', color: 'var(--gold)', textDecoration: 'underline', padding: 0, minHeight: 'auto', display: 'inline', cursor: 'pointer' }}
              >
                {authMode === 'login' ? 'Create an account' : 'Sign in here'}
              </button>
            </div>
          </form>
        </article>
      </main>
    );
  }

  const favorites = getFavorites();
  const history = getHistory();
  const progressItems = Object.values(getProgressStore()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  return (
    <main className="profile-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span>FreeVid</span>
            <span style={{ fontSize: '0.75rem', background: 'rgba(212,175,55,0.12)', border: '1px solid var(--gold-border)', padding: '2px 8px', borderRadius: '12px', textTransform: 'none' }}>Cloud Synced ✓</span>
          </p>
          <h1>Profile</h1>
        </div>
        <div className="header-actions">
          <Link className="secondary-button" to="/">Home</Link>
          <span style={{ fontSize: '0.9rem', color: 'var(--gold-light)', fontWeight: 'bold', marginRight: '5px' }}>👤 {getUsername()}</span>
          <button onClick={handleLogout} className="secondary-button">Sign Out</button>
          <button onClick={clearData} className="secondary-button" style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}>Clear Data</button>
        </div>
      </header>
      <section className="stats-grid">
        <article className={`stat-tile ${activeTab === 'favorites' ? 'is-active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setActiveTab('favorites')}>
          <span>{favorites.length}</span>
          <p>Favorites</p>
        </article>
        <article className={`stat-tile ${activeTab === 'history' ? 'is-active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setActiveTab('history')}>
          <span>{history.length}</span>
          <p>History</p>
        </article>
        <article className="stat-tile"><span>{formatDuration(getGlobalWatchTime())}</span><p>Watch Time</p></article>
      </section>

      <div className="profile-tabs" style={{ display: 'flex', gap: '12px', marginTop: '2rem', borderBottom: '1px solid var(--border-gold)', paddingBottom: '12px', marginBottom: '1.5rem' }}>
        <button 
          className={`secondary-button ${activeTab === 'favorites' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('favorites')}
          style={{ flex: 1, minWidth: '0' }}
        >
          Favorites ({favorites.length})
        </button>
        <button 
          className={`secondary-button ${activeTab === 'history' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('history')}
          style={{ flex: 1, minWidth: '0' }}
        >
          Watch History ({history.length})
        </button>
      </div>

      {activeTab === 'favorites' ? (
        <section className="profile-section" style={{ marginTop: '0' }}>
          {favorites.length === 0 ? (
            <p className="empty-state">No favorites.</p>
          ) : (
            <div className="favorites-grid-5">
              {favorites.map((item, idx) => {
                const n = getTitleFromEntry({ ...item, mediaType: item.mediaType || "movie" });
                const url = `/player?type=${n.mediaType}&id=${n.id}&title=${encodeURIComponent(n.title)}&season=${n.season}&episode=${n.episode}`;
                return (
                  <article key={idx} className="poster-card">
                    <span className="poster-media">
                      <Link className="poster-image-link" to={url}>
                        <img src={n.poster} alt={n.title} loading="lazy" style={{ width: '100%', aspectRatio: '2 / 3', objectFit: 'cover' }} />
                      </Link>
                      <button 
                        className="favorite-button is-active" 
                        type="button" 
                        onClick={() => { toggleFavorite(n); forceRender(); }}
                        title="Remove Favorite"
                      >
                        Remove
                      </button>
                    </span>
                    <Link className="poster-link" to={url}>
                      <span className="poster-copy">
                        <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</strong>
                        <span style={{ fontSize: '0.75rem' }}>{[n.mediaType === "tv" ? `TV Show` : "Movie", n.year].filter(Boolean).join(" \u00B7 ")}</span>
                      </span>
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <section className="profile-section" style={{ marginTop: '0' }}>
          <ProfileList items={history} emptyText="No watch history." forceRender={forceRender} />
        </section>
      )}

      {/* Feature #8: Theme Picker Section */}
      <section style={{ marginTop: '3rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>🎨Appearance</h2>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Choose your preferred theme</p>
        
        <div className="theme-picker-grid">
          {AVAILABLE_THEMES.map((theme) => {
            const isActive = getActiveTheme() === theme.id;
            return (
              <div
                key={theme.id}
                className={`theme-option ${isActive ? 'is-active' : ''}`}
                onClick={() => {
                  setActiveTheme(theme.id);
                  forceRender();
                  window.dispatchEvent(new CustomEvent('theme-changed', { detail: { themeId: theme.id } }));
                }}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveTheme(theme.id);
                    forceRender();
                    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { themeId: theme.id } }));
                  }
                }}
              >
                <div className="theme-preview" style={{ background: theme.id === 'minimal-light' ? '#f8f9fa' : '#1a1a1a', border: theme.id === 'minimal-light' ? '1px solid #dee2e6' : '1px solid #333' }}>
                  <span>{theme.icon}</span>
                </div>
                <div className="theme-name">{theme.name}</div>
                <div className="theme-description">{theme.description}</div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}