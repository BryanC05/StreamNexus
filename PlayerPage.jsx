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
  const [params, setParams] = useSearchParams();
  const [mediaType, setMediaType] = useState('movie');
  const [tmdbId, setTmdbId] = useState('');
  const [title, setTitle] = useState('');
  const [season, setSeason] = useState('1');
  const [episode, setEpisode] = useState('1');
  const [server, setServer] = useState(() => {
    let saved = readStore(SERVER_KEY, "https://vidsrc.me/embed");
    if (saved.includes("vidsrc.net") || saved.includes("vidsrc.to") || saved.includes("embed.su")) saved = "https://vidsrc.me/embed";
    return saved;
  });
  const [color, setColor] = useState('#d4af37');
  const [autoPlay, setAutoPlay] = useState(false);
  const [subUrl, setSubUrl] = useState(params.get('sub_url') || '');
  const [subtitleBlobUrl, setSubtitleBlobUrl] = useState('');
  const [subtitleText, setSubtitleText] = useState('');
  const [subtitleOffset, setSubtitleOffset] = useState(0);
  const [subPosition, setSubPosition] = useState('');
  const [customVideoUrl, setCustomVideoUrl] = useState('');
  const [subtitleSize, setSubtitleSize] = useState(readStore('subtitle_size', '100%'));
  const [customDomain, setCustomDomain] = useState(() => readStore('custom_embed_domain', ''));

  useEffect(() => {
    writeStore('subtitle_size', subtitleSize);
  }, [subtitleSize]);

  useEffect(() => {
    writeStore('custom_embed_domain', customDomain);
  }, [customDomain]);

  // Sync state with URL search parameters to support hot-swapping and refreshes without blank screens
  useEffect(() => {
    const type = params.get('type');
    const id = params.get('id');
    const t = params.get('title');
    const s = params.get('season');
    const ep = params.get('episode');

    if (type) setMediaType(type);
    if (id) setTmdbId(id);
    if (t) setTitle(t);
    if (s) setSeason(s);
    if (ep) setEpisode(ep);
  }, [params]);

  const [playerMeta, setPlayerMeta] = useState('Loading metadata...');
  
  useEffect(() => {
    if (!tmdbId) return;
    setPlayerMeta(mediaType === 'tv' ? `TV Series - TMDB ${tmdbId}` : `Movie - TMDB ${tmdbId}`);
  }, [tmdbId, mediaType]);

  const [tvSeasons, setTvSeasons] = useState([]);
  const [episodesList, setEpisodesList] = useState([]);
  const [events, setEvents] = useState([]);
  const lastTimeRef = useRef(null);
  const videoRef = useRef(null);
  const [isFetchingSubs, setIsFetchingSubs] = useState(false);
  const [renderTrigger, setRenderTrigger] = useState(0);
  const [lightsOut, setLightsOut] = useState(false);
  const [showSubtitleTools, setShowSubtitleTools] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('sync'); // 'sync', 'stretch', 'clean', 'replace', 'export'
  const [timeStretchFactor, setTimeStretchFactor] = useState('1.000000');
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
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

  const stretchVttLine = (line, multiplier) => {
    const parts = line.split('-->');
    if (parts.length !== 2) return line;
    
    const startStr = parts[0].trim();
    const rest = parts[1].trim().split(/\s+/);
    const endStr = rest[0];
    const settings = rest.slice(1).join(' ');
    
    const startTime = parseVttTimestamp(startStr);
    const endTime = parseVttTimestamp(endStr);
    
    const newStartStr = formatVttTimestamp(startTime * multiplier);
    const newEndStr = formatVttTimestamp(endTime * multiplier);
    
    return `${newStartStr} --> ${newEndStr}${settings ? ' ' + settings : ''}`;
  };

  const stretchWebVttText = (text, multiplier) => {
    if (multiplier === 1) return text;
    return text.split('\n').map(line => {
      if (line.includes('-->')) {
        return stretchVttLine(line, multiplier);
      }
      return line;
    }).join('\n');
  };

  const cleanSdhFromText = (text) => {
    let cleaned = text.replace(/\[[^\]\n]*\]/g, '');
    cleaned = cleaned.replace(/\([^)\n]*\)/g, '');
    cleaned = cleaned.replace(/^[A-Z0-9\s-_]{2,}:\s*/gm, '');
    cleaned = cleaned.replace(/[♪♫#]/g, '');
    
    const lines = cleaned.split('\n');
    const newLines = [];
    let isInsideCue = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('-->')) {
        newLines.push(line);
        isInsideCue = true;
      } else if (line.trim() === '') {
        newLines.push(line);
        isInsideCue = false;
      } else {
        const trimmed = line.trim();
        if (isInsideCue) {
          if (trimmed !== '') {
            newLines.push(line);
          }
        } else {
          newLines.push(line);
        }
      }
    }
    return newLines.join('\n');
  };

  const convertTextCase = (text, type) => {
    const lines = text.split('\n');
    let isInsideCue = false;
    const newLines = lines.map(line => {
      if (line.includes('-->')) {
        isInsideCue = true;
        return line;
      }
      if (line.trim() === '') {
        isInsideCue = false;
        return line;
      }
      if (isInsideCue) {
        if (type === 'upper') {
          return line.toUpperCase();
        } else if (type === 'lower') {
          return line.toLowerCase();
        } else if (type === 'sentence') {
          return line.toLowerCase().replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());
        }
      }
      return line;
    });
    return newLines.join('\n');
  };

  const findAndReplaceInText = (text, findStr, replaceStr) => {
    if (!findStr) return text;
    const lines = text.split('\n');
    let isInsideCue = false;
    const newLines = lines.map(line => {
      if (line.includes('-->')) {
        isInsideCue = true;
        return line;
      }
      if (line.trim() === '') {
        isInsideCue = false;
        return line;
      }
      if (isInsideCue) {
        const escapedFind = findStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(escapedFind, 'gi');
        return line.replace(regex, replaceStr);
      }
      return line;
    });
    return newLines.join('\n');
  };

  const convertVttToSrt = (vttText) => {
    let srtText = vttText.replace(/^WEBVTT\s*\n*/i, '');
    const lines = srtText.split('\n');
    let srtLines = [];
    let cueIndex = 1;
    let isInsideCue = false;
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (line.includes('-->')) {
        const formattedTime = line.replace(/\./g, ',');
        srtLines.push(String(cueIndex));
        srtLines.push(formattedTime);
        cueIndex++;
        isInsideCue = true;
      } else {
        srtLines.push(line);
      }
    }
    return srtLines.join('\n');
  };

  const adjustVttLinePosition = (lineStr, linePos) => {
    if (!linePos) return lineStr;
    const parts = lineStr.split('-->');
    if (parts.length !== 2) return lineStr;
    
    const startStr = parts[0].trim();
    const rest = parts[1].trim().split(/\s+/);
    const endStr = rest[0];
    
    const otherSettings = rest.slice(1).filter(s => !s.startsWith('line:'));
    return `${startStr} --> ${endStr} line:${linePos}${otherSettings.length > 0 ? ' ' + otherSettings.join(' ') : ''}`;
  };

  const applyVttPositioning = (text, linePos) => {
    if (!linePos) return text;
    return text.split('\n').map(line => {
      if (line.includes('-->')) {
        return adjustVttLinePosition(line, linePos);
      }
      return line;
    }).join('\n');
  };

  const downloadCustomSubtitle = (format = 'vtt') => {
    if (!subtitleText) return;
    let filename = mediaType === 'tv' 
      ? `${title.replace(/[^a-zA-Z0-9]/g, '_')}_S${season}E${episode}`
      : `${title.replace(/[^a-zA-Z0-9]/g, '_')}_Subtitle`;
      
    let processedText = shiftWebVttText(subtitleText, subtitleOffset);
    const factorNum = parseFloat(timeStretchFactor);
    if (!isNaN(factorNum) && factorNum !== 1.0) {
      processedText = stretchWebVttText(processedText, factorNum);
    }
    if (subPosition) {
      processedText = applyVttPositioning(processedText, subPosition);
    }
    
    let downloadText = processedText;
    let mimeType = 'text/vtt';
    if (format === 'srt') {
      downloadText = convertVttToSrt(processedText);
      filename += '.srt';
      mimeType = 'text/plain';
    } else {
      filename += '.vtt';
    }
    
    const blob = new Blob([downloadText], { type: mimeType });
    const newUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = newUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(newUrl);
  };

  const normalizeSubtitleText = (rawText) => {
    let text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Strip curly braces style tags like {\an8}, {/an8}, {y:i}, etc.
    text = text.replace(/\{[^}]*\}/g, '');

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
    
    let processedText = shiftWebVttText(subtitleText, subtitleOffset);
    const factorNum = parseFloat(timeStretchFactor);
    if (!isNaN(factorNum) && factorNum !== 1.0) {
      processedText = stretchWebVttText(processedText, factorNum);
    }
    if (subPosition) {
      processedText = applyVttPositioning(processedText, subPosition);
    }
    const blob = new Blob([processedText], { type: 'text/vtt' });
    const newUrl = URL.createObjectURL(blob);
    
    setSubtitleBlobUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return newUrl;
    });
  }, [subtitleText, subtitleOffset, subPosition, timeStretchFactor]);

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
      setSubtitleText(text);
      setSubtitleOffset(0);
      setSubPosition('');

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
          alert("This provider (Vidking) does not support automatic subtitle injection.\n\nWe have downloaded the subtitle file to your device. Please click the CC/Subtitle button inside the player to upload it manually. You can adjust the offset/position and click 'Download Subtitles' to save it again.");
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

  const handleNextEpisode = () => {
    if (mediaType !== 'tv') return;
    const currentEpisodeNum = Number(episode);
    const currentSeasonNum = Number(season);
    
    const nextEpExists = episodesList.some(ep => ep.episode_number === currentEpisodeNum + 1);
    if (nextEpExists) {
      const nextEp = currentEpisodeNum + 1;
      setEpisode(String(nextEp));
      const newParams = new URLSearchParams(params);
      newParams.set('episode', String(nextEp));
      setParams(newParams);
      window.scrollTo({top: 0, behavior: 'smooth'});
    } else {
      const nextSeasonExists = tvSeasons.some(s => s.season_number === currentSeasonNum + 1);
      if (nextSeasonExists) {
        const nextSeason = currentSeasonNum + 1;
        setSeason(String(nextSeason));
        setEpisode('1');
        const newParams = new URLSearchParams(params);
        newParams.set('season', String(nextSeason));
        newParams.set('episode', '1');
        setParams(newParams);
        window.scrollTo({top: 0, behavior: 'smooth'});
      } else {
        alert("You have reached the end of the series!");
      }
    }
  };

  const getNextEpisodeLabel = () => {
    const currentEpisodeNum = Number(episode);
    const currentSeasonNum = Number(season);
    const nextEpExists = episodesList.some(ep => ep.episode_number === currentEpisodeNum + 1);
    if (nextEpExists) {
      return `Play Next Episode (S${season}E${currentEpisodeNum + 1})`;
    }
    const nextSeasonExists = tvSeasons.some(s => s.season_number === currentSeasonNum + 1);
    if (nextSeasonExists) {
      return `Play Season ${currentSeasonNum + 1} Episode 1`;
    }
    return "End of Series";
  };

  const buildEmbedUrl = () => {
    const activeServer = server === 'custom_domain' ? customDomain : server;
    let path = `${activeServer}/movie/${tmdbId}`;
    if (mediaType === 'tv') path = `${activeServer}/tv/${tmdbId}/${season}/${episode}`;
    const query = new URLSearchParams();
    if (color) query.set('color', color.replace('#', ''));
    if (autoPlay) query.set('autoPlay', 'true');
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
    }
  };

  return (
    <main className={`player-shell ${lightsOut ? 'lights-out' : ''}`}>
      <style>{`
        video::cue {
          font-size: ${subtitleSize} !important;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      {lightsOut && <div className="lights-out-overlay" onClick={() => setLightsOut(false)} />}
      <header className="player-topbar">
        <Link className="secondary-button" to="/">Home</Link>
        <div><p className="eyebrow">{playerMeta}</p><h1>{title}</h1></div>
        <div className="header-actions">
          {mediaType === 'tv' && (
            <button type="button" className="secondary-button" style={{ borderColor: 'var(--gold)', color: 'var(--gold-light)' }} onClick={handleNextEpisode}>
              ⏭️ Next Episode
            </button>
          )}
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
          <iframe 
            src={finalUrl} 
            title="Player" 
            frameBorder="0" 
            allow="autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" 
            allowFullScreen={true}
            webkitallowfullscreen="true"
            mozallowfullscreen="true"
            className="player-iframe"
          ></iframe>
        </div>
      )}

      {mediaType === 'tv' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '-1rem auto 1.5rem', maxWidth: '1920px', padding: '0 8px' }}>
          <button 
            type="button" 
            className="secondary-button" 
            style={{ borderColor: 'var(--gold)', background: 'rgba(212, 175, 55, 0.05)', color: 'var(--gold-light)' }} 
            onClick={handleNextEpisode}
            disabled={getNextEpisodeLabel() === "End of Series"}
          >
            ⏭️ {getNextEpisodeLabel()}
          </button>
        </div>
      )}

      <section className="watch-layout" style={{ display: 'block' }}>
        <aside className="player-sidebar" style={{ maxWidth: '100%' }}>
          <form className="control-grid">
            <label className="field"><span>Server Provider</span>
              <select value={server} onChange={(e) => { setServer(e.target.value); writeStore(SERVER_KEY, e.target.value); }}>
                <optgroup label="Standard Multiservers">
                  <option value="https://vidsrc.me/embed">VidSrc.me (Most Reliable)</option>
                  <option value="https://vidsrc.in/embed">VidSrc.in</option>
                  <option value="https://vidsrc.pm/embed">VidSrc.pm</option>
                  <option value="https://www.vidking.net/embed">Vidking</option>
                </optgroup>
                <optgroup label="Advanced Players">
                  <option value="custom_domain">Custom Embed Domain...</option>
                  <option value="custom">Custom HTML5 Video Player</option>
                </optgroup>
              </select>
            </label>
            {server === 'custom_domain' && (
              <label className="field" style={{ gridColumn: '1 / -1' }}>
                <span>Custom Embed Server URL (e.g. https://domain.xyz/embed)</span>
                <input 
                  type="url" 
                  placeholder="https://myprovider.to/embed" 
                  value={customDomain} 
                  onChange={(e) => setCustomDomain(e.target.value)} 
                />
              </label>
            )}
            {server === 'custom' && (
              <label className="field" style={{ gridColumn: '1 / -1' }}><span>Custom Video Source (Local File or Direct URL)</span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" placeholder="https://example.com/video.mp4" value={customVideoUrl} onChange={e => setCustomVideoUrl(e.target.value)} style={{ flex: 1 }} />
                  <input type="file" accept="video/*" onChange={e => {
                    if (e.target.files.length > 0) setCustomVideoUrl(URL.createObjectURL(e.target.files[0]));
                  }} style={{ flex: 1 }} />
                </div>
              </label>
            )}
            <label className="field"><span>TMDB ID</span><input type="number" value={tmdbId} onChange={e => setTmdbId(e.target.value)} /></label>
            <label className="field"><span>External Subtitle URL</span><input type="url" placeholder="https://... (.vtt or .srt)" value={subUrl} onChange={e => setSubUrl(e.target.value)} /></label>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <span>Subtitles Helper</span>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <button type="button" className="secondary-button" onClick={handleAutoFetchSubtitles} disabled={isFetchingSubs} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {isFetchingSubs ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="10"/></svg>
                      <span>Fetching...</span>
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.886L4.202 9l5.886 1.912L12 16.798l1.912-5.886 5.886-1.912-5.886-1.912zm0 13.798 1.912 5.886L19.798 21l-5.886-1.912L12 13.202zm-8.298 4.7L5.886 21 12 19.088l-5.886-1.912z"/></svg>
                      <span>Auto-Fetch</span>
                    </>
                  )}
                </button>
                <button type="button" className="secondary-button" onClick={handleFindSubtitles} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <span>Manual Search</span>
                </button>
              </div>
              
              <label style={{ display: 'block', margin: '8px 0 12px 0', cursor: 'pointer' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#ccc', marginBottom: '4px' }}>Upload Custom Subtitle File (SRT or VTT)</span>
                <input type="file" accept=".vtt,.srt" onChange={e => {
                  if (e.target.files.length > 0) {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      const normalized = normalizeSubtitleText(evt.target.result);
                      setSubtitleText(normalized);
                      setSubtitleOffset(0);
                      setSubPosition('');
                      alert("Custom subtitle loaded successfully!");
                    };
                    reader.readAsText(file);
                  }
                }} style={{ fontSize: '0.8rem', display: 'block', width: '100%', padding: '6px', background: '#111', border: '1px dashed rgba(212, 175, 55, 0.4)', borderRadius: '4px', color: '#aaa' }} />
              </label>

              <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem' }}>Instantly download subtitles, then upload them using the video player's CC button.</p>

              <button 
                type="button" 
                className="secondary-button" 
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '10px 14px', border: '1px solid rgba(212, 175, 55, 0.4)', background: 'rgba(212, 175, 55, 0.05)', color: 'var(--gold-light)', marginBottom: '8px' }} 
                onClick={() => setShowSubtitleTools(!showSubtitleTools)}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                  <span>Subtitle Tools & Sync Resources</span>
                </span>
                <span>{showSubtitleTools ? '▲' : '▼'}</span>
              </button>

              {showSubtitleTools && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  marginBottom: '12px',
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--gold-light)' }}>Sync & Auto-Align Subtitles</strong>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text)', opacity: 0.9 }}>
                        <a href="https://github.com/smacke/ffsubsync" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'underline' }}>ffsubsync</a>: AI-driven automatic sync that aligns subtitles with the video audio track using voice activity detection (VAD).
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text)', opacity: 0.9 }}>
                        <a href="https://subshifter.imk.co/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'underline' }}>Subshifter</a>: Quick online tool to shift or offset subtitle files by a constant delay.
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text)', opacity: 0.9 }}>
                        <a href="https://github.com/pujis/autosubsync" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'underline' }}>AutoSubSync</a>: Open-source automatic subtitle synchronization client.
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text)', opacity: 0.9 }}>
                        <a href="https://github.com/joaquim-m/autosubsync-mpv" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'underline' }}>autosubsync-mpv</a>: MPV player plugin to automatically sync subtitles with audio using ffsubsync.
                      </div>
                    </div>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--gold-light)' }}>Subtitle Editors</strong>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text)', opacity: 0.9 }}>
                        <a href="https://www.nikse.dk/subtitleedit" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'underline' }}>Subtitle Edit</a>: Powerful open-source subtitle editor for timing adjustments, translation, and fixing errors.
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text)', opacity: 0.9 }}>
                        <a href="https://www.google.com/search?q=DST+subtitle+editor" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'underline' }}>DST</a>: Community recommended tool for subtitle translation and editing workflows.
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text)', opacity: 0.9 }}>
                        <a href="https://github.com/Aegisub/Aegisub" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'underline' }}>Aegisub</a>: Advanced subtitle editor focused on styling, typesetting, and audio waveform synchronization.
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text)', opacity: 0.9 }}>
                        <a href="https://terosubtitler.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'underline' }}>Tero Subtitler</a>: Modern, fast, and feature-rich subtitle editor for creating and syncing captions.
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text)', opacity: 0.9 }}>
                        <a href="https://sourceforge.net/projects/subtitle-workshop-classic/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'underline' }}>Subtitle Workshop Classic</a>: Complete, efficient, and convenient subtitle editing tool.
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text)', opacity: 0.9 }}>
                        <a href="https://www.jubler.org/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'underline' }}>Jubler</a>: Java-based subtitle editor for editing, converting, and correcting text subtitles.
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text)', opacity: 0.9 }}>
                        <a href="https://subtitld.org/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'underline' }}>Subtitld</a>: Modern subtitle editor with timeline-based visual editing.
                      </div>
                    </div>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--gold-light)' }}>Online Subtitle Tools</strong>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text)', opacity: 0.9 }}>
                        <a href="https://subtitletools.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'underline' }}>Subtitle Tools</a>: Collection of online tools to sync, convert (SRT/VTT/ASS), merge, clean up, and split subtitles.
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text)', opacity: 0.9 }}>
                        <a href="https://elsubtitle.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'underline' }}>elSubtitle</a>: Online subtitle translator, converter, and encoder supporting multiple formats.
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text)', opacity: 0.9 }}>
                        <a href="https://elsubtitle.com/converter" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'underline' }}>SubConverter</a>: Quick online conversion between common subtitle formats.
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text)', opacity: 0.9 }}>
                        <a href="https://subtitleone.cc/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'underline' }}>Subtitle One</a>: Convert text-based or image-based subtitles to SRT/WebVTT.
                      </div>
                    </div>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--gold-light)' }}>External Players & Extensions</strong>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text)', opacity: 0.9 }}>
                        <a href="https://substital.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'underline' }}>Substital</a>: Browser extension to inject external subtitle files (.srt/.vtt) directly into online video players.
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text)', opacity: 0.9 }}>
                        <a href="https://chrome.google.com/webstore/search/movie%20subtitles" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'underline' }}>Movie-Subtitles</a>: Chrome extension designed to load custom subtitles into arbitrary video streams.
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text)', opacity: 0.9 }}>
                        <a href="https://github.com/neveraway/penguin-subtitle-player" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'underline' }}>Penguin Subtitle Player</a>: A floating, semi-transparent subtitle player window that overlays on top of video streams.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', marginTop: '8px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--gold-light)' }}>Customize Subtitles</span>
                
                {/* Tab Selector */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '8px', gap: '4px', overflowX: 'auto', paddingBottom: '8px' }}>
                  <button type="button" onClick={() => setActiveSubTab('sync')} style={{ 
                    flex: '0 0 auto', 
                    minHeight: '32px', 
                    fontSize: '0.8rem', 
                    padding: '6px 12px', 
                    background: activeSubTab === 'sync' ? 'rgba(212, 175, 55, 0.15)' : 'transparent', 
                    color: activeSubTab === 'sync' ? 'var(--gold-light)' : '#aaa', 
                    borderColor: activeSubTab === 'sync' ? 'var(--gold)' : 'transparent',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '4px',
                    border: '1px solid',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span>Sync</span>
                  </button>
                  <button type="button" onClick={() => setActiveSubTab('style')} style={{ 
                    flex: '0 0 auto', 
                    minHeight: '32px', 
                    fontSize: '0.8rem', 
                    padding: '6px 12px', 
                    background: activeSubTab === 'style' ? 'rgba(212, 175, 55, 0.15)' : 'transparent', 
                    color: activeSubTab === 'style' ? 'var(--gold-light)' : '#aaa', 
                    borderColor: activeSubTab === 'style' ? 'var(--gold)' : 'transparent',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '4px',
                    border: '1px solid',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    <span>Style</span>
                  </button>
                  <button type="button" onClick={() => setActiveSubTab('stretch')} style={{ 
                    flex: '0 0 auto', 
                    minHeight: '32px', 
                    fontSize: '0.8rem', 
                    padding: '6px 12px', 
                    background: activeSubTab === 'stretch' ? 'rgba(212, 175, 55, 0.15)' : 'transparent', 
                    color: activeSubTab === 'stretch' ? 'var(--gold-light)' : '#aaa', 
                    borderColor: activeSubTab === 'stretch' ? 'var(--gold)' : 'transparent',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '4px',
                    border: '1px solid',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16"/><path d="M17 9l3 3-3 3"/><path d="M7 9l-3 3 3 3"/></svg>
                    <span>Stretch</span>
                  </button>
                  <button type="button" onClick={() => setActiveSubTab('clean')} style={{ 
                    flex: '0 0 auto', 
                    minHeight: '32px', 
                    fontSize: '0.8rem', 
                    padding: '6px 12px', 
                    background: activeSubTab === 'clean' ? 'rgba(212, 175, 55, 0.15)' : 'transparent', 
                    color: activeSubTab === 'clean' ? 'var(--gold-light)' : '#aaa', 
                    borderColor: activeSubTab === 'clean' ? 'var(--gold)' : 'transparent',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '4px',
                    border: '1px solid',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.886L4.202 9l5.886 1.912L12 16.798l1.912-5.886 5.886-1.912-5.886-1.912zm0 13.798 1.912 5.886L19.798 21l-5.886-1.912L12 13.202zm-8.298 4.7L5.886 21 12 19.088l-5.886-1.912z"/></svg>
                    <span>Clean</span>
                  </button>
                  <button type="button" onClick={() => setActiveSubTab('replace')} style={{ 
                    flex: '0 0 auto', 
                    minHeight: '32px', 
                    fontSize: '0.8rem', 
                    padding: '6px 12px', 
                    background: activeSubTab === 'replace' ? 'rgba(212, 175, 55, 0.15)' : 'transparent', 
                    color: activeSubTab === 'replace' ? 'var(--gold-light)' : '#aaa', 
                    borderColor: activeSubTab === 'replace' ? 'var(--gold)' : 'transparent',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '4px',
                    border: '1px solid',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 21-4-4 4-4"/><path d="M21 21v-2a4 4 0 0 0-4-4H3"/><path d="m17 3 4 4-4 4"/><path d="M3 3v2a4 4 0 0 0 4 4h14"/></svg>
                    <span>Replace</span>
                  </button>
                  <button type="button" onClick={() => setActiveSubTab('export')} style={{ 
                    flex: '0 0 auto', 
                    minHeight: '32px', 
                    fontSize: '0.8rem', 
                    padding: '6px 12px', 
                    background: activeSubTab === 'export' ? 'rgba(212, 175, 55, 0.15)' : 'transparent', 
                    color: activeSubTab === 'export' ? 'var(--gold-light)' : '#aaa', 
                    borderColor: activeSubTab === 'export' ? 'var(--gold)' : 'transparent',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '4px',
                    border: '1px solid',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    <span>Export</span>
                  </button>
                </div>

                {/* Tab contents */}
                {activeSubTab === 'sync' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px', color: '#ccc' }}>Sync Delay</span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button type="button" className="secondary-button" style={{ padding: '4px 8px', fontSize: '0.8rem', minHeight: '30px' }} onClick={() => setSubtitleOffset(prev => prev - 1.0)}>-1.0s</button>
                        <button type="button" className="secondary-button" style={{ padding: '4px 8px', fontSize: '0.8rem', minHeight: '30px' }} onClick={() => setSubtitleOffset(prev => prev - 0.5)}>-0.5s</button>
                        <span style={{ flex: 1, textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--gold-light)' }}>
                          Offset: {subtitleOffset > 0 ? `+${subtitleOffset.toFixed(1)}` : `${subtitleOffset.toFixed(1)}`}s
                        </span>
                        <button type="button" className="secondary-button" style={{ padding: '4px 8px', fontSize: '0.8rem', minHeight: '30px' }} onClick={() => setSubtitleOffset(prev => prev + 0.5)}>+0.5s</button>
                        <button type="button" className="secondary-button" style={{ padding: '4px 8px', fontSize: '0.8rem', minHeight: '30px' }} onClick={() => setSubtitleOffset(prev => prev + 1.0)}>+1.0s</button>
                        <button type="button" className="secondary-button" style={{ padding: '4px 8px', fontSize: '0.8rem', minHeight: '30px' }} onClick={() => setSubtitleOffset(0)}>Reset</button>
                      </div>
                    </div>
                  </div>
                )}

                {activeSubTab === 'style' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#ccc' }}>Subtitle Size (Custom Player Only)</span>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input 
                          type="range" 
                          min="50" 
                          max="300" 
                          step="10" 
                          value={parseInt(subtitleSize) || 100} 
                          onChange={(e) => setSubtitleSize(`${e.target.value}%`)} 
                          style={{ flex: 1, accentColor: 'var(--gold)' }}
                        />
                        <span style={{ fontSize: '0.9rem', fontWeight: 'bold', minWidth: '45px', textAlign: 'right', color: 'var(--gold-light)' }}>
                          {subtitleSize}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px', color: '#ccc' }}>Vertical Position</span>
                      <select value={subPosition} onChange={(e) => setSubPosition(e.target.value)} style={{ width: '100%', padding: '8px', fontSize: '0.85rem', background: '#111', color: '#fff', border: '1px solid var(--gold)', borderRadius: '4px' }}>
                        <option value="">Default (Player Bottom)</option>
                        <optgroup label="Percentage from Top (VidSrc / Custom Player)">
                          <option value="90%">90% (Slightly Raised)</option>
                          <option value="85%">85% (Raised)</option>
                          <option value="80%">80% (Highly Raised)</option>
                          <option value="75%">75% (Very High)</option>
                          <option value="70%">70% (Upper Middle)</option>
                          <option value="60%">60% (Lower Middle)</option>
                          <option value="50%">50% (Center Screen)</option>
                          <option value="10%">10% (Top of Screen)</option>
                        </optgroup>
                        <optgroup label="Line Offset (Highly Recommended for Vidking)">
                          <option value="-2">Raised 1 Line (line:-2)</option>
                          <option value="-3">Raised 2 Lines (line:-3)</option>
                          <option value="-4">Raised 3 Lines (line:-4)</option>
                          <option value="-5">Raised 4 Lines (line:-5)</option>
                          <option value="-6">Raised 5 Lines (line:-6)</option>
                          <option value="-7">Raised 6 Lines (line:-7)</option>
                          <option value="-8">Raised 7 Lines (line:-8)</option>
                          <option value="-9">Raised 8 Lines (line:-9)</option>
                          <option value="-10">Raised 10 Lines (line:-10)</option>
                          <option value="-15">Raised 15 Lines (line:-15)</option>
                        </optgroup>
                      </select>
                    </div>
                  </div>
                )}

                {activeSubTab === 'stretch' && (
                  !subtitleText ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#888', border: '1px dashed rgba(255, 255, 255, 0.15)', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#ccc' }}>Subtitles Required</span>
                      <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8, maxWidth: '240px', lineHeight: '1.4' }}>Drift/stretch adjustment requires loaded subtitles. Please auto-fetch or upload a file first.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#ccc' }}>Fix drifting subtitles. Adjust speed factor to stretch/shrink timings.</span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input 
                          type="number" 
                          step="0.000001" 
                          value={timeStretchFactor} 
                          onChange={(e) => setTimeStretchFactor(e.target.value)} 
                          style={{ flex: 1, padding: '6px 10px', fontSize: '0.85rem', background: '#111', color: '#fff', border: '1px solid var(--border)', borderRadius: '4px', minHeight: '36px' }}
                        />
                        <button type="button" className="secondary-button" style={{ minHeight: '36px', fontSize: '0.8rem' }} onClick={() => setTimeStretchFactor('1.000000')}>Reset</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                        <button type="button" className="secondary-button" style={{ minHeight: '30px', fontSize: '0.75rem', padding: '2px' }} onClick={() => setTimeStretchFactor('0.959040')}>{"25 ➔ 23.976"}</button>
                        <button type="button" className="secondary-button" style={{ minHeight: '30px', fontSize: '0.75rem', padding: '2px' }} onClick={() => setTimeStretchFactor('1.042709')}>{"23.976 ➔ 25"}</button>
                        <button type="button" className="secondary-button" style={{ minHeight: '30px', fontSize: '0.75rem', padding: '2px' }} onClick={() => setTimeStretchFactor('1.001000')}>NTSC Speedup</button>
                      </div>
                    </div>
                  )
                )}

                {activeSubTab === 'clean' && (
                  !subtitleText ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#888', border: '1px dashed rgba(255, 255, 255, 0.15)', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#ccc' }}>Subtitles Required</span>
                      <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8, maxWidth: '240px', lineHeight: '1.4' }}>SDH cleaning and case conversion require loaded subtitles. Please auto-fetch or upload a file first.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#ccc' }}>Clean hearing-impaired SDH captions (e.g. `[music]`, `(gasp)`) or format text case.</span>
                      <button 
                        type="button" 
                        className="secondary-button" 
                        style={{ fontSize: '0.85rem', padding: '8px', width: '100%', borderColor: 'var(--gold)', background: 'rgba(212, 175, 55, 0.05)' }} 
                        onClick={() => {
                          const cleaned = cleanSdhFromText(subtitleText);
                          setSubtitleText(cleaned);
                          alert("Hearing-impaired descriptors (SDH) cleaned successfully!");
                        }}
                      >
                        🧹 Clean Hearing Impaired (SDH)
                      </button>

                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button type="button" className="secondary-button" style={{ flex: 1, minHeight: '32px', fontSize: '0.75rem' }} onClick={() => { setSubtitleText(convertTextCase(subtitleText, 'upper')); alert("Converted to UPPERCASE!"); }}>UPPERCASE</button>
                        <button type="button" className="secondary-button" style={{ flex: 1, minHeight: '32px', fontSize: '0.75rem' }} onClick={() => { setSubtitleText(convertTextCase(subtitleText, 'lower')); alert("Converted to lowercase!"); }}>lowercase</button>
                        <button type="button" className="secondary-button" style={{ flex: 1, minHeight: '32px', fontSize: '0.75rem' }} onClick={() => { setSubtitleText(convertTextCase(subtitleText, 'sentence')); alert("Converted to Sentence case!"); }}>Sentence case</button>
                      </div>
                    </div>
                  )
                )}

                {activeSubTab === 'replace' && (
                  !subtitleText ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#888', border: '1px dashed rgba(255, 255, 255, 0.15)', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#ccc' }}>Subtitles Required</span>
                      <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8, maxWidth: '240px', lineHeight: '1.4' }}>Find & Replace requires loaded subtitles. Please auto-fetch or upload a file first.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#ccc' }}>Find and replace terms within the loaded subtitles.</span>
                      <input 
                        type="text" 
                        placeholder="Find text..." 
                        value={findText} 
                        onChange={(e) => setFindText(e.target.value)} 
                        style={{ padding: '6px 10px', fontSize: '0.85rem', background: '#111', color: '#fff', border: '1px solid var(--border)', borderRadius: '4px', minHeight: '36px' }}
                      />
                      <input 
                        type="text" 
                        placeholder="Replace with..." 
                        value={replaceText} 
                        onChange={(e) => setReplaceText(e.target.value)} 
                        style={{ padding: '6px 10px', fontSize: '0.85rem', background: '#111', color: '#fff', border: '1px solid var(--border)', borderRadius: '4px', minHeight: '36px' }}
                      />
                      <button 
                        type="button" 
                        className="secondary-button" 
                        style={{ fontSize: '0.85rem', padding: '8px', borderColor: 'var(--gold)', background: 'rgba(212, 175, 55, 0.05)' }} 
                        disabled={!findText}
                        onClick={() => {
                          const replaced = findAndReplaceInText(subtitleText, findText, replaceText);
                          setSubtitleText(replaced);
                          alert(`Replaced all occurrences of "${findText}" with "${replaceText}"!`);
                          setFindText('');
                          setReplaceText('');
                        }}
                      >
                        🔄 Replace All
                      </button>
                    </div>
                  )
                )}

                {activeSubTab === 'export' && (
                  !subtitleText ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#888', border: '1px dashed rgba(255, 255, 255, 0.15)', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#ccc' }}>Subtitles Required</span>
                      <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8, maxWidth: '240px', lineHeight: '1.4' }}>Exporting requires loaded subtitles. Please auto-fetch or upload a file first.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#ccc' }}>Download the customized subtitle file to your device in either WebVTT or SRT format.</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          type="button" 
                          className="secondary-button" 
                          style={{ flex: 1, fontSize: '0.85rem', padding: '8px', borderColor: 'var(--gold)', background: 'rgba(212, 175, 55, 0.05)' }} 
                          onClick={() => downloadCustomSubtitle('vtt')}
                        >
                          💾 Download .VTT
                        </button>
                        <button 
                          type="button" 
                          className="secondary-button" 
                          style={{ flex: 1, fontSize: '0.85rem', padding: '8px', borderColor: 'var(--gold)', background: 'rgba(212, 175, 55, 0.05)' }} 
                          onClick={() => downloadCustomSubtitle('srt')}
                        >
                          💾 Download .SRT
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
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