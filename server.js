import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUser, saveUser, getReviews, saveReviews, persistenceMode } from './storage.js';
import { mergeSyncData } from './lib/sync.js';
import {
  normalizeUsername,
  isValidUsername,
  validatePassword,
  sanitizeSyncPayload,
  validateReviewInput,
  normalizeTmdbId,
} from './lib/validate.js';

const app = express();
const PORT = process.env.PORT || 5001;
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
const JWT_SECRET = process.env.JWT_SECRET || (isProduction ? '' : 'streamnexus_local_dev_only_secret');

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}
if (!isProduction && !process.env.JWT_SECRET) {
  console.warn('[server] Using an insecure development JWT secret. Set JWT_SECRET to avoid this warning.');
}
if (isProduction && persistenceMode === 'file') {
  console.warn(
    '[server] No KV store configured. Data written to the local filesystem will not survive cold starts. Set KV_REST_API_URL/KV_REST_API_TOKEN.'
  );
}

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : { origin: false }));
app.use(express.json({ limit: '200kb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cache-Control', 'no-store');
  next();
});

function rateLimit({ windowMs, max, message }) {
  const buckets = new Map();
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.reset <= now) buckets.delete(key);
    }
  }, windowMs);
  cleanup.unref?.();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || 'unknown';
    let bucket = buckets.get(key);
    if (!bucket || bucket.reset <= now) {
      bucket = { count: 0, reset: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((bucket.reset - now) / 1000)));
      return res.status(429).json({ error: message });
    }
    return next();
  };
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts. Please try again later.',
});
const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: 'Too many review submissions. Please try again later.',
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || !decoded || typeof decoded.username !== 'string') {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.username = decoded.username;
    return next();
  });
}

function signToken(username) {
  return jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });
}

function publicUser(user) {
  return {
    favorites: user.favorites || [],
    history: user.history || [],
    progress: user.progress || {},
    watchTime: user.watchTime || 0,
    deleted: user.deleted || {},
    historyClearedAt: user.historyClearedAt || 0,
  };
}

// --- AUTH ---

app.use('/api/auth', authLimiter);

app.post('/api/auth/register', async (req, res) => {
  const { password } = req.body || {};
  const username = normalizeUsername(req.body?.username);

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  if (!isValidUsername(username)) {
    return res.status(400).json({
      error: 'Username must be 3-24 characters using lowercase letters, numbers, or underscores',
    });
  }
  const passwordError = validatePassword(password);
  if (passwordError) return res.status(400).json({ error: passwordError });

  if (await getUser(username)) {
    return res.status(400).json({ error: 'Username is already taken' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    username,
    passwordHash,
    favorites: [],
    history: [],
    progress: {},
    watchTime: 0,
    deleted: {},
    historyClearedAt: 0,
    createdAt: new Date().toISOString(),
  };
  await saveUser(username, user);

  return res.json({ token: signToken(username), username });
});

app.post('/api/auth/login', async (req, res) => {
  const { password } = req.body || {};
  const username = normalizeUsername(req.body?.username);

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const user = await getUser(username);
  const passwordMatches = user ? await bcrypt.compare(String(password), user.passwordHash) : false;
  if (!user || !passwordMatches) {
    return res.status(400).json({ error: 'Invalid username or password' });
  }

  return res.json({ token: signToken(username), username: user.username || username });
});

app.get('/api/auth/verify', authenticateToken, async (req, res) => {
  const user = await getUser(req.username);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ username: user.username || req.username });
});

// --- CLOUD SYNC ---

app.get('/api/user/sync', authenticateToken, async (req, res) => {
  const user = await getUser(req.username);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json(publicUser(user));
});

app.post('/api/user/sync', authenticateToken, async (req, res) => {
  const user = await getUser(req.username);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const incoming = sanitizeSyncPayload(req.body);
  const merged = mergeSyncData(user, incoming);
  Object.assign(user, merged);
  await saveUser(req.username, user);

  return res.json(merged);
});

app.post('/api/user/clear', authenticateToken, async (req, res) => {
  const user = await getUser(req.username);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.favorites = [];
  user.history = [];
  user.progress = {};
  user.watchTime = 0;
  user.deleted = {};
  user.historyClearedAt = Date.now();
  await saveUser(req.username, user);

  return res.json({ success: true, historyClearedAt: user.historyClearedAt });
});

// --- REVIEWS ---

app.get('/api/reviews', async (req, res) => {
  const mediaType = req.query.mediaType;
  const tmdbId = normalizeTmdbId(req.query.tmdbId);
  if ((mediaType !== 'movie' && mediaType !== 'tv') || !tmdbId) {
    return res.status(400).json({ error: 'A valid mediaType and tmdbId are required' });
  }
  return res.json(await getReviews(`${mediaType}:${tmdbId}`));
});

app.post('/api/reviews', reviewLimiter, authenticateToken, async (req, res) => {
  const input = validateReviewInput(req.body);
  if (input.error) return res.status(400).json({ error: input.error });

  const user = await getUser(req.username);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const reviewKey = `${input.mediaType}:${input.tmdbId}`;
  const reviews = await getReviews(reviewKey);
  const review = {
    username: user.username || req.username,
    rating: input.rating,
    text: input.text,
    createdAt: new Date().toISOString(),
  };

  const existingIndex = reviews.findIndex(
    item => typeof item.username === 'string' && item.username.toLowerCase() === req.username
  );
  if (existingIndex !== -1) {
    reviews[existingIndex] = review;
  } else {
    reviews.push(review);
  }

  await saveReviews(reviewKey, reviews);
  return res.json({ success: true, reviews });
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  console.error('[server] Unhandled error:', err);
  return res.status(500).json({ error: 'Internal server error' });
});

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`StreamNexus Auth & Sync Server running on port ${PORT} (${persistenceMode} storage)`);
  });
}

export default app;
