import type { Express } from 'express';
import { callWithRetry, getGeminiClient, parseErrorMessage } from '../gemini';

const SUPPORTED_ASPECT_RATIOS = new Set(['1:1', '16:9', '9:16', '4:3']);
const IMAGE_MODELS = [
  'gemini-3.1-flash-image',
  'gemini-3.1-flash-lite-image',
  'gemini-2.5-flash-image',
] as const;

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (char) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&apos;',
  })[char] || char);
}

function promptSeed(prompt: string): number {
  let hash = 2166136261;
  for (let index = 0; index < prompt.length; index += 1) {
    hash ^= prompt.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function generateFallbackSvg(prompt: string, aspectRatio = '1:1'): string {
  const dimensions: Record<string, [number, number]> = {
    '1:1': [800, 800],
    '16:9': [1200, 675],
    '9:16': [675, 1200],
    '4:3': [960, 720],
  };
  const [width, height] = dimensions[aspectRatio] || dimensions['1:1'];
  const cleanPrompt = escapeXml(prompt.trim().slice(0, 90) || 'Meme template');
  const seed = promptSeed(prompt);
  const centerX = width / 2;
  const centerY = height / 2;
  const eyeOffset = 0.065 + (seed % 5) * 0.006;
  const mouthWidth = 28 + (seed % 19);
  const mouthHeight = 24 + ((seed >>> 4) % 26);
  const hue = seed % 360;
  const accentHue = (hue + 145) % 360;
  const pupilShift = ((seed >>> 8) % 9) - 4;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
    <defs>
      <radialGradient id="bg" cx="50%" cy="45%" r="75%">
        <stop offset="0%" stop-color="hsl(${hue} 72% 58%)"/>
        <stop offset="52%" stop-color="hsl(${accentHue} 62% 34%)"/>
        <stop offset="100%" stop-color="#111827"/>
      </radialGradient>
      <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
        <circle cx="14" cy="14" r="3" fill="#fff" opacity="0.1"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <rect width="100%" height="100%" fill="url(#dots)"/>
    <g transform="translate(${centerX} ${centerY - 20})">
      <circle r="${Math.min(width, height) * 0.19}" fill="#facc15" stroke="#09090b" stroke-width="12"/>
      <ellipse cx="-${Math.min(width, height) * eyeOffset}" cy="-${Math.min(width, height) * 0.035}" rx="30" ry="38" fill="#fff" stroke="#09090b" stroke-width="8"/>
      <ellipse cx="${Math.min(width, height) * eyeOffset}" cy="-${Math.min(width, height) * 0.035}" rx="30" ry="38" fill="#fff" stroke="#09090b" stroke-width="8"/>
      <circle cx="${-Math.min(width, height) * eyeOffset + pupilShift}" cy="-${Math.min(width, height) * 0.03}" r="12" fill="#09090b"/>
      <circle cx="${Math.min(width, height) * eyeOffset + pupilShift}" cy="-${Math.min(width, height) * 0.03}" r="12" fill="#09090b"/>
      <ellipse cy="${Math.min(width, height) * 0.075}" rx="${mouthWidth}" ry="${mouthHeight}" fill="#7f1d1d" stroke="#09090b" stroke-width="8"/>
    </g>
    <rect x="6%" y="6%" width="88%" height="10%" rx="22" fill="#09090b" opacity="0.88"/>
    <text x="50%" y="12.5%" text-anchor="middle" fill="#f8fafc" font-family="Arial Black, sans-serif" font-size="${Math.round(width * 0.025)}" font-weight="900">MEMENATOR FALLBACK TEMPLATE</text>
    <rect x="7%" y="84%" width="86%" height="10%" rx="18" fill="#09090b" opacity="0.88"/>
    <text x="50%" y="90%" text-anchor="middle" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="${Math.round(width * 0.018)}" font-weight="700">${cleanPrompt}</text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function parseSourceImage(value: unknown, fallbackMimeType: unknown): { data: string; mimeType: string } | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const source = value.trim();
  const dataUrl = source.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s);
  if (dataUrl) {
    return { mimeType: dataUrl[1], data: dataUrl[2] };
  }

  // Raw base64 is accepted for callers that already stripped the data URL prefix.
  if (/^[a-zA-Z0-9+/=\s]+$/.test(source) && source.length > 64) {
    return {
      mimeType: typeof fallbackMimeType === 'string' && fallbackMimeType.startsWith('image/')
        ? fallbackMimeType
        : 'image/jpeg',
      data: source.replace(/\s+/g, ''),
    };
  }

  return null;
}

export function registerTemplateImageRoute(app: Express) {
  app.post('/api/generate-template-image', async (req, res) => {
    const {
      prompt,
      aspectRatio = '1:1',
      sourceImageBase64,
      mimeType = 'image/jpeg',
    } = req.body || {};

    if (typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const safePrompt = prompt.trim().slice(0, 1000);
    const safeAspectRatio = typeof aspectRatio === 'string' && SUPPORTED_ASPECT_RATIOS.has(aspectRatio)
      ? aspectRatio
      : '1:1';
    const sourceImage = parseSourceImage(sourceImageBase64, mimeType);

    if (sourceImageBase64 && !sourceImage) {
      return res.status(400).json({
        error: 'The source image must be a base64 image. Reload the image and try editing again.',
      });
    }

    try {
      const ai = getGeminiClient();
      const instruction = sourceImage
        ? `Edit the supplied image according to this request: ${safePrompt}. Preserve recognisable source content unless the request explicitly asks to replace it. Keep a clear focal subject, useful negative space for meme captions, and strong comedic staging.`
        : `Create an original funny expressive visual suitable as a meme template: ${safePrompt}. Do not add meme caption text unless explicitly requested. Use a clear focal subject, useful negative space for captions, and strong comedic staging.`;

      const contents = sourceImage
        ? [
            { text: instruction },
            { inlineData: { mimeType: sourceImage.mimeType, data: sourceImage.data } },
          ]
        : [{ text: instruction }];

      const failures: string[] = [];

      for (const modelName of IMAGE_MODELS) {
        try {
          const imageOptions: Record<string, string> = {
            aspectRatio: safeAspectRatio,
          };
          if (modelName !== 'gemini-2.5-flash-image') {
            imageOptions.imageSize = '1K';
          }

          const response = await callWithRetry(
            () => ai.models.generateContent({
              model: modelName,
              contents,
              config: {
                responseModalities: ['IMAGE'],
                responseFormat: {
                  image: imageOptions,
                },
              },
            }),
            1,
            700
          );

          const parts = response?.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData?.data) {
              const outputMime = part.inlineData.mimeType || 'image/png';
              return res.json({
                imageUrl: `data:${outputMime};base64,${part.inlineData.data}`,
                modelUsed: modelName,
              });
            }
          }

          failures.push(`${modelName}: response did not contain image data`);
        } catch (error) {
          const reason = parseErrorMessage(error).slice(0, 240);
          failures.push(`${modelName}: ${reason}`);
          console.warn(`[template-image] ${modelName} failed: ${reason}`);
        }
      }

      console.warn('[template-image] all image models failed:', failures.join(' | '));
    } catch (error) {
      console.warn(`[template-image] Gemini client unavailable: ${parseErrorMessage(error)}`);
    }

    return res.json({
      imageUrl: generateFallbackSvg(safePrompt, safeAspectRatio),
      isFallback: true,
      note: 'Gemini image generation is unavailable; a local fallback template was created.',
    });
  });
}
