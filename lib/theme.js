import { useEffect, useState } from 'react';

export const THEME_STORAGE_KEY = 'streamnexus_active_theme';

export const AVAILABLE_THEMES = [
  {
    id: 'royal-theme',
    name: 'Air',
    description: 'Midnight sky through glass',
    palette: ['#000000', '#f5f5f5', '#426188'],
    themeColor: '#000000',
  },
  {
    id: 'minimal-light',
    name: 'Air Light',
    description: 'Paper canvas, ink chrome',
    palette: ['#f5f3ed', '#ffffff', '#1b1b1b'],
    themeColor: '#f5f3ed',
  },
  {
    id: 'modern-dark',
    name: 'Modern Dark',
    description: 'Slate sky, electric blue signal',
    palette: ['#070d14', '#f5f5f5', '#4f8cff'],
    themeColor: '#070d14',
  },
  {
    id: 'netflix-red',
    name: 'Netflix Red',
    description: 'Black canvas, red signal',
    palette: ['#080809', '#f5f5f5', '#e50914'],
    themeColor: '#080809',
  },
];

const THEME_BY_ID = new Map(AVAILABLE_THEMES.map(theme => [theme.id, theme]));

export function getThemeMeta(themeId) {
  return THEME_BY_ID.get(themeId) || AVAILABLE_THEMES[0];
}

export function getActiveTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return THEME_BY_ID.has(saved) ? saved : 'royal-theme';
  } catch {
    return 'royal-theme';
  }
}

export function setActiveTheme(themeId) {
  if (!THEME_BY_ID.has(themeId)) return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
  } catch {
    // Storage can be unavailable in private browsing; the theme still applies for this session.
  }
  const link = document.getElementById('theme-stylesheet');
  if (link) link.href = `/themes/${themeId}.css`;
  const meta = document.getElementById('theme-color');
  if (meta) meta.setAttribute('content', getThemeMeta(themeId).themeColor);
  window.dispatchEvent(new CustomEvent('theme-changed', { detail: { themeId } }));
}

export function useActiveTheme() {
  const [themeId, setThemeId] = useState(getActiveTheme);

  useEffect(() => {
    const onThemeChange = (event) => setThemeId(event.detail?.themeId || getActiveTheme());
    const onStorage = (event) => {
      if (event.key === THEME_STORAGE_KEY) setThemeId(getActiveTheme());
    };
    window.addEventListener('theme-changed', onThemeChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('theme-changed', onThemeChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return themeId;
}
