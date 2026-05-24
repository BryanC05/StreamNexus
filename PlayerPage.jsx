import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  DEFAULT_TMDB_KEY, TMDB_API_URL, TMDB_IMAGE_URL, getTmdbHeaders,
  getTitleFromEntry, isFavorite, toggleFavorite, saveProgress,
  getSavedProgress, SERVER_KEY, readStore, writeStore, autoFetchSubtitles
} from './app.js';
import './royal-theme.css';

export default function PlayerPage() {
  const [params] = useSearchParams();
  const [mediaType, setMediaType] = useState(params.get('type') || 'movie');
  const [tmdbId, setTmdbId] = useState(params.get('id') || '1078605');
  const [title, setTitle] = useState(params.get('title') || 'Player');
  const [season, setSeason] = useState(params.get('season') || '1');
  const [episode, setEpisode] = useState(params.get('episode') || '1');
  const [server, setServer] = useState(() => {
    let saved = readStore(SERVER_KEY, "https://vidsrc.me/embed");
    if (saved.includes("vidsrc.net") || saved.includes("vidsrc.to") || saved.includes("embed.su")) saved = "https://vidsrc.me/embed";
    return saved;
  });
  const [color, setColor] = useState('#d4af37');
  const [progress, setProgress] = useState(params.get('progress') || '');
  const [autoPlay, setAutoPlay] = useState(false);
  const [lang, setLang] = useState(params.get('lang') || '');
  const [subtitles, setSubtitles] = useState(params.get('subtitles') || '');

  const [playerMeta, setPlayerMeta] = useState(mediaType === 'tv' ? `TV Series - TMDB ${tmdbId}` : `Movie - TMDB ${tmdbId}`);
  const [tvSeasons, setTvSeasons] = useState([]);
  const [episodesList, setEpisodesList] = useState([]);
  const [events, setEvents] = useState([]);
  const lastTimeRef = useRef(null);
  const [isFetchingSubs, setIsFetchingSubs] = useState(false);
  const [renderTrigger, setRenderTrigger] = useState(0);

  const getCurrentEntry = useCallback(() => {
    return getTitleFromEntry({ id: tmdbId, mediaType, title, season, episode });
  }, [tmdbId, mediaType, title, season, episode]);

  useEffect(() => {
    const handleMessage = (e) => {
      let parsed = e.data;
      if (typeof parsed === 'string') { try { parsed = JSON.parse(parsed); } catch { return; } }
      if (parsed?.type !== 'PLAYER_EVENT') return;
      const incomingTime = parsed.data?.currentTime ?? parsed.data?.timestamp;
      if (incomingTime === lastTimeRef.current) return;
      lastTimeRef.current = incomingTime;
      saveProgress(getCurrentEntry(), parsed.data || {});
      setEvents(prev => [JSON.stringify(parsed, null, 2), ...prev].slice(0, 8));
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [getCurrentEntry]);

  const handleFindSubtitles = () => {
    const entry = getCurrentEntry();
    let query = entry.title;
    if (mediaType !== 'tv' && entry.year) {
      query += ` ${entry.year}`;
    }
    window.open(`https://subdl.com/search/${encodeURIComponent(query)}`, '_blank');
  };

  const handleAutoFetchSubtitles = async () => {
    try {
      setIsFetchingSubs(true);
      const text = await autoFetchSubtitles(tmdbId, mediaType, season, episode);
      
      const blob = new Blob([text], { type: 'text/vtt' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = mediaType === 'tv' 
        ? `${title.replace(/[^a-zA-Z0-9]/g, '_')}_S${season}E${episode}.vtt`
        : `${title.replace(/[^a-zA-Z0-9]/g, '_')}_Subtitle.vtt`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setServer("https://www.vidking.net/embed");
      writeStore(SERVER_KEY, "https://www.vidking.net/embed");
      alert("Subtitle downloaded successfully! \n\nPlease click the 'CC' button inside the video player and select 'Upload' to apply it.");
    } catch (err) {
      console.error(err);
      alert(`Error fetching subtitles: ${err.message}`);
    } finally {
      setIsFetchingSubs(false);
    }
  };

  useEffect(() => {
    if (mediaType !== 'tv' || !DEFAULT_TMDB_KEY) return;
    fetch(`${TMDB_API_URL}/tv/${tmdbId}?language=en-US&api_key=${DEFAULT_TMDB_KEY}`, { headers: getTmdbHeaders(DEFAULT_TMDB_KEY) })
      .then(res => res.json())
      .then(data => {
        if (data.seasons) setTvSeasons(data.seasons);
        if (data.number_of_seasons) setPlayerMeta(`${data.number_of_seasons} Seasons | ${data.number_of_episodes} Episodes`);
        if (data.name) setTitle(data.name);
      });
  }, [tmdbId, mediaType]);

  useEffect(() => {
    if (mediaType !== 'tv' || !DEFAULT_TMDB_KEY) return;
    fetch(`${TMDB_API_URL}/tv/${tmdbId}/season/${season}?language=en-US&api_key=${DEFAULT_TMDB_KEY}`, { headers: getTmdbHeaders(DEFAULT_TMDB_KEY) })
      .then(res => res.json())
      .then(data => setEpisodesList(data.episodes || []));
  }, [tmdbId, season, mediaType]);

  const buildEmbedUrl = () => {
    let path = `${server}/movie/${tmdbId}`;
    if (mediaType === 'tv') path = `${server}/tv/${tmdbId}/${season}/${episode}`;
    const query = new URLSearchParams();
    if (color) query.set('color', color.replace('#', ''));
    if (autoPlay) query.set('autoPlay', 'true');
    if (Number(progress) > 0) query.set('progress', progress);
    if (lang) {
      query.set('lang', lang);
      query.set('ds_lang', lang);
    }
    if (subtitles) {
      query.set('subtitles', subtitles);
      query.set('sub', subtitles);
      query.set('cc', subtitles);
    }
    const qStr = query.toString();
    return qStr ? `${path}?${qStr}` : path;
  };

  const isFav = isFavorite(getCurrentEntry());
  const finalUrl = buildEmbedUrl();

  return (
    <main className="player-shell">
      <header className="player-topbar">
        <Link className="secondary-button" to="/">Home</Link>
        <div><p className="eyebrow">{playerMeta}</p><h1>{title}</h1></div>
        <div className="header-actions">
          <button className={`secondary-button ${isFav ? 'is-active' : ''}`} onClick={() => { toggleFavorite(getCurrentEntry()); setRenderTrigger(x => x+1); }}>{isFav ? 'Saved' : 'Favorite'}</button>
        </div>
      </header>

      <div className="player-frame-wrap" style={{ marginBottom: '2rem', width: '100%' }}>
        <iframe src={finalUrl} title="Player" frameBorder="0" allow="autoplay; fullscreen" allowFullScreen style={{width:'100%', height:'600px'}}></iframe>
      </div>

      <section className="watch-layout" style={{ display: 'block' }}>
        <aside className="player-sidebar" style={{ maxWidth: '100%' }}>
          <form className="control-grid">
            <fieldset className="mode-toggle">
              <legend>Content Type</legend>
              <label><input type="radio" checked={mediaType==='movie'} onChange={() => setMediaType('movie')} /><span>Movie</span></label>
              <label><input type="radio" checked={mediaType==='tv'} onChange={() => setMediaType('tv')} /><span>TV Series</span></label>
            </fieldset>
            <label className="field"><span>Server Provider</span>
              <select value={server} onChange={(e) => { setServer(e.target.value); writeStore(SERVER_KEY, e.target.value); }}>
                <option value="https://vidsrc.me/embed">VidSrc.me (Most Reliable)</option>
                <option value="https://vidsrc.in/embed">VidSrc.in</option>
                <option value="https://vidsrc.pm/embed">VidSrc.pm</option>
                <option value="https://www.vidking.net/embed">Vidking</option>
              </select>
            </label>
            <label className="field"><span>TMDB ID</span><input type="number" value={tmdbId} onChange={e => setTmdbId(e.target.value)} /></label>
            <label className="field"><span>Start Time</span><input type="number" value={progress} onChange={e => setProgress(e.target.value)} /></label>
          <label className="field"><span>Subtitle Lang</span><input type="text" placeholder="e.g. en" value={lang} onChange={e => setLang(e.target.value)} /></label>
          <label className="field"><span>Subtitle URL</span><input type="url" placeholder="External .vtt/.srt URL" value={subtitles} onChange={e => setSubtitles(e.target.value)} /></label>
            <div className="field">
              <span>Subtitles Helper</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="secondary-button" onClick={handleAutoFetchSubtitles} disabled={isFetchingSubs} style={{ flex: 1 }}>{isFetchingSubs ? "Downloading..." : "Download Subtitles"}</button>
                <button type="button" className="secondary-button" onClick={handleFindSubtitles} style={{ flex: 1 }}>Manual Search</button>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#aaa' }}>Instantly download subtitles, then upload them using the video player's CC button.</p>
            </div>
          </form>

          {mediaType === 'tv' && (
            <div id="episodeListContainer" style={{ width: '100%', marginTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3>Episodes</h3>
                {tvSeasons.length > 0 && (
                  <select className="visual-season-select" style={{background: '#131b2f', color: '#f8fafc', padding: '0.5rem'}} value={season} onChange={e => { setSeason(e.target.value); setEpisode(1); setProgress(''); }}>
                    {tvSeasons.filter(s => s.season_number > 0).map(s => <option key={s.season_number} value={s.season_number}>Season {s.season_number}</option>)}
                  </select>
                )}
              </div>

              {!DEFAULT_TMDB_KEY ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', border: '1px dashed #4361ee', borderRadius: '12px', color: '#94a3b8' }}>
                  <strong>Episodes List Unavailable</strong><br/>
                  To view episode names and thumbnails, please add a valid TMDB API Key to your <code>env.js</code> file.
                </div>
              ) : episodesList.length === 0 ? (
                <div style={{ padding: '1.5rem', color: '#94a3b8' }}>Loading episodes for Season {season}...</div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                  {episodesList.map(ep => (
                    <button key={ep.episode_number} onClick={() => { setEpisode(ep.episode_number); setProgress(''); window.scrollTo({top: 0, behavior: 'smooth'}); }} style={{ display: 'flex', gap: '1rem', padding: '0.75rem', background: Number(episode) === ep.episode_number ? '#1a2540' : '#131b2f', border: '1px solid #1e293b', textAlign: 'left', color: '#f8fafc', cursor: 'pointer', borderRadius: '12px' }}>
                      {ep.still_path ? <img src={`${TMDB_IMAGE_URL}/w342${ep.still_path}`} width="120" height="68" style={{objectFit:'cover', borderRadius: '8px'}} /> : <div style={{width: 120, height: 68, background:'#1e293b', borderRadius: '8px'}}></div>}
                      <div style={{ overflow: 'hidden' }}>
                        <h4 style={{ margin: '0 0 0.25rem 0' }}>{ep.episode_number}. {ep.name || 'TBA'}</h4>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ep.overview || "No description."}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <section className="events-panel" style={{ marginTop: '2rem' }}>
            <div className="output-header"><h2>Progress Events</h2><button className="secondary-button" type="button" onClick={() => setEvents([])}>Clear</button></div>
            <pre>{events.length > 0 ? events.join('\n\n') : 'Waiting for player events...'}</pre>
          </section>
        </aside>
      </section>
    </main>
  );
}