export const MAX_HISTORY_ITEMS = 80;
export const TOMBSTONE_TTL_MS = 90 * 24 * 60 * 60 * 1000;
export const MAX_TOMBSTONES = 500;

export function contentKey(entry) {
  if (!entry || entry.id === undefined || entry.id === null) return '';
  if (entry.mediaType === 'tv') {
    return `tv:${entry.id}:s${entry.season || 1}:e${entry.episode || 1}`;
  }
  return `movie:${entry.id}`;
}

export function historyKey(entry) {
  if (!entry || entry.id === undefined || entry.id === null) return '';
  return entry.mediaType === 'tv' ? `tv:${entry.id}` : `movie:${entry.id}`;
}

export function favoriteTombstoneKey(entry) {
  const key = contentKey(entry);
  return key ? `fav:${key}` : '';
}

export function historyTombstoneKey(entry) {
  const key = historyKey(entry);
  return key ? `hist:${key}` : '';
}

function timestampOf(entry) {
  const raw = entry?.watchedAt ?? entry?.savedAt ?? entry?.updatedAt ?? 0;
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

function mergeTombstones(first, second, now) {
  const merged = {};
  for (const source of [first, second]) {
    for (const [key, value] of Object.entries(source || {})) {
      const timestamp = Number(value) || 0;
      if (timestamp > 0 && timestamp > (merged[key] || 0)) merged[key] = timestamp;
    }
  }
  for (const [key, timestamp] of Object.entries(merged)) {
    if (now - timestamp > TOMBSTONE_TTL_MS) delete merged[key];
  }
  const entries = Object.entries(merged).sort((a, b) => b[1] - a[1]).slice(0, MAX_TOMBSTONES);
  return Object.fromEntries(entries);
}

export function mergeSyncData(existing = {}, incoming = {}, now = Date.now()) {
  const deleted = mergeTombstones(existing.deleted, incoming.deleted, now);
  const historyClearedAt = Math.max(
    Number(existing.historyClearedAt) || 0,
    Number(incoming.historyClearedAt) || 0
  );

  const favorites = new Map();
  const addFavorite = (item) => {
    if (!item || item.id === undefined || item.id === null) return;
    const key = contentKey(item);
    const timestamp = timestampOf(item);
    const tombstoneKey = favoriteTombstoneKey(item);
    if (deleted[tombstoneKey] && timestamp <= deleted[tombstoneKey]) return;
    const previous = favorites.get(key);
    if (!previous || timestamp >= timestampOf(previous)) favorites.set(key, item);
  };
  (existing.favorites || []).forEach(addFavorite);
  (incoming.favorites || []).forEach(addFavorite);

  const history = new Map();
  const addHistory = (item) => {
    if (!item || item.id === undefined || item.id === null) return;
    const timestamp = timestampOf(item);
    if (historyClearedAt && timestamp <= historyClearedAt) return;
    const tombstoneKey = historyTombstoneKey(item);
    if (deleted[tombstoneKey] && timestamp <= deleted[tombstoneKey]) return;
    const key = historyKey(item);
    const previous = history.get(key);
    if (!previous || timestamp >= timestampOf(previous)) history.set(key, item);
  };
  (existing.history || []).forEach(addHistory);
  (incoming.history || []).forEach(addHistory);

  const progress = { ...(existing.progress || {}) };
  for (const [key, value] of Object.entries(incoming.progress || {})) {
    if (!value || typeof value !== 'object') continue;
    const previous = progress[key];
    if (!previous || (Number(value.updatedAt) || 0) >= (Number(previous.updatedAt) || 0)) {
      progress[key] = value;
    }
  }

  // A re-added or re-watched item supersedes its tombstone.
  for (const item of favorites.values()) {
    const key = favoriteTombstoneKey(item);
    if (deleted[key] && timestampOf(item) > deleted[key]) delete deleted[key];
  }
  for (const item of history.values()) {
    const key = historyTombstoneKey(item);
    if (deleted[key] && timestampOf(item) > deleted[key]) delete deleted[key];
  }

  return {
    favorites: Array.from(favorites.values()),
    history: Array.from(history.values())
      .sort((a, b) => timestampOf(b) - timestampOf(a))
      .slice(0, MAX_HISTORY_ITEMS),
    progress,
    watchTime: Math.max(Number(existing.watchTime) || 0, Number(incoming.watchTime) || 0),
    deleted,
    historyClearedAt,
  };
}
