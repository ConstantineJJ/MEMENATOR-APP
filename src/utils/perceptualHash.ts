export const PERCEPTUAL_HASH_PREFIX = 'dhash:';

const HASH_WIDTH = 9;
const HASH_HEIGHT = 8;

function stripHashPrefix(value: string): string {
  return value.startsWith(PERCEPTUAL_HASH_PREFIX)
    ? value.slice(PERCEPTUAL_HASH_PREFIX.length)
    : value;
}

export function computeDHashFromGrayscale(
  grayscale: ArrayLike<number>,
  width = HASH_WIDTH,
  height = HASH_HEIGHT
): string {
  if (width < 2 || height < 1 || grayscale.length < width * height) {
    throw new Error('Invalid grayscale buffer for dHash.');
  }

  let hash = 0n;
  let bitCount = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width - 1; x += 1) {
      const left = Number(grayscale[y * width + x]);
      const right = Number(grayscale[y * width + x + 1]);
      hash = (hash << 1n) | (left > right ? 1n : 0n);
      bitCount += 1;
    }
  }

  return hash.toString(16).padStart(Math.ceil(bitCount / 4), '0');
}

export function hammingDistanceHex(a: string, b: string): number {
  const left = stripHashPrefix(a).toLowerCase();
  const right = stripHashPrefix(b).toLowerCase();
  if (!/^[0-9a-f]+$/.test(left) || !/^[0-9a-f]+$/.test(right)) {
    return Number.POSITIVE_INFINITY;
  }

  const width = Math.max(left.length, right.length);
  let xor = BigInt(`0x${left.padStart(width, '0')}`) ^ BigInt(`0x${right.padStart(width, '0')}`);
  let distance = 0;

  while (xor > 0n) {
    distance += Number(xor & 1n);
    xor >>= 1n;
  }

  return distance;
}

export function isPerceptualHash(value: string | undefined): value is string {
  return typeof value === 'string' && value.startsWith(PERCEPTUAL_HASH_PREFIX);
}

export function arePerceptuallySimilar(a: string, b: string, threshold = 6): boolean {
  return hammingDistanceHex(a, b) <= threshold;
}

function imageToDHash(image: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = HASH_WIDTH;
  canvas.height = HASH_HEIGHT;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context is unavailable.');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, 0, 0, HASH_WIDTH, HASH_HEIGHT);

  const rgba = ctx.getImageData(0, 0, HASH_WIDTH, HASH_HEIGHT).data;
  const grayscale = new Uint8Array(HASH_WIDTH * HASH_HEIGHT);
  for (let i = 0; i < grayscale.length; i += 1) {
    const offset = i * 4;
    const r = rgba[offset] ?? 0;
    const g = rgba[offset + 1] ?? 0;
    const b = rgba[offset + 2] ?? 0;
    grayscale[i] = Math.round((299 * r + 587 * g + 114 * b) / 1000);
  }

  return computeDHashFromGrayscale(grayscale);
}

function loadImage(url: string, timeoutMs: number): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.referrerPolicy = 'no-referrer';
    image.decoding = 'async';

    const timeout = window.setTimeout(() => {
      image.src = '';
      reject(new Error('Perceptual hash image load timed out.'));
    }, timeoutMs);

    image.onload = () => {
      window.clearTimeout(timeout);
      resolve(image);
    };
    image.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error('Perceptual hash image load failed.'));
    };
    image.src = url;
  });
}

function isExternalHttpUrl(url: string): boolean {
  if (!/^https?:\/\//i.test(url)) return false;
  try {
    return new URL(url, window.location.href).origin !== window.location.origin;
  } catch {
    return false;
  }
}

async function hashUrl(url: string, timeoutMs: number): Promise<string> {
  const image = await loadImage(url, timeoutMs);
  return imageToDHash(image);
}

/**
 * Computes a 64-bit difference hash from the actual image pixels.
 * External provider images are requested through the hardened same-origin proxy first,
 * avoiding the common CORS/tainted-canvas failure path in embedded previews. If the
 * proxy is temporarily unavailable, a direct request remains as a best-effort fallback.
 */
export async function computePerceptualHashForUrl(url: string, timeoutMs = 3500): Promise<string> {
  if (!isExternalHttpUrl(url)) {
    return hashUrl(url, timeoutMs);
  }

  const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
  try {
    return await hashUrl(proxyUrl, timeoutMs);
  } catch (proxyError) {
    try {
      return await hashUrl(url, timeoutMs);
    } catch {
      throw proxyError;
    }
  }
}
