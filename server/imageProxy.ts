import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 5000;

const ALLOWED_EXACT_HOSTS = new Set([
  'i.imgflip.com',
  'imgflip.com',
  'i.imgur.com',
  'imgur.com',
]);

const ALLOWED_HOST_SUFFIXES = [
  '.redd.it',
  '.redditmedia.com',
];

function isAllowedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return ALLOWED_EXACT_HOSTS.has(host) || ALLOWED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

function parseAllowedImageUrl(rawUrl: string, baseUrl?: URL): URL {
  const parsed = baseUrl ? new URL(rawUrl, baseUrl) : new URL(rawUrl);

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Unsupported image URL protocol.');
  }
  if (parsed.username || parsed.password) {
    throw new Error('Credentials in image URLs are not allowed.');
  }
  if (!isAllowedHost(parsed.hostname)) {
    throw new Error('Image host is not allowed.');
  }
  if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
    throw new Error('Custom image URL ports are not allowed.');
  }

  return parsed;
}

async function fetchWithValidatedRedirects(initialUrl: URL): Promise<globalThis.Response> {
  let currentUrl = initialUrl;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    const response = await fetch(currentUrl, {
      redirect: 'manual',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        'User-Agent': 'MemenatorApp/2.0 image proxy',
        Accept: 'image/avif,image/webp,image/png,image/jpeg,image/gif,*/*;q=0.5',
      },
    });

    if (response.status >= 300 && response.status < 400) {
      if (redirectCount === MAX_REDIRECTS) {
        throw new Error('Too many image redirects.');
      }
      const location = response.headers.get('location');
      if (!location) {
        throw new Error('Image redirect did not provide a location.');
      }
      currentUrl = parseAllowedImageUrl(location, currentUrl);
      continue;
    }

    return response;
  }

  throw new Error('Unable to resolve image URL.');
}

async function readBodyWithLimit(response: globalThis.Response): Promise<Buffer> {
  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > MAX_IMAGE_BYTES) {
    throw new Error('Image exceeds maximum allowed size.');
  }

  if (!response.body) {
    return Buffer.alloc(0);
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    totalBytes += value.byteLength;
    if (totalBytes > MAX_IMAGE_BYTES) {
      await reader.cancel('Image exceeds maximum allowed size.');
      throw new Error('Image exceeds maximum allowed size.');
    }
    chunks.push(value);
  }

  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
}

export async function proxyExternalImage(req: ExpressRequest, res: ExpressResponse) {
  try {
    const rawUrl = typeof req.query.url === 'string' ? req.query.url.trim() : '';
    if (!rawUrl) {
      return res.status(400).json({ error: 'url query parameter is required.' });
    }

    const initialUrl = parseAllowedImageUrl(rawUrl);
    const response = await fetchWithValidatedRedirects(initialUrl);

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch external image.' });
    }

    const contentType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!contentType.startsWith('image/')) {
      return res.status(415).json({ error: 'Requested resource is not an image.' });
    }

    const buffer = await readBodyWithLimit(response);
    if (buffer.length === 0) {
      return res.status(502).json({ error: 'External image response was empty.' });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.send(buffer);
  } catch (err: any) {
    const message = String(err?.message || 'Error proxying image.');
    const isClientError =
      message.includes('not allowed') ||
      message.includes('Unsupported') ||
      message.includes('Credentials') ||
      message.includes('ports') ||
      message.includes('maximum allowed size');

    return res.status(isClientError ? 400 : 502).json({
      error: isClientError ? message : 'Error proxying image.',
    });
  }
}
