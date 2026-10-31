import test from 'node:test';
import assert from 'node:assert/strict';
import {
  contentKey,
  historyKey,
  favoriteTombstoneKey,
  historyTombstoneKey,
  mergeSyncData,
  MAX_HISTORY_ITEMS,
} from '../lib/sync.js';

const t = 1_800_000_000_000;

test('content keys distinguish episodes and history groups them by series', () => {
  const episode = { id: 42, mediaType: 'tv', season: 2, episode: 3 };
  assert.equal(contentKey(episode), 'tv:42:s2:e3');
  assert.equal(historyKey(episode), 'tv:42');
  assert.equal(favoriteTombstoneKey(episode), 'fav:tv:42:s2:e3');
  assert.equal(historyTombstoneKey(episode), 'hist:tv:42');
  assert.equal(contentKey({ id: 7, mediaType: 'movie' }), 'movie:7');
});

test('merges both sides and keeps the newest item for each key', () => {
  const merged = mergeSyncData(
    {
      favorites: [{ id: 1, mediaType: 'movie', title: 'Old', savedAt: t }],
      history: [{ id: 1, mediaType: 'movie', title: 'Old', watchedAt: t }],
      progress: { 'movie:1': { currentTime: 10, updatedAt: t } },
      watchTime: 100,
    },
    {
      favorites: [
        { id: 1, mediaType: 'movie', title: 'New', savedAt: t + 10 },
        { id: 2, mediaType: 'movie', title: 'Second', savedAt: t + 5 },
      ],
      history: [{ id: 1, mediaType: 'movie', title: 'New', watchedAt: t + 10 }],
      progress: { 'movie:1': { currentTime: 25, updatedAt: t + 10 } },
      watchTime: 250,
    },
    t + 20
  );

  assert.equal(merged.favorites.length, 2);
  assert.equal(merged.favorites.find(item => item.id === 1).title, 'New');
  assert.equal(merged.history[0].title, 'New');
  assert.equal(merged.progress['movie:1'].currentTime, 25);
  assert.equal(merged.watchTime, 250);
});

test('a history deletion tombstone suppresses the server copy', () => {
  const entry = { id: 9, mediaType: 'tv', season: 1, episode: 2, title: 'Show', watchedAt: t };
  const merged = mergeSyncData(
    { history: [entry] },
    { history: [], deleted: { 'hist:tv:9': t + 5 } },
    t + 10
  );

  assert.deepEqual(merged.history, []);
  assert.equal(merged.deleted['hist:tv:9'], t + 5);
});

test('re-watching after a deletion supersedes and removes the tombstone', () => {
  const entry = { id: 9, mediaType: 'tv', season: 1, episode: 3, title: 'Show', watchedAt: t + 50 };
  const merged = mergeSyncData(
    { history: [], deleted: { 'hist:tv:9': t + 5 } },
    { history: [entry] },
    t + 60
  );

  assert.equal(merged.history.length, 1);
  assert.equal(merged.deleted['hist:tv:9'], undefined);
});

test('favorite tombstones are scoped to the exact episode', () => {
  const first = { id: 9, mediaType: 'tv', season: 1, episode: 1, title: 'Show', savedAt: t };
  const second = { id: 9, mediaType: 'tv', season: 1, episode: 2, title: 'Show', savedAt: t };
  const merged = mergeSyncData(
    { favorites: [first, second] },
    { favorites: [], deleted: { 'fav:tv:9:s1:e1': t + 1 } },
    t + 2
  );

  assert.deepEqual(merged.favorites.map(item => item.episode), [2]);
});

test('clear-all timestamp removes older history but keeps newer entries', () => {
  const merged = mergeSyncData(
    {
      history: [
        { id: 1, mediaType: 'movie', title: 'Old', watchedAt: t },
        { id: 2, mediaType: 'movie', title: 'New', watchedAt: t + 100 },
      ],
    },
    { history: [], historyClearedAt: t + 50 },
    t + 200
  );

  assert.deepEqual(merged.history.map(item => item.id), [2]);
});

test('history is grouped by series and capped', () => {
  const history = [];
  for (let episode = 1; episode <= MAX_HISTORY_ITEMS + 20; episode += 1) {
    history.push({ id: 1, mediaType: 'tv', season: 1, episode, title: 'Show', watchedAt: t + episode });
  }
  const merged = mergeSyncData({}, { history }, t + MAX_HISTORY_ITEMS + 100);

  assert.equal(merged.history.length, 1);
  assert.equal(merged.history[0].episode, MAX_HISTORY_ITEMS + 20);
});

test('entries without an id are ignored', () => {
  const merged = mergeSyncData({}, { favorites: [{ title: 'nope' }, null], history: [{}] }, t);
  assert.deepEqual(merged.favorites, []);
  assert.deepEqual(merged.history, []);
});

test('tombstones expire after the retention window', () => {
  const ninetyOneDays = 91 * 24 * 60 * 60 * 1000;
  const merged = mergeSyncData({}, { deleted: { 'hist:tv:1': t } }, t + ninetyOneDays);
  assert.equal(merged.deleted['hist:tv:1'], undefined);
});
