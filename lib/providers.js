export const DEFAULT_EMBED_BASE = "https://vidcore.org/embed";

const standardPath = ({ id, mediaType, season, episode }) =>
  mediaType === "tv" ? `/tv/${id}/${season}/${episode}` : `/movie/${id}`;

const queryPath = ({ id, mediaType, season, episode }) =>
  mediaType === "tv"
    ? `?type=tv&id=${id}&season=${season}&episode=${episode}`
    : `?type=movie&id=${id}`;

export const EMBED_PROVIDERS = [
  { id: "vidcore", label: "VidCore", base: "https://vidcore.org/embed", docs: "https://vidcore.org", subtitleInjection: true, buildPath: standardPath },
  { id: "vidsrc-pm", label: "VidSrc.pm", base: "https://vidsrc.pm/embed", docs: "https://vidsrc.pm", subtitleInjection: true, buildPath: standardPath },
  { id: "vidy", label: "Vidy", base: "https://www.vidy.st", docs: "https://www.vidy.st", subtitleInjection: false, requiresNoSandbox: true, buildPath: standardPath },
  { id: "atlantic", label: "Atlantic", base: "https://atlantic.st/embed", docs: "https://atlantic.st", subtitleInjection: false, buildPath: standardPath },
  {
    id: "2embed",
    label: "2Embed",
    base: "https://www.2embed.cc",
    docs: "https://www.2embed.cc",
    subtitleInjection: false,
    buildPath: ({ id, mediaType, season, episode }) =>
      mediaType === "tv" ? `/embedtv/${id}&s=${season}&e=${episode}` : `/embed/${id}`,
  },
  { id: "rivestream", label: "Rivestream", base: "https://www.rivestream.app/embed", docs: "https://www.rivestream.app/embed/docs", subtitleInjection: false, buildPath: queryPath },
];

// Hosts that no longer resolve, refuse framing, reject sandboxed frames, or
// have been parked. Older saved selections migrate to the default provider.
const RETIRED_HOSTS = [
  "vidsrc.me",
  "vidsrc.sh",
  "vidsrc.net",
  "vidsrc.to",
  "vidsrc.in",
  "vidsync.live",
  "vidking.net",
  "vidnest.fun",
  "vidrock.net",
  "vidlink.pro",
  "multiembed.mov",
  "111movies.com",
  "vidfast.pro",
  "vidfast.vc",
  "videasy.net",
  "videasy.to",
  "embed.su",
];

export const CUSTOM_PLAYER = "custom";
export const CUSTOM_DOMAIN = "custom_domain";

export function isBuiltInProvider(value) {
  return EMBED_PROVIDERS.some((provider) => provider.base === value);
}

export function getProviderByBase(value) {
  return EMBED_PROVIDERS.find((provider) => provider.base === value) || null;
}

export function buildProviderUrl({ base, id, mediaType, season, episode }) {
  const activeBase = String(base || "").trim().replace(/\/+$/, "");
  const provider = getProviderByBase(activeBase);
  const path = provider
    ? provider.buildPath({ id, mediaType, season, episode })
    : standardPath({ id, mediaType, season, episode });
  return `${activeBase}${path}`;
}

export function supportsSubtitleInjection(base) {
  const provider = getProviderByBase(String(base || "").trim().replace(/\/+$/, ""));
  return provider ? provider.subtitleInjection : false;
}

export function normalizeProviderBase(value) {
  if (!value) return DEFAULT_EMBED_BASE;
  if (value === CUSTOM_PLAYER || value === CUSTOM_DOMAIN) return value;
  if (isBuiltInProvider(value)) return value;
  if (RETIRED_HOSTS.some((host) => value.includes(host))) return DEFAULT_EMBED_BASE;
  return value;
}
