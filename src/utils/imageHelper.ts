export async function getBase64FromImageUrl(url: string): Promise<string> {
  if (!url) return '';

  // If already base64 data URL, return cleaned
  if (url.startsWith('data:')) {
    return url;
  }

  // First try standard fetch (with proxy if cross-origin HTTP)
  try {
    const isExternal = url.startsWith('http') && !url.includes(window.location.host);
    const fetchUrl = isExternal ? `/api/proxy-image?url=${encodeURIComponent(url)}` : url;

    const res = await fetch(fetchUrl);
    if (res.ok) {
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  } catch (_fetchErr) {
    // Fallback to HTML Image drawing on canvas
  }

  // Fallback: draw via Image object to offscreen canvas
  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 600;
        canvas.height = img.naturalHeight || img.height || 600;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve('');
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } catch (err) {
        // If tainted canvas or error, return empty
        resolve('');
      }
    };
    img.onerror = () => {
      resolve('');
    };
    img.src = url;
  });
}
