import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeUsername,
  isValidUsername,
  validatePassword,
  sanitizeSyncPayload,
  validateReviewInput,
  normalizeTmdbId,
} from '../lib/validate.js';

test('normalizes and validates usernames', () => {
  assert.equal(normalizeUsername('  Alice_01 '), 'alice_01');
  assert.equal(isValidUsername('alice_01'), true);
  assert.equal(isValidUsername('ab'), false);
  assert.equal(isValidUsername('bad name'), false);
  assert.equal(isValidUsername('plus+name'), false);
});

test('enforces password length', () => {
  assert.match(validatePassword('short'), /at least 8/);
  assert.equal(validatePassword('long-enough-password'), '');
  assert.match(validatePassword('x'.repeat(129)), /at most 128/);
});

test('sanitizes sync payloads and drops malformed entries', () => {
  const payload = sanitizeSyncPayload({
    favorites: [{ id: 1, mediaType: 'movie' }, { title: 'missing id' }, 'wrong'],
    history: [{ id: 2, mediaType: 'tv' }],
    progress: { 'movie:2': { currentTime: 5 }, bad: 'wrong' },
    watchTime: '123.9',
    deleted: { 'hist:tv:2': Date.now(), bad: 'nope' },
    historyClearedAt: Date.now(),
  });

  assert.equal(payload.favorites.length, 1);
  assert.equal(payload.history.length, 1);
  assert.deepEqual(payload.progress, { 'movie:2': { currentTime: 5 } });
  assert.equal(payload.watchTime, 123);
  assert.equal(Object.keys(payload.deleted).length, 1);
  assert.ok(payload.historyClearedAt > 0);
});

test('rejects non-object payloads safely', () => {
  assert.deepEqual(sanitizeSyncPayload(null), {
    favorites: [],
    history: [],
    progress: {},
    deleted: {},
    watchTime: 0,
    historyClearedAt: 0,
  });
});

test('validates review input', () => {
  assert.deepEqual(validateReviewInput({ mediaType: 'film', tmdbId: 1, rating: 5 }), {
    error: 'mediaType must be "movie" or "tv"',
  });
  assert.equal(validateReviewInput({ mediaType: 'movie', tmdbId: 1, rating: 7 }).error, 'Rating must be a number between 1 and 5');

  const valid = validateReviewInput({ mediaType: 'tv', tmdbId: '42', rating: '4', text: '  Great  ' });
  assert.equal(valid.error, undefined);
  assert.equal(valid.tmdbId, '42');
  assert.equal(valid.rating, 4);
  assert.equal(valid.text, 'Great');
});

test('normalizes TMDB ids', () => {
  assert.equal(normalizeTmdbId('42'), '42');
  assert.equal(normalizeTmdbId(42.5), null);
  assert.equal(normalizeTmdbId('-1'), null);
  assert.equal(normalizeTmdbId('abc'), null);
});
