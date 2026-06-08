import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;
const DB_FILE = path.join(__dirname, 'database.json');
const JWT_SECRET = process.env.JWT_SECRET || 'streamnexus_secret_key_1337';

app.use(cors());
app.use(express.json());

// Initialize file database
function getDb() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: {} }, null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (err) {
    console.error('Error reading database file, resetting:', err);
    const emptyDb = { users: {} };
    fs.writeFileSync(DB_FILE, JSON.stringify(emptyDb, null, 2));
    return emptyDb;
  }
}

function saveDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access token required' });
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.username = decoded.username;
    next();
  });
}

// --- API ROUTES ---

// Registration
app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  
  const cleanUsername = username.trim().toLowerCase();
  if (cleanUsername.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters' });
  }

  const db = getDb();
  if (db.users[cleanUsername]) {
    return res.status(400).json({ error: 'Username is already taken' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  db.users[cleanUsername] = {
    username: username.trim(),
    passwordHash,
    favorites: [],
    history: [],
    progress: {},
    watchTime: 0,
    createdAt: new Date().toISOString()
  };

  saveDb(db);

  const token = jwt.sign({ username: cleanUsername }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, username: username.trim() });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const cleanUsername = username.trim().toLowerCase();
  const db = getDb();
  const user = db.users[cleanUsername];

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(400).json({ error: 'Invalid username or password' });
  }

  const token = jwt.sign({ username: cleanUsername }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, username: user.username });
});

// Verify token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  const db = getDb();
  const user = db.users[req.username];
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ username: user.username });
});

// Cloud Sync - Fetch Data
app.get('/api/user/sync', authenticateToken, (req, res) => {
  const db = getDb();
  const user = db.users[req.username];
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({
    favorites: user.favorites || [],
    history: user.history || [],
    progress: user.progress || {},
    watchTime: user.watchTime || 0
  });
});

// Helper to get unique identifier for movies/episodes
function getContentKey(entry) {
  if (entry.mediaType === 'tv') {
    return `tv:${entry.id}:s${entry.season || 1}:e${entry.episode || 1}`;
  }
  return `movie:${entry.id}`;
}

// Cloud Sync - Merge & Save Data
app.post('/api/user/sync', authenticateToken, (req, res) => {
  const { favorites = [], history = [], progress = {}, watchTime = 0 } = req.body;
  const db = getDb();
  const user = db.users[req.username];
  if (!user) return res.status(404).json({ error: 'User not found' });

  // 1. Merge Favorites (unique by mediaType + ID)
  const mergedFavsMap = new Map();
  // Add server favorites first
  (user.favorites || []).forEach(item => {
    mergedFavsMap.set(getContentKey(item), item);
  });
  // Add client favorites (overwriting or appending)
  favorites.forEach(item => {
    mergedFavsMap.set(getContentKey(item), item);
  });
  user.favorites = Array.from(mergedFavsMap.values());

  // 2. Merge Progress (keep the one with the latest updatedAt timestamp)
  const mergedProgress = { ...(user.progress || {}) };
  Object.keys(progress).forEach(key => {
    const clientItem = progress[key];
    const serverItem = mergedProgress[key];
    if (!serverItem || (clientItem.updatedAt || 0) > (serverItem.updatedAt || 0)) {
      mergedProgress[key] = clientItem;
    }
  });
  user.progress = mergedProgress;

  // 3. Merge History (merge based on watchedAt time)
  const mergedHistoryMap = new Map();
  (user.history || []).forEach(item => {
    mergedHistoryMap.set(getContentKey(item), item);
  });
  history.forEach(item => {
    const existing = mergedHistoryMap.get(getContentKey(item));
    if (!existing || (item.watchedAt || 0) > (existing.watchedAt || 0)) {
      mergedHistoryMap.set(getContentKey(item), item);
    }
  });
  user.history = Array.from(mergedHistoryMap.values())
    .sort((a, b) => (b.watchedAt || 0) - (a.watchedAt || 0))
    .slice(0, 80);

  // 4. Merge Watch Time (take the maximum of both to avoid losing progress)
  user.watchTime = Math.max(user.watchTime || 0, watchTime || 0);

  saveDb(db);

  res.json({
    favorites: user.favorites,
    history: user.history,
    progress: user.progress,
    watchTime: user.watchTime
  });
});

// Clear user data on cloud
app.post('/api/user/clear', authenticateToken, (req, res) => {
  const db = getDb();
  const user = db.users[req.username];
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.favorites = [];
  user.history = [];
  user.progress = {};
  user.watchTime = 0;

  saveDb(db);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`StreamNexus Auth & Sync Server running on port ${PORT}`);
});
