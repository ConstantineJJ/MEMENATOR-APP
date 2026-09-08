import { Type } from '@google/genai';
import type { Express, NextFunction, Request, Response } from 'express';
import { callWithRetry, getGeminiClient } from '../gemini';
import {
  buildMagicCaptionPrompt,
  type CompositionPromptContext,
  type RecentCaptionIdea,
} from '../humorPrompts';

interface CaptionResult {
  headline: string;
  topText: string;
  bottomText: string;
  style: string;
  humorMechanic: string;
  imageConnection: string;
  explanation: string;
  visualContradiction: string;
  spottedDetail: string;
  detectedMood: string;
}

const STYLE_NAMES_EN: Record<string, string> = {
  trending: 'Trends / Viral',
  roast: 'Roast',
  relatable: 'Relatable / Everyday',
  work: 'Work / Office & IT',
  millennials: 'Millennials / 90s & 2000s kids',
  genz: 'Gen Z / Post-irony',
  sarcastic: 'Sarcasm / Irony',
  wholesome: 'Wholesome',
  philosophy: 'Late-night thoughts',
  gaming: 'Gaming',
  dating: 'Relationships',
  cinema: 'Cinema / Drama',
  absurd: 'Absurd / Shitposting',
};

const ENGLISH_FALLBACKS: Array<[string, string, string]> = [
  [
    'One second before consequences',
    'WHEN YOU ALREADY KNOW THE IDEA WAS QUESTIONABLE',
    'BUT EVERYONE IS WATCHING SO NOW IT IS A COMMITMENT',
  ],
  [
    'The theory looked great',
    'ON PAPER THIS WAS AN EXTREMELY CONVINCING PLAN',
    'REALITY ARRIVED WITHOUT READING THE DOCUMENTATION',
  ],
  [
    'The face gave it away',
    'WHEN YOU ARE STILL PRETENDING EVERYTHING IS UNDER CONTROL',
    'BUT YOUR EXPRESSION HAS ALREADY FILED A FULL REPORT',
  ],
];

const ENGLISH_MECHANICS = ['Observation', 'Contrast', 'Unexpected interpretation'] as const;

function englishStyleName(styleId: string): string {
  return STYLE_NAMES_EN[styleId] ?? STYLE_NAMES_EN.trending ?? 'Trends / Viral';
}

function fallbackMechanic(index: number): string {
  return ENGLISH_MECHANICS[index % ENGLISH_MECHANICS.length] ?? 'Observation';
}

function normalizeEnglishCaption(value: unknown, styleId: string, index: number): CaptionResult | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const topText = typeof raw.topText === 'string' ? raw.topText.trim() : '';
  const bottomText = typeof raw.bottomText === 'string' ? raw.bottomText.trim() : '';
  if (!topText && !bottomText) return null;

  return {
    headline:
      typeof raw.headline === 'string' && raw.headline.trim()
        ? raw.headline.trim()
        : `Idea ${index + 1}`,
    topText,
    bottomText,
    style:
      typeof raw.style === 'string' && raw.style.trim()
        ? raw.style.trim()
        : englishStyleName(styleId),
    humorMechanic:
      typeof raw.humorMechanic === 'string' && raw.humorMechanic.trim()
        ? raw.humorMechanic.trim()
        : fallbackMechanic(index),
    imageConnection:
      typeof raw.imageConnection === 'string' && raw.imageConnection.trim()
        ? raw.imageConnection.trim()
        : 'The idea is anchored to a visible detail in the current image.',
    explanation:
      typeof raw.explanation === 'string' && raw.explanation.trim()
        ? raw.explanation.trim()
        : 'The setup and punchline contrast expectation with what is visible in the frame.',
    visualContradiction:
      typeof raw.visualContradiction === 'string' && raw.visualContradiction.trim()
        ? raw.visualContradiction.trim()
        : 'A serious presentation clashes with the comic situation.',
    spottedDetail:
      typeof raw.spottedDetail === 'string' && raw.spottedDetail.trim()
        ? raw.spottedDetail.trim()
        : 'A visible pose, expression, or prop drives the idea.',
    detectedMood:
      typeof raw.detectedMood === 'string' && raw.detectedMood.trim()
        ? raw.detectedMood.trim()
        : 'Dry comic tension.',
  };
}

function buildEnglishFallbackCaptions(styleId: string, customContext = ''): CaptionResult[] {
  const context = customContext.trim();
  const style = englishStyleName(styleId);

  return ENGLISH_FALLBACKS.map(([headline, topText, bottomText], index) => ({
    headline: context && index === 0 ? `${headline}: ${context}` : headline,
    topText,
    bottomText,
    style,
    humorMechanic: fallbackMechanic(index),
    imageConnection:
      'Local fallback: regenerate after Gemini recovers for precise image-specific grounding.',
    explanation:
      'This reserve caption keeps the editor usable while the model is temporarily unavailable.',
    visualContradiction:
      'Fallback mode does not perform full visual analysis.',
    spottedDetail:
      'A precise image detail is unavailable without the vision model.',
    detectedMood: 'Fallback mode.',
  }));
}

function finalizeEnglishCaptions(
  values: unknown[],
  styleId: string,
  customContext: string
): CaptionResult[] {
  const normalized = values
    .map((value, index) => normalizeEnglishCaption(value, styleId, index))
    .filter((value): value is CaptionResult => Boolean(value));

  const unique: CaptionResult[] = [];
  const signatures = new Set<string>();
  for (const caption of normalized) {
    const signature = `${caption.topText}|${caption.bottomText}`.toLowerCase();
    if (signatures.has(signature)) continue;
    signatures.add(signature);
    unique.push(caption);
    if (unique.length === 3) break;
  }

  if (unique.length < 3) {
    for (const fallback of buildEnglishFallbackCaptions(styleId, customContext)) {
      const signature = `${fallback.topText}|${fallback.bottomText}`.toLowerCase();
      if (signatures.has(signature)) continue;
      signatures.add(signature);
      unique.push(fallback);
      if (unique.length === 3) break;
    }
  }

  return unique.slice(0, 3);
}

