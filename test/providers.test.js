import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_EMBED_BASE,
  EMBED_PROVIDERS,
  buildProviderUrl,
  normalizeProviderBase,
  supportsSubtitleInjection,
} from '../lib/providers.js';

test('falls back to the default provider when nothing is saved', () => {
  assert.equal(normalizeProviderBase(''), DEFAULT_EMBED_BASE);
  assert.equal(normalizeProviderBase(undefined), DEFAULT_EMBED_BASE);
  assert.equal(normalizeProviderBase(null), DEFAULT_EMBED_BASE);
});

test('keeps every built-in provider base untouched', () => {
  for (const provider of EMBED_PROVIDERS) {
    assert.equal(normalizeProviderBase(provider.base), provider.base);
  }
});

test('migrates retired provider hosts to a working default', () => {
  assert.equal(normalizeProviderBase('https://vidsync.live/embed'), DEFAULT_EMBED_BASE);
  assert.equal(normalizeProviderBase('https://vidsrc.in/embed'), DEFAULT_EMBED_BASE);
  assert.equal(normalizeProviderBase('https://vidsrc.me/embed'), DEFAULT_EMBED_BASE);
  assert.equal(normalizeProviderBase('https://vidsrc.sh/embed'), DEFAULT_EMBED_BASE);
  assert.equal(normalizeProviderBase('https://www.vidking.net/embed'), DEFAULT_EMBED_BASE);
});

test('preserves the custom player modes', () => {
  assert.equal(normalizeProviderBase('custom'), 'custom');
  assert.equal(normalizeProviderBase('custom_domain'), 'custom_domain');
});

test('preserves an unrecognized custom embed base', () => {
  assert.equal(normalizeProviderBase('https://my-provider.example/embed'), 'https://my-provider.example/embed');
});

test('builds movie and TV URLs for standard providers', () => {
  assert.equal(
    buildProviderUrl({ base: 'https://vidcore.org/embed', id: '550', mediaType: 'movie', season: '1', episode: '1' }),
    'https://vidcore.org/embed/movie/550',
  );
  assert.equal(
    buildProviderUrl({ base: 'https://vidsrc.pm/embed/', id: '1399', mediaType: 'tv', season: '2', episode: '3' }),
    'https://vidsrc.pm/embed/tv/1399/2/3',
  );
  assert.equal(
    buildProviderUrl({ base: 'https://www.vidy.st', id: '550', mediaType: 'movie', season: '1', episode: '1' }),
    'https://www.vidy.st/movie/550',
  );
  assert.equal(
    buildProviderUrl({ base: 'https://www.vidy.st/', id: '1399', mediaType: 'tv', season: '2', episode: '3' }),
    'https://www.vidy.st/tv/1399/2/3',
  );
  assert.equal(
    buildProviderUrl({ base: 'https://atlantic.st/embed', id: '550', mediaType: 'movie' }),
    'https://atlantic.st/embed/movie/550',
  );
  assert.equal(
    buildProviderUrl({ base: 'https://atlantic.st/embed/', id: '1399', mediaType: 'tv', season: '2', episode: '3' }),
    'https://atlantic.st/embed/tv/1399/2/3',
  );
});

test('builds 2Embed-specific URLs', () => {
  assert.equal(
    buildProviderUrl({ base: 'https://www.2embed.cc', id: '550', mediaType: 'movie' }),
    'https://www.2embed.cc/embed/550',
  );
  assert.equal(
    buildProviderUrl({ base: 'https://www.2embed.cc', id: '1399', mediaType: 'tv', season: '1', episode: '1' }),
    'https://www.2embed.cc/embedtv/1399&s=1&e=1',
  );
});

test('builds Rivestream query-string URLs', () => {
  assert.equal(
    buildProviderUrl({ base: 'https://www.rivestream.app/embed', id: '278', mediaType: 'movie' }),
    'https://www.rivestream.app/embed?type=movie&id=278',
  );
  assert.equal(
    buildProviderUrl({ base: 'https://www.rivestream.app/embed/', id: '1399', mediaType: 'tv', season: '2', episode: '3' }),
    'https://www.rivestream.app/embed?type=tv&id=1399&season=2&episode=3',
  );
});

test('reports subtitle injection support per provider', () => {
  assert.equal(supportsSubtitleInjection('https://vidcore.org/embed'), true);
  assert.equal(supportsSubtitleInjection('https://www.vidy.st'), false);
  assert.equal(supportsSubtitleInjection('https://atlantic.st/embed'), false);
  assert.equal(supportsSubtitleInjection('https://www.2embed.cc'), false);
  assert.equal(supportsSubtitleInjection('https://www.rivestream.app/embed'), false);
  assert.equal(supportsSubtitleInjection('https://custom.example/embed'), false);
});
