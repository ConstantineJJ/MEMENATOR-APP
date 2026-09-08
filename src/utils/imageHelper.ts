export interface ImagePayload {
  dataUrl: string;
  mimeType: string;
  width: number;
  height: number;
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