const captionSchema = {
  type: Type.ARRAY,
  description: 'Exactly three strong, distinct, image-grounded meme ideas in English.',
  minItems: 3,
  maxItems: 3,
  items: {
    type: Type.OBJECT,
    properties: {
      headline: { type: Type.STRING },
      topText: { type: Type.STRING },
      bottomText: { type: Type.STRING },
      style: { type: Type.STRING },
      humorMechanic: { type: Type.STRING },
      imageConnection: { type: Type.STRING },
      explanation: { type: Type.STRING },
      visualContradiction: { type: Type.STRING },
      spottedDetail: { type: Type.STRING },
      detectedMood: { type: Type.STRING },
    },
    required: [
      'headline',
      'topText',
      'bottomText',
      'style',
      'humorMechanic',
      'imageConnection',
      'explanation',
      'visualContradiction',
      'spottedDetail',
      'detectedMood',
    ],
  },
};

function buildEnglishPrompt(
  styleId: string,
  customContext: string,
  compositionContext: CompositionPromptContext | undefined,
  recentCaptions: RecentCaptionIdea[]
): string {
  const basePrompt = buildMagicCaptionPrompt({
    styleId,
    customContext,
    compositionContext,
    recentCaptions,
  });

  return `${basePrompt}\n\nFINAL OUTPUT LANGUAGE OVERRIDE — HIGHEST PRIORITY:\nThe product UI language is English. Return ALL user-visible JSON string values in natural, idiomatic English only. This requirement overrides any earlier Russian-language instruction in the base brief. Do not output Russian words in headline, topText, bottomText, style, humorMechanic, imageConnection, explanation, visualContradiction, spottedDetail, or detectedMood. Adapt cultural references for an English-speaking internet audience when needed instead of translating Russian phrasing literally. Keep meme captions concise, punchy, and natural. Return exactly three objects and JSON only.`;
}

/**
 * Handles English caption requests before the legacy Russian route. Requests
 * for any other language call next() and are processed by the existing route,
 * so Russian behavior remains untouched.
 */
export function registerEnglishMagicCaptionRoute(app: Express) {
  app.post(
    '/api/magic-caption',
    async (req: Request, res: Response, next: NextFunction) => {
      if (req.body?.language !== 'en') {
        next();
        return;
      }

      const {
        imageBase64,
        mimeType = 'image/jpeg',
        style = 'trending',
        customContext = '',
        compositionContext,
        recentCaptions = [],
      } = req.body || {};

      const safeStyle = typeof style === 'string' && style.trim() ? style.trim() : 'trending';
      const safeContext =
        typeof customContext === 'string' ? customContext.trim().slice(0, 300) : '';
      const safeRecent: RecentCaptionIdea[] = Array.isArray(recentCaptions)
        ? recentCaptions.slice(0, 9).filter((item) => item && typeof item === 'object')
        : [];

      if (typeof imageBase64 !== 'string' || !imageBase64) {
        res.status(400).json({ error: 'imageBase64 is required.' });
        return;
      }

      try {
        const cleanBase64 = imageBase64.replace(
          /^data:[a-zA-Z0-9/+.\-]+;base64,/,
          ''
        );
        const ai = getGeminiClient();
        const prompt = buildEnglishPrompt(
          safeStyle,
          safeContext,
          compositionContext as CompositionPromptContext | undefined,
          safeRecent
        );

        const modelsToTry = [
          'gemini-3.1-pro-preview',
          'gemini-flash-latest',
          'gemini-3.8-flash',
          'gemini-3.1-flash-lite',
        ];

        for (const modelName of modelsToTry) {
          try {
            const response = await callWithRetry(
              () =>
                ai.models.generateContent({
                  model: modelName,
                  contents: {
                    parts: [
                      {
                        inlineData: {
                          mimeType: typeof mimeType === 'string' ? mimeType : 'image/jpeg',
                          data: cleanBase64,
                        },
                      },
                      { text: prompt },
                    ],
                  },
                  config: {
                    responseMimeType: 'application/json',
                    responseSchema: captionSchema,
                    temperature: 1.15,
                  },
                }),
              1,
              700
            );

            if (!response?.text) continue;

            let parsed: unknown;
            try {
              parsed = JSON.parse(response.text);
            } catch {
              const match = response.text.match(/\[[\s\S]*\]/);
              parsed = match ? JSON.parse(match[0]) : null;
            }

            if (Array.isArray(parsed) && parsed.length > 0) {
              res.json({
                captions: finalizeEnglishCaptions(parsed, safeStyle, safeContext),
                modelUsed: modelName,
              });
              return;
            }
          } catch {
            // Try the next supported model.
          }
        }

        res.json({
          captions: buildEnglishFallbackCaptions(safeStyle, safeContext),
          isFallback: true,
          notice: 'Gemini is temporarily unavailable; loaded three local English reserve captions.',
        });
      } catch {
        res.json({
          captions: buildEnglishFallbackCaptions(safeStyle, safeContext),
          isFallback: true,
          notice: 'Gemini is temporarily unavailable; loaded three local English reserve captions.',
        });
      }
    }
  );
}
