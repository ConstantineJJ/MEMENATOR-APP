export async function getBase64FromImageUrl(url: string): Promise<string> {
  // If already base64 data URL, return cleaned
  if (url.startsWith('data:')) {
    return url;
  }

  // Otherwise, fetch via proxy to guarantee clean data
  const proxyUrl = url.startsWith('http') && !url.includes(window.location.host)
    ? `/api/proxy-image?url=${encodeURIComponent(url)}`
    : url;

  const res = await fetch(proxyUrl);
  if (!res.ok) {
    throw new Error('Could not fetch image for AI analysis.');
  }

  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
