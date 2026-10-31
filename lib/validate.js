export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;
export const REVIEW_TEXT_LIMIT = 2000;
export const MAX_SYNC_ITEMS = 500;

const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;
const TIMESTAMP_SLACK_MS = 5 * 60 * 1000;

export function normalizeUsername(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function isValidUsername(username) {
  return USERNAME_PATTERN.test(username);
}

export function validatePassword(password) {
  if (typeof password !== 'string') return 'Password is required';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Password must be at most ${MAX_PASSWORD_LENGTH} characters`;
  }
  return '';
}

export function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeEntryList(list, limit = MAX_SYNC_ITEMS) {
  if (!Array.isArray(list)) return [];
  return list
    .filter(item => isPlainObject(item) && (typeof item.id === 'string' || typeof item.id === 'number'))
    .slice(0, limit);
}

export function sanitizeSyncPayload(body) {
  const payload = isPlainObject(body) ? body : {};
  const progress = {};
  if (isPlainObject(payload.progress)) {
    for (const [key, value] of Object.entries(payload.progress)) {
      if (Object.keys(progress).length >= MAX_SYNC_ITEMS) break;
      if (typeof key !== 'string' || key.length === 0 || key.length > 160) continue;
      if (isPlainObject(value)) progress[key] = value;
    }
  }

  const deleted = {};
  const now = Date.now();
  if (isPlainObject(payload.deleted)) {
    for (const [key, value] of Object.entries(payload.deleted)) {
      if (Object.keys(deleted).length >= MAX_SYNC_ITEMS) break;
      if (typeof key !== 'string' || key.length === 0 || key.length > 160) continue;
      const timestamp = Number(value);
      if (Number.isFinite(timestamp) && timestamp > 0 && timestamp <= now + TIMESTAMP_SLACK_MS) {
        deleted[key] = timestamp;
      }
    }
  }

  const watchTime = Number(payload.watchTime);
  const historyClearedAt = Number(payload.historyClearedAt);

  return {
    favorites: sanitizeEntryList(payload.favorites),
    history: sanitizeEntryList(payload.history),
    progress,
    deleted,
    watchTime: Number.isFinite(watchTime) && watchTime > 0 ? Math.floor(watchTime) : 0,
    historyClearedAt:
      Number.isFinite(historyClearedAt) && historyClearedAt > 0 && historyClearedAt <= now + TIMESTAMP_SLACK_MS
        ? historyClearedAt
        : 0,
  };
}

export function normalizeTmdbId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0 || id > 1e9) return null;
  return String(id);
}

export function validateReviewInput(body) {
  const payload = isPlainObject(body) ? body : {};
  const mediaType = payload.mediaType;
  if (mediaType !== 'movie' && mediaType !== 'tv') {
    return { error: 'mediaType must be "movie" or "tv"' };
  }
  const tmdbId = normalizeTmdbId(payload.tmdbId);
  if (!tmdbId) return { error: 'tmdbId must be a positive integer' };

  const rating = Number(payload.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { error: 'Rating must be a number between 1 and 5' };
  }

  const text = typeof payload.text === 'string' ? payload.text.trim().slice(0, REVIEW_TEXT_LIMIT) : '';
  return { mediaType, tmdbId, rating, text };
}
