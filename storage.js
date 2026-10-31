import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const useKv = Boolean(KV_URL && KV_TOKEN);

const DB_FILE =
  process.env.DATABASE_FILE ||
  (process.env.VERCEL === '1' ? '/tmp/streamnexus-database.json' : path.join(__dirname, 'database.json'));

export const persistenceMode = useKv ? 'kv' : 'file';

function emptyDb() {
  return { users: {}, reviews: {} };
}

function readDb() {
  if (!fs.existsSync(DB_FILE)) return emptyDb();
  try {
    const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    return {
      users: parsed.users && typeof parsed.users === 'object' ? parsed.users : {},
      reviews: parsed.reviews && typeof parsed.reviews === 'object' ? parsed.reviews : {},
    };
  } catch (err) {
    console.error('Failed to read database file, starting from an empty database:', err.message);
    return emptyDb();
  }
}

function writeDb(db) {
  const tempFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(db, null, 2));
  fs.renameSync(tempFile, DB_FILE);
}

async function kvCommand(command) {
  const response = await fetch(KV_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  if (!response.ok) {
    throw new Error(`KV request failed with status ${response.status}`);
  }
  const data = await response.json();
  if (data?.error) throw new Error(`KV error: ${data.error}`);
  return data?.result ?? null;
}

async function kvGetJson(key) {
  const raw = await kvCommand(['GET', key]);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function kvSetJson(key, value) {
  await kvCommand(['SET', key, JSON.stringify(value)]);
}

export async function getUser(username) {
  if (useKv) return kvGetJson(`streamnexus:user:${username}`);
  return readDb().users[username] || null;
}

export async function saveUser(username, user) {
  if (useKv) {
    await kvSetJson(`streamnexus:user:${username}`, user);
    return;
  }
  const db = readDb();
  db.users[username] = user;
  writeDb(db);
}

export async function getReviews(reviewKey) {
  if (useKv) return (await kvGetJson(`streamnexus:reviews:${reviewKey}`)) || [];
  return readDb().reviews[reviewKey] || [];
}

export async function saveReviews(reviewKey, reviews) {
  if (useKv) {
    await kvSetJson(`streamnexus:reviews:${reviewKey}`, reviews);
    return;
  }
  const db = readDb();
  db.reviews[reviewKey] = reviews;
  writeDb(db);
}
