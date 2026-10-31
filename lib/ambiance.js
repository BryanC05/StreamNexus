const CACHE_LIMIT = 32;
const cache = new Map();

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function wrapHue(hue) {
  return ((hue % 360) + 360) % 360;
}

function hueGap(a, b) {
  const diff = Math.abs(wrapHue(a) - wrapHue(b));
  return diff > 180 ? 360 - diff : diff;
}

function toHsl(hue, saturation, lightness) {
  return `hsl(${Math.round(wrapHue(hue))} ${Math.round(saturation)}% ${Math.round(lightness)}%)`;
}

function analyze(image) {
  const size = 48;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(image, 0, 0, size, size);

  let pixels;
  try {
    pixels = ctx.getImageData(0, 0, size, size).data;
  } catch {
    return null;
  }

  const buckets = new Map();

  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 128) continue;

    const r = pixels[i] / 255;
    const g = pixels[i + 1] / 255;
    const b = pixels[i + 2] / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lightness = (max + min) / 2;
    const delta = max - min;

    // Skip letterboxing, blown-out highlights and near-grey pixels.
    if (lightness < 0.06 || lightness > 0.94) continue;
    const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
    if (saturation < 0.16) continue;

    let hue;
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue = wrapHue(hue * 60);

    const key = `${Math.round(hue / 18)}|${Math.round(saturation * 5)}|${Math.round(lightness * 5)}`;
    const bucket = buckets.get(key) || { hue: 0, saturation: 0, lightness: 0, weight: 0, count: 0 };
    bucket.hue += hue;
    bucket.saturation += saturation;
    bucket.lightness += lightness;
    bucket.weight += 1 + saturation * 3.2 + (1 - Math.abs(lightness - 0.5) * 2) * 1.4;
    bucket.count += 1;
    buckets.set(key, bucket);
  }

  if (!buckets.size) return null;

  const clusters = [...buckets.values()]
    .map(bucket => ({
      hue: bucket.hue / bucket.count,
      saturation: bucket.saturation / bucket.count,
      lightness: bucket.lightness / bucket.count,
      weight: bucket.weight,
    }))
    .sort((a, b) => b.weight - a.weight);

  const primary = clusters[0];
  const secondary = clusters.find(cluster => hueGap(cluster.hue, primary.hue) > 26);

  return {
    primary: toHsl(primary.hue, clamp(primary.saturation * 130, 52, 86), clamp(primary.lightness * 74 + 30, 46, 62)),
    secondary: secondary
      ? toHsl(secondary.hue, clamp(secondary.saturation * 130, 48, 82), clamp(secondary.lightness * 66 + 22, 34, 50))
      : toHsl(primary.hue + 46, clamp(primary.saturation * 120, 46, 78), clamp(primary.lightness * 66 + 22, 32, 48)),
  };
}

// Artwork is fetched with CORS so the canvas stays readable; the player iframe
// itself cannot be sampled, so the palette comes from the title artwork instead.
export function sampleAmbiance(url) {
  if (typeof url !== 'string' || !url) return Promise.resolve(null);
  const cached = cache.get(url);
  if (cached) return cached;

  const promise = new Promise(resolve => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.referrerPolicy = 'no-referrer';

    let settled = false;
    const finish = value => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    image.onload = () => {
      try {
        finish(analyze(image));
      } catch {
        finish(null);
      }
    };
    image.onerror = () => finish(null);
    image.src = url;
  });

  cache.set(url, promise);
  promise.then(palette => {
    if (!palette) {
      cache.delete(url);
      return;
    }
    if (cache.size > CACHE_LIMIT) {
      const oldest = cache.keys().next().value;
      if (oldest && oldest !== url) cache.delete(oldest);
    }
  });

  return promise;
}
