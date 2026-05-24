import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getFavorites, getHistory, getProgressStore, getGlobalWatchTime,
  formatDuration, formatDate, getTitleFromEntry, toggleFavorite,
  FAVORITES_KEY, HISTORY_KEY, PROGRESS_KEY, WATCH_TIME_KEY
} from './app.js';
import './royal-theme.css';

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
  const [trigger, setTrigger] = useState(0);
  const forceRender = () => setTrigger(x => x + 1);

  const clearData = () => {
    [FAVORITES_KEY, HISTORY_KEY, PROGRESS_KEY, WATCH_TIME_KEY].forEach(k => localStorage.removeItem(k));
    forceRender();
  };

  const favorites = getFavorites();
  const history = getHistory();
  const progressItems = Object.values(getProgressStore()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  const continueItems = progressItems.filter(item => (item.progress || 0) < 95);

  return (
    <main className="profile-shell">
      <header className="page-header">
        <div><p className="eyebrow">FreeVid</p><h1>Profile</h1></div>
        <div className="header-actions">
          <Link className="secondary-button" to="/">Home</Link>
          <button onClick={clearData} className="secondary-button">Clear Data</button>
        </div>
      </header>
      <section className="stats-grid">
        <article className="stat-tile"><span>{favorites.length}</span><p>Favorites</p></article>
        <article className="stat-tile"><span>{history.length}</span><p>History</p></article>
        <article className="stat-tile"><span>{formatDuration(getGlobalWatchTime())}</span><p>Watch Time</p></article>
      </section>
      <section className="profile-section"><div className="section-header"><h2>Continue Watching</h2></div><ProfileList items={continueItems} emptyText="No active titles." /></section>
      <section className="profile-section"><div className="section-header"><h2>Favorites</h2></div><ProfileList items={favorites} emptyText="No favorites." allowRemove forceRender={forceRender} /></section>
    </main>
  );
}