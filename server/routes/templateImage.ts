import type { Express } from 'express';
import { callWithRetry, getGeminiClient } from '../gemini';

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (char) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&apos;',
  })[char] || char);
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
  const centerX = width / 2;
  const centerY = height / 2;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
    <defs>
      <radialGradient id="bg" cx="50%" cy="45%" r="75%">
        <stop offset="0%" stop-color="#fb7185"/>
        <stop offset="48%" stop-color="#0f766e"/>
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
      <ellipse cx="-${Math.min(width, height) * 0.07}" cy="-${Math.min(width, height) * 0.035}" rx="30" ry="38" fill="#fff" stroke="#09090b" stroke-width="8"/>
      <ellipse cx="${Math.min(width, height) * 0.07}" cy="-${Math.min(width, height) * 0.035}" rx="30" ry="38" fill="#fff" stroke="#09090b" stroke-width="8"/>
      <circle cx="-${Math.min(width, height) * 0.065}" cy="-${Math.min(width, height) * 0.03}" r="12" fill="#09090b"/>
      <circle cx="${Math.min(width, height) * 0.075}" cy="-${Math.min(width, height) * 0.03}" r="12" fill="#09090b"/>
      <ellipse cy="${Math.min(width, height) * 0.075}" rx="35" ry="45" fill="#7f1d1d" stroke="#09090b" stroke-width="8"/>
    </g>
    <rect x="6%" y="6%" width="88%" height="10%" rx="22" fill="#09090b" opacity="0.88"/>
    <text x="50%" y="12.5%" text-anchor="middle" fill="#f8fafc" font-family="Arial Black, sans-serif" font-size="${Math.round(width * 0.025)}" font-weight="900">MEMENATOR FALLBACK TEMPLATE</text>
    <rect x="7%" y="84%" width="86%" height="10%" rx="18" fill="#09090b" opacity="0.88"/>
    <text x="50%" y="90%" text-anchor="middle" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="${Math.round(width * 0.018)}" font-weight="700">${cleanPrompt}</text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
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

    try {
      const ai = getGeminiClient();
      const safePrompt = prompt.trim().slice(0, 1000);
      const contents = sourceImageBase64
        ? {
            parts: [
              {
                inlineData: {
                  mimeType: typeof mimeType === 'string' ? mimeType : 'image/jpeg',
                  data: String(sourceImageBase64).replace(/^data:[a-zA-Z0-9/+-]+;base64,/, ''),
                },
              },
              {
                text: `Modify this meme template according to the request: ${safePrompt}. Preserve a clear focal subject, readable negative space and strong comedic staging.`,
              },
            ],
          }
        : {
            parts: [
              {
                text: `Create a funny expressive visual suitable as a meme template: ${safePrompt}. High quality, clear focal subject, readable negative space and strong comedic staging.`,
              },
            ],
          };

      const models = ['gemini-3.1-flash-image', 'gemini-3.1-flash-lite-image'];
      for (const modelName of models) {
        try {
          const response = await callWithRetry(
            () => ai.models.generateContent({
              model: modelName,
              contents,
              config: {
                imageConfig: modelName.includes('lite')
                  ? { aspectRatio: aspectRatio as never }
                  : { aspectRatio: aspectRatio as never, imageSize: '1K' },
              },
            }),
            1,
            600
          );

          for (const part of response?.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData?.data) {
              const outputMime = part.inlineData.mimeType || 'image/png';
              return res.json({ imageUrl: `data:${outputMime};base64,${part.inlineData.data}`, modelUsed: modelName });
            }
          }
        } catch {
          // Try next image model.
        }
      }
    } catch {
      // Fall through to local SVG.
    }

    return res.json({
      imageUrl: generateFallbackSvg(prompt, aspectRatio),
      isFallback: true,
      note: 'Gemini image generation is unavailable; a local fallback template was created.',
    });
  });
}
