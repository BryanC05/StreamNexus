import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  DEFAULT_TMDB_KEY, TMDB_API_URL, TMDB_IMAGE_URL, getTmdbHeaders,
  getTitleFromEntry, isFavorite, toggleFavorite, saveProgress,
  getSavedProgress, SERVER_KEY, readStore, writeStore, autoFetchSubtitles,
  uploadSubtitleToTempHost,
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
  const [subUrl, setSubUrl] = useState(params.get('sub_url') || '');
  const [subtitleBlobUrl, setSubtitleBlobUrl] = useState('');
  const [subtitleText, setSubtitleText] = useState('');
  const [subtitleOffset, setSubtitleOffset] = useState(0);
  const [customVideoUrl, setCustomVideoUrl] = useState('');

  const [playerMeta, setPlayerMeta] = useState(mediaType === 'tv' ? `TV Series - TMDB ${tmdbId}` : `Movie - TMDB ${tmdbId}`);
  const [tvSeasons, setTvSeasons] = useState([]);
  const [episodesList, setEpisodesList] = useState([]);
  const [events, setEvents] = useState([]);
  const lastTimeRef = useRef(null);
  const videoRef = useRef(null);
  const [isFetchingSubs, setIsFetchingSubs] = useState(false);
  const [renderTrigger, setRenderTrigger] = useState(0);
  const [lightsOut, setLightsOut] = useState(false);
  const [movieDuration, setMovieDuration] = useState(7200); // default 2 hours (in seconds)
  const [tvDuration, setTvDuration] = useState(2700); // default 45 mins (in seconds)
  const localTimeRef = useRef(0);

  // Helper functions to parse, format, and shift WebVTT timestamps
  const parseVttTimestamp = (tStr) => {
    const parts = tStr.trim().split(':');
    let hrs = 0, mins = 0, secs = 0;
    if (parts.length === 3) {
      hrs = parseFloat(parts[0]);
      mins = parseFloat(parts[1]);
      secs = parseFloat(parts[2]);
    } else if (parts.length === 2) {
      mins = parseFloat(parts[0]);
      secs = parseFloat(parts[1]);
    }
    return hrs * 3600 + mins * 60 + secs;
  };

  const formatVttTimestamp = (seconds) => {
    if (seconds < 0) seconds = 0;
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  };

  const shiftVttLine = (line, offset) => {
    const parts = line.split('-->');
    if (parts.length !== 2) return line;
    
    const startStr = parts[0].trim();
    const rest = parts[1].trim().split(/\s+/);
    const endStr = rest[0];
    const settings = rest.slice(1).join(' ');
    
    const startTime = parseVttTimestamp(startStr);
    const endTime = parseVttTimestamp(endStr);
    
    const newStartStr = formatVttTimestamp(startTime + offset);
    const newEndStr = formatVttTimestamp(endTime + offset);
    
    return `${newStartStr} --> ${newEndStr}${settings ? ' ' + settings : ''}`;
  };

  const shiftWebVttText = (text, offset) => {
    if (offset === 0) return text;
    return text.split('\n').map(line => {
      if (line.includes('-->')) {
        return shiftVttLine(line, offset);
      }
      return line;
    }).join('\n');
  };

  const normalizeSubtitleText = (rawText) => {
    let text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    text = text.replace(/(^|\n)\s*\d+\s*\n(?=[ \t]*\d{2,}:\d{2}:\d{2})/g, '\n\n');
    text = text.replace(/([^\n])\n(?=[ \t]*\d{2,}:\d{2}:\d{2})/g, '$1\n\n');
    text = text.replace(/<\/?(?:i|b|u|font|color)[^>]*>/gi, '');
    
    const isVtt = text.startsWith("WEBVTT");
    if (!isVtt) {
      text = "WEBVTT\n\n" + text.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
    }
    return text;
  };

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

  // Sync localTimeRef with saved progress when current media entry changes
  useEffect(() => {
    const saved = getSavedProgress(getCurrentEntry());
    localTimeRef.current = saved?.currentTime || Number(params.get('progress') || 0);
  }, [getCurrentEntry, params]);

  // Local interval tracker to estimate playback progress on third-party cross-origin iframes
  useEffect(() => {
    if (server === 'custom') return;

    const saved = getSavedProgress(getCurrentEntry());
    localTimeRef.current = saved?.currentTime || Number(params.get('progress') || 0);

    const interval = setInterval(() => {
      if (document.hidden) return;

      localTimeRef.current += 5; // increment by 5s

      const duration = mediaType === 'tv' ? tvDuration : movieDuration;
      const progressPercent = (localTimeRef.current / duration) * 100;

      // Save progress to local storage and update history
      saveProgress(getCurrentEntry(), {
        currentTime: localTimeRef.current,
        duration: duration,
        progress: progressPercent
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [server, mediaType, tvDuration, movieDuration, getCurrentEntry, params]);

  useEffect(() => {
    if (!lightsOut) return;
    const handleEsc = (e) => { if (e.key === 'Escape') setLightsOut(false); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [lightsOut]);

  useEffect(() => {
    return () => {
      if (subtitleBlobUrl) URL.revokeObjectURL(subtitleBlobUrl);
    };
  }, [subtitleBlobUrl]);

  // Effect to process and generate new subtitle blobs when text or offset changes
  useEffect(() => {
    if (!subtitleText) return;
    
    const shiftedText = shiftWebVttText(subtitleText, subtitleOffset);
    const blob = new Blob([shiftedText], { type: 'text/vtt' });
    const newUrl = URL.createObjectURL(blob);
    
    setSubtitleBlobUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return newUrl;
    });
  }, [subtitleText, subtitleOffset]);

  // Effect to securely hot-swap subtitles in the Custom HTML5 Video Player
  useEffect(() => {
    if (!videoRef.current || !subtitleBlobUrl || server !== 'custom') return;
    const video = videoRef.current;
    
    // Clear previous DOM tracks
    const existing = video.querySelectorAll('track');
    existing.forEach(t => t.remove());
    
    // Disable any ghost tracks cached in the browser API
    if (video.textTracks) {
      for (let i = 0; i < video.textTracks.length; i++) {
        video.textTracks[i].mode = 'disabled';
      }
    }

    const track = document.createElement('track');
    track.kind = 'subtitles';
    track.label = 'English (Synced)';
    track.srclang = 'en';
    track.src = subtitleBlobUrl;
    
    video.appendChild(track);
    track.addEventListener('load', () => { if (track.track) track.track.mode = 'showing'; });
  }, [subtitleBlobUrl, server]);

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

      const isCustomPlayer = server === 'custom';
      if (!isCustomPlayer) {
        const filename = mediaType === 'tv' 
          ? `${title.replace(/[^a-zA-Z0-9]/g, '_')}_S${season}E${episode}.vtt`
          : `${title.replace(/[^a-zA-Z0-9]/g, '_')}_Subtitle.vtt`;
        
        // Only VidSrc servers support URL-based subtitle injection.
        const isVidsrc = server.includes('vidsrc');

        if (!isVidsrc) {
          // Download directly for Vidking and other third-party servers that don't support URL injection
          const blob = new Blob([text], { type: 'text/vtt' });
          const newUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = newUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(newUrl);
          alert("This provider (Vidking) does not support automatic subtitle injection.\n\nWe have downloaded the subtitle file to your device. Please click the CC/Subtitle button inside the player to upload it manually, or switch to a VidSrc provider.");
          return;
        }

        try {
          const uploadedUrl = await uploadSubtitleToTempHost(text, filename);
          setSubUrl(uploadedUrl); // Auto-injects URL and reloads the iframe
          alert("Subtitle auto-fetched and injected into the player successfully!");
        } catch (uploadErr) {
          const blob = new Blob([text], { type: 'text/vtt' });
          const newUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = newUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(newUrl);
          alert("Subtitle auto-apply failed. Downloaded locally instead! \n\nPlease upload it manually using the 'CC' button.");
        }
      } else {
        setSubtitleText(text);
        setSubtitleOffset(0);
        alert("Subtitles automatically generated and applied to your custom player!");
      }
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
        if (data.episode_run_time && data.episode_run_time.length > 0) {
          setTvDuration(data.episode_run_time[0] * 60);
        }
      });
  }, [tmdbId, mediaType]);

  useEffect(() => {
    if (mediaType !== 'movie' || !DEFAULT_TMDB_KEY) return;
    fetch(`${TMDB_API_URL}/movie/${tmdbId}?language=en-US&api_key=${DEFAULT_TMDB_KEY}`, { headers: getTmdbHeaders(DEFAULT_TMDB_KEY) })
      .then(res => res.json())
      .then(data => {
        if (data.runtime) {
          setMovieDuration(data.runtime * 60);
        }
        if (data.title) setTitle(data.title);
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
    if (subUrl) {
      query.set('sub_url', subUrl);
      query.set('sub_default', 'true');
    }
    const qStr = query.toString();
    return qStr ? `${path}?${qStr}` : path;
  };

  const isFav = isFavorite(getCurrentEntry());
  const finalUrl = buildEmbedUrl();

  const handleVideoTimeUpdate = (e) => {
    const video = e.target;
    if (!video.duration) return;
    const incomingTime = video.currentTime;
    if (lastTimeRef.current !== null && Math.abs(incomingTime - lastTimeRef.current) < 1) return;
    lastTimeRef.current = incomingTime;
    
    const payload = { currentTime: video.currentTime, duration: video.duration, progress: (video.currentTime / video.duration) * 100 };
    saveProgress(getCurrentEntry(), payload);
    
    setEvents(prev => [JSON.stringify({ type: 'PLAYER_EVENT', data: payload }, null, 2), ...prev].slice(0, 8));
  };

  const handleVideoLoaded = (e) => {
    const video = e.target;
    const saved = getSavedProgress(getCurrentEntry());
    if (saved?.currentTime && (!saved.progress || saved.progress < 95)) {
      video.currentTime = saved.currentTime;
    } else if (progress) {
      video.currentTime = Number(progress);
    }
  };

  return (
    <main className={`player-shell ${lightsOut ? 'lights-out' : ''}`}>
      {lightsOut && <div className="lights-out-overlay" onClick={() => setLightsOut(false)} />}
      <header className="player-topbar">
        <Link className="secondary-button" to="/">Home</Link>
        <div><p className="eyebrow">{playerMeta}</p><h1>{title}</h1></div>
        <div className="header-actions">
          <Link className="secondary-button" to="/profile">Profile</Link>
          <button className={`secondary-button ${lightsOut ? 'is-active' : ''}`} onClick={() => setLightsOut(lo => !lo)} title="Toggle Lights Out mode">💡 Lights {lightsOut ? 'On' : 'Out'}</button>
          <button className={`secondary-button ${isFav ? 'is-active' : ''}`} onClick={() => { toggleFavorite(getCurrentEntry()); setRenderTrigger(x => x+1); }}>{isFav ? 'Saved' : 'Favorite'}</button>
        </div>
      </header>

      {server === 'custom' ? (
        <div className="player-frame-wrap">
          <video ref={videoRef} controls autoPlay={autoPlay} className="player-video" src={customVideoUrl} onTimeUpdate={handleVideoTimeUpdate} onLoadedMetadata={handleVideoLoaded}>
            Your browser does not support the video tag.
          </video>
        </div>
      ) : (
        <div className="player-frame-wrap">
          <iframe src={finalUrl} title="Player" frameBorder="0" allow="autoplay; fullscreen" allowFullScreen className="player-iframe"></iframe>
        </div>
      )}

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
                <option value="custom">Custom HTML5 Player</option>
              </select>
            </label>
            {server === 'custom' && (
              <>
                <label className="field" style={{ gridColumn: '1 / -1' }}><span>Custom Video Source (Local File or Direct URL)</span>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="text" placeholder="https://example.com/video.mp4" value={customVideoUrl} onChange={e => setCustomVideoUrl(e.target.value)} style={{ flex: 1 }} />
                    <input type="file" accept="video/*" onChange={e => {
                      if (e.target.files.length > 0) setCustomVideoUrl(URL.createObjectURL(e.target.files[0]));
                    }} style={{ flex: 1 }} />
                  </div>
                </label>
                <label className="field" style={{ gridColumn: '1 / -1' }}><span>Upload Custom Subtitle File (SRT or VTT)</span>
                  <input type="file" accept=".vtt,.srt" onChange={e => {
                    if (e.target.files.length > 0) {
                      const file = e.target.files[0];
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const normalized = normalizeSubtitleText(evt.target.result);
                        setSubtitleText(normalized);
                        setSubtitleOffset(0);
                        alert("Custom subtitle loaded successfully!");
                      };
                      reader.readAsText(file);
                    }
                  }} />
                </label>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <span>Subtitle Sync / Delay Controls</span>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button type="button" className="secondary-button" onClick={() => setSubtitleOffset(prev => prev - 1.0)}>-1.0s</button>
                    <button type="button" className="secondary-button" onClick={() => setSubtitleOffset(prev => prev - 0.5)}>-0.5s</button>
                    <span style={{ flex: 1, textAlign: 'center', fontWeight: 'bold', fontSize: '1rem', color: 'var(--gold-light)' }}>
                      Offset: {subtitleOffset > 0 ? `+${subtitleOffset.toFixed(1)}` : `${subtitleOffset.toFixed(1)}`}s
                    </span>
                    <button type="button" className="secondary-button" onClick={() => setSubtitleOffset(prev => prev + 0.5)}>+0.5s</button>
                    <button type="button" className="secondary-button" onClick={() => setSubtitleOffset(prev => prev + 1.0)}>+1.0s</button>
                    <button type="button" className="secondary-button" onClick={() => setSubtitleOffset(0)}>Reset</button>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem' }}>Adjust timings if the subtitles start too early or late relative to the audio.</p>
                </div>
              </>
            )}
            <label className="field"><span>TMDB ID</span><input type="number" value={tmdbId} onChange={e => setTmdbId(e.target.value)} /></label>
            <label className="field"><span>Start Time</span><input type="number" value={progress} onChange={e => setProgress(e.target.value)} /></label>
            <label className="field"><span>External Subtitle URL</span><input type="url" placeholder="https://... (.vtt or .srt)" value={subUrl} onChange={e => setSubUrl(e.target.value)} /></label>
            <div className="field">
              <span>Subtitles Helper</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="secondary-button" onClick={handleAutoFetchSubtitles} disabled={isFetchingSubs} style={{ flex: 1 }}>{isFetchingSubs ? "Fetching..." : "Auto-Fetch Subtitles"}</button>
                <button type="button" className="secondary-button" onClick={handleFindSubtitles} style={{ flex: 1 }}>Manual Search</button>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem' }}>Instantly download subtitles, then upload them using the video player's CC button.</p>
            </div>
          </form>

          {mediaType === 'tv' && (
            <div id="episodeListContainer" style={{ width: '100%', marginTop: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Episodes</h3>
                </div>
                {tvSeasons.length > 0 && (
                  <div className="season-tabs-container" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', width: '100%', scrollSnapType: 'x mandatory' }}>
                    {tvSeasons.filter(s => s.season_number > 0).map(s => (
                      <button 
                        key={s.season_number}
                        type="button"
                        className={`secondary-button ${Number(season) === s.season_number ? 'is-active' : ''}`}
                        style={{ flex: '0 0 auto', scrollSnapAlign: 'start', minHeight: '38px', padding: '0 18px', fontSize: '0.85rem' }}
                        onClick={() => { setSeason(s.season_number); setEpisode(1); setProgress(''); }}
                      >
                        Season {s.season_number}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {!DEFAULT_TMDB_KEY ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', border: '1px dashed var(--gold)', borderRadius: '12px' }}>
                  <strong>Episodes List Unavailable</strong><br/>
                  To view episode names and thumbnails, please add a valid TMDB API Key to your <code>env.js</code> file.
                </div>
              ) : episodesList.length === 0 ? (
                <div style={{ padding: '1.5rem' }}>Loading episodes for Season {season}...</div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                  {episodesList.map(ep => (
                    <button key={ep.episode_number} onClick={() => { setEpisode(ep.episode_number); setProgress(''); window.scrollTo({top: 0, behavior: 'smooth'}); }} className={`episode-button ${Number(episode) === ep.episode_number ? 'is-active' : ''}`} style={{ display: 'flex', gap: '1rem', padding: '0.75rem', textAlign: 'left', cursor: 'pointer' }}>
                      {ep.still_path ? <img src={`${TMDB_IMAGE_URL}/w342${ep.still_path}`} width="120" height="68" style={{objectFit:'cover', borderRadius: '8px'}} /> : <div style={{width: 120, height: 68, borderRadius: '8px'}} className="episode-placeholder"></div>}
                      <div style={{ overflow: 'hidden' }}>
                        <h4 style={{ margin: '0 0 0.25rem 0' }}>{ep.episode_number}. {ep.name || 'TBA'}</h4>
                        <p style={{ margin: 0, fontSize: '0.8rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ep.overview || "No description."}</p>
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