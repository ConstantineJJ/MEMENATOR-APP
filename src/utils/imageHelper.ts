export interface ImagePayload {
  dataUrl: string;
  mimeType: string;
  width: number;
  height: number;
}

export interface WorkingImageSize {
  width: number;
  height: number;
  resized: boolean;
}

interface DecodedImageSource {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}

export const MOBILE_WORKING_IMAGE_MAX_DIMENSION = 3072;
export const DESKTOP_WORKING_IMAGE_MAX_DIMENSION = 4096;

export function getWorkingImageDimensionLimit(): number {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return DESKTOP_WORKING_IMAGE_MAX_DIMENSION;
  }

  const constrainedDevice = window.matchMedia('(max-width: 1024px), (pointer: coarse)').matches;
  return constrainedDevice
    ? MOBILE_WORKING_IMAGE_MAX_DIMENSION
    : DESKTOP_WORKING_IMAGE_MAX_DIMENSION;
}

export function calculateWorkingImageSize(
  sourceWidth: number,
  sourceHeight: number,
  maxDimension: number
): WorkingImageSize {
  const safeWidth = Math.max(1, Math.round(sourceWidth));
  const safeHeight = Math.max(1, Math.round(sourceHeight));
  const safeMax = Math.max(1, Math.round(maxDimension));
  const longestSide = Math.max(safeWidth, safeHeight);

  if (longestSide <= safeMax) {
    return { width: safeWidth, height: safeHeight, resized: false };
  }

  const scale = safeMax / longestSide;
  return {
    width: Math.max(1, Math.round(safeWidth * scale)),
    height: Math.max(1, Math.round(safeHeight * scale)),
    resized: true,
  };
}

function getMimeTypeFromDataUrl(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;,]+)[;,]/i);
  return match?.[1]?.toLowerCase() || 'image/jpeg';
}

function readImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth || img.width || 600,
        height: img.naturalHeight || img.height || 600,
      });
    };
    img.onerror = () => resolve({ width: 600, height: 600 });
    img.src = src;
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function outputFileName(fileName: string, outputType: string): string {
  const base = fileName.replace(/\.[^.]+$/, '') || 'memenator-image';
  if (outputType === 'image/png') return `${base}.png`;
  if (outputType === 'image/webp') return `${base}.webp`;
  return `${base}.jpg`;
}

async function decodeImageFile(file: File): Promise<DecodedImageSource> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file);
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      cleanup: () => bitmap.close(),
    };
  }

  return new Promise<DecodedImageSource>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        source: image,
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
        cleanup: () => undefined,
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Browser could not decode the selected image.'));
    };
    image.src = objectUrl;
  });
}

/**
 * Protect mobile browsers from retaining full camera-resolution photos in every
 * editable canvas. Small inputs remain byte-for-byte untouched. Oversized
 * images are rasterized once to a device-appropriate long-side limit before
 * App reads them into its active canvas/history state.
 */
export async function normalizeImageFileForWorkingCanvas(
  file: File,
  maxDimension = getWorkingImageDimensionLimit()
): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  let decoded: DecodedImageSource | null = null;
  try {
    decoded = await decodeImageFile(file);
    const target = calculateWorkingImageSize(decoded.width, decoded.height, maxDimension);

    if (!target.resized) {
      return file;
    }

    const canvas = document.createElement('canvas');
    canvas.width = target.width;
    canvas.height = target.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(decoded.source, 0, 0, target.width, target.height);

    const outputType = file.type === 'image/png'
      ? 'image/png'
      : file.type === 'image/webp'
        ? 'image/webp'
        : 'image/jpeg';
    const blob = await canvasToBlob(
      canvas,
      outputType,
      outputType === 'image/png' ? undefined : 0.92
    );
    if (!blob) return file;

    return new File([blob], outputFileName(file.name, outputType), {
      type: blob.type || outputType,
      lastModified: file.lastModified,
    });
  } catch (err) {
    console.warn('Working-image normalization failed; using original file:', err);
    return file;
  } finally {
    decoded?.cleanup();
  }
}

export async function getImagePayloadFromUrl(url: string): Promise<ImagePayload | null> {
  if (!url) return null;

  if (url.startsWith('data:')) {
    const { width, height } = await readImageDimensions(url);
    return {
      dataUrl: url,
      mimeType: getMimeTypeFromDataUrl(url),
      width,
      height,
    };
  }

  // First try standard fetch through the same-origin restricted proxy for external images.
  try {
    const isExternal = url.startsWith('http') && !url.includes(window.location.host);
    const fetchUrl = isExternal ? `/api/proxy-image?url=${encodeURIComponent(url)}` : url;

    const res = await fetch(fetchUrl);
    if (res.ok) {
      const blob = await res.blob();
      if (!blob.type.startsWith('image/')) return null;

      const dataUrl = await blobToDataUrl(blob);
      const { width, height } = await readImageDimensions(dataUrl);
      return {
        dataUrl,
        mimeType: blob.type || getMimeTypeFromDataUrl(dataUrl),
        width,
        height,
      };
    }
  } catch (_fetchErr) {
    // Fallback to HTML Image drawing on canvas below.
  }

  // Fallback: draw via Image object to an offscreen canvas.
  return new Promise<ImagePayload | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width || 600;
        const height = img.naturalHeight || img.height || 600;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve({
          dataUrl: canvas.toDataURL('image/jpeg', 0.85),
          mimeType: 'image/jpeg',
          width,
          height,
        });
      } catch (_err) {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export async function getBase64FromImageUrl(url: string): Promise<string> {
  const payload = await getImagePayloadFromUrl(url);
  return payload?.dataUrl || '';
}
