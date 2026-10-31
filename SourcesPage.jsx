import SiteHeader from './components/SiteHeader.jsx';
import { ExternalIcon } from './components/Icons.jsx';
import { DEFAULT_EMBED_BASE, EMBED_PROVIDERS, buildProviderUrl } from './lib/providers.js';

const PROVIDER_NOTES = {
  vidcore: 'Standard-path embed and the default server. The player can inject subtitle files into its video.',
  'vidsrc-pm': 'Standard-path embed with subtitle injection support.',
  vidy: 'Standard-path player with its own interface. It refuses to load inside a sandboxed frame.',
  atlantic: 'Standard-path player that may ask for a one-time human check before playback starts.',
  '2embed': 'Legacy host with its own URL shape and provider-managed subtitles.',
  rivestream: 'Query-string embed API. This app uses the default route; Rivestream also documents torrent and aggregator routes.',
};

const PLAYER_NOTES = {
  '2embed': 'Custom embed path',
  rivestream: 'Query-string API',
};

const TOOLS = [
  {
    name: 'TMDB',
    role: 'Catalog metadata, posters, search, and recommendations.',
    href: 'https://www.themoviedb.org/',
  },
  {
    name: 'SubDL',
    role: 'Subtitle search and download files.',
    href: 'https://subdl.com/',
  },
  {
    name: 'CORS proxies',
    role: 'Corsproxy.io, CodeTabs, and AllOrigins relay subtitle requests the browser cannot make directly.',
    href: 'https://corsproxy.io/',
  },
  {
    name: 'React',
    role: 'Component framework and routing for every page.',
    href: 'https://react.dev/',
  },
  {
    name: 'Vite',
    role: 'Development server and production build.',
    href: 'https://vite.dev/',
  },
  {
    name: 'Vercel KV / Upstash',
    role: 'Optional storage for accounts, favorites, and cloud sync.',
    href: 'https://upstash.com/',
  },
  {
    name: 'Google Fonts',
    role: 'Anton, Caveat, and Inter typefaces.',
    href: 'https://fonts.google.com/',
  },
];

function sourceTag(label, tone = '') {
  return <span className={`source-tag ${tone}`}>{label}</span>;
}

export default function SourcesPage() {
  return (
    <main className="sources-shell">
      <SiteHeader />

      <section className="sources-hero">
        <p className="eyebrow">Sources &amp; credits</p>
        <h1>Where the streams come from.</h1>
        <p className="sources-lede">
          FreeVid is a player front end. Catalog data and artwork come from TMDB, playback is
          delivered by independent embed providers, and subtitles come from SubDL. These services
          are third-party and can change, throttle, or disappear without notice.
        </p>
      </section>

      <section className="sources-section" aria-labelledby="playback-sources">
        <div className="section-head">
          <div>
            <h2 id="playback-sources">Playback providers</h2>
            <p className="section-sub">Switch between these servers inside the player. Each one accepts a TMDB id.</p>
          </div>
          <span className="source-count">{EMBED_PROVIDERS.length} servers</span>
        </div>

        <div className="sources-grid">
          {EMBED_PROVIDERS.map((provider) => {
            const movieUrl = buildProviderUrl({ base: provider.base, id: '550', mediaType: 'movie' });
            const tvUrl = buildProviderUrl({ base: provider.base, id: '1399', mediaType: 'tv', season: '1', episode: '1' });

            return (
              <article className="source-card" key={provider.id}>
                <header className="source-card-head">
                  <div>
                    <h3>{provider.label}</h3>
                    <p className="source-kind">{PLAYER_NOTES[provider.id] || 'Standard embed path'}</p>
                  </div>
                  {provider.base === DEFAULT_EMBED_BASE && <span className="source-badge">Default</span>}
                </header>

                <p className="source-copy">{PROVIDER_NOTES[provider.id] || 'Third-party embed provider.'}</p>

                <div className="source-samples">
                  <span className="source-sample-label">Movie</span>
                  <code>{movieUrl}</code>
                  <span className="source-sample-label">TV episode</span>
                  <code>{tvUrl}</code>
                </div>

                <div className="source-tags">
                  {provider.subtitleInjection
                    ? sourceTag('Subtitle injection', 'is-good')
                    : sourceTag('Provider subtitles')}
                  {provider.requiresNoSandbox
                    ? sourceTag('Needs sandbox off', 'is-warn')
                    : sourceTag('Sandbox friendly', 'is-good')}
                </div>

                <a className="source-link" href={provider.docs || provider.base} target="_blank" rel="noopener noreferrer">
                  Provider site <ExternalIcon size={13} />
                </a>
              </article>
            );
          })}
        </div>
      </section>

      <section className="sources-section" aria-labelledby="tooling">
        <div className="section-head">
          <div>
            <h2 id="tooling">Other tools involved</h2>
            <p className="section-sub">Open services and libraries the app is built on.</p>
          </div>
        </div>

        <div className="sources-grid tools-grid">
          {TOOLS.map((tool) => (
            <article className="tool-card" key={tool.name}>
              <h3>{tool.name}</h3>
              <p>{tool.role}</p>
              <a className="source-link" href={tool.href} target="_blank" rel="noopener noreferrer">
                {new URL(tool.href).hostname} <ExternalIcon size={13} />
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="sources-note">
        <p>
          <strong>Not affiliated.</strong> FreeVid hosts no video files and does not control any
          provider&apos;s catalog or availability. This product uses the TMDB API but is not
          endorsed or certified by TMDB.
        </p>
      </section>
    </main>
  );
}
