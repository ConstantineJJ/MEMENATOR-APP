import { Type } from '@google/genai';
import type { Express } from 'express';
import { getGeminiClient } from '../gemini';

type AnalysisLanguage = 'ru' | 'en';

interface FallbackFocalSubject {
  name: string;
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  role: string;
  gazeDirection?: string;
  description: string;
}

function getFallbackCompositionAnalysis(
  width = 600,
  height = 600,
  language: AnalysisLanguage = 'ru'
) {
  const isLandscape = width > height;
  const focalSubjects: FallbackFocalSubject[] = [];
  const en = language === 'en';

  return {
    overallScore: 72,
    balanceAssessment: en
      ? isLandscape
        ? 'Heuristic estimate: wide frame without confirmed object recognition.'
        : 'Heuristic estimate: portrait or near-square frame without confirmed object recognition.'
      : isLandscape
        ? 'Эвристика: широкий кадр без подтвержденного распознавания объектов.'
        : 'Эвристика: вертикальный или близкий к квадратному кадр без подтвержденного распознавания объектов.',
    ruleOfThirdsAlignment: 'centered',
    detectedStyle: en
      ? 'Heuristic estimate — Gemini unavailable'
      : 'Эвристическая оценка — Gemini недоступен',
    metrics: {
      visualBalance: 70,
      negativeSpace: 65,
      contrastReadability: 75,
      comedicFocus: 68,
    },
    focalSubjects,
    safeZones: [
      {
        area: 'top',
        box: { x: 6, y: 4, width: 88, height: 16 },
        recommendedTopY: 11,
        contrastQuality: 'medium',
        bgLuminance: 'mixed',
        recommendedTextColor: '#FFFFFF',
        recommendedStrokeColor: '#000000',
        reason: en
          ? 'Heuristic top zone. Check manually that it does not cover a face or important subject.'
          : 'Эвристическая верхняя зона. Проверьте вручную, что она не перекрывает лицо или важный объект.',
      },
      {
        area: 'bottom',
        box: { x: 6, y: 82, width: 88, height: 16 },
        recommendedBottomY: 89,
        contrastQuality: 'medium',
        bgLuminance: 'mixed',
        recommendedTextColor: '#FFFFFF',
        recommendedStrokeColor: '#000000',
        reason: en
          ? 'Heuristic bottom zone. Check manually that it does not cover important details.'
          : 'Эвристическая нижняя зона. Проверьте вручную, что она не перекрывает важные детали.',
      },
    ],
    recommendations: en
      ? [
          'Gemini is unavailable: object coordinates were not recognized.',
          'Check manually that the top and bottom captions do not cover faces or important props.',
          'Use a high-contrast text stroke on complex backgrounds.',
        ]
      : [
          'Gemini недоступен: координаты объектов не распознавались.',
          'Проверьте вручную, что верхний и нижний текст не перекрывают лица и предметы.',
          'Для сложного фона используйте контрастную обводку текста.',
        ],
    suggestedTextPlacements: {
      topTextY: 11,
      bottomTextY: 89,
      align: 'center',
      suggestedFontSize: 36,
      fontRecommendation: en
        ? 'Impact or Montserrat Black with a high-contrast stroke'
        : 'Impact или Montserrat Black с контрастной обводкой',
      reason: en
        ? 'Safe heuristic starting positions without claiming that specific objects were detected.'
        : 'Безопасная эвристическая стартовая позиция без заявлений о распознанных объектах.',
    },
    isFallback: true,
  };
}

const compositionSchema = {
  type: Type.OBJECT,
  properties: {
    overallScore: { type: Type.INTEGER },
    balanceAssessment: { type: Type.STRING },
    ruleOfThirdsAlignment: { type: Type.STRING },
    detectedStyle: { type: Type.STRING },
    metrics: {
      type: Type.OBJECT,
      properties: {
        visualBalance: { type: Type.INTEGER },
        negativeSpace: { type: Type.INTEGER },
        contrastReadability: { type: Type.INTEGER },
        comedicFocus: { type: Type.INTEGER },
      },
      required: ['visualBalance', 'negativeSpace', 'contrastReadability', 'comedicFocus'],
    },
    focalSubjects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          box: {
            type: Type.OBJECT,
            properties: {
              x: { type: Type.NUMBER },
              y: { type: Type.NUMBER },
              width: { type: Type.NUMBER },
              height: { type: Type.NUMBER },
            },
            required: ['x', 'y', 'width', 'height'],
          },
          role: { type: Type.STRING },
          gazeDirection: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ['name', 'box', 'role', 'description'],
      },
    },
    safeZones: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          area: { type: Type.STRING },
          box: {
            type: Type.OBJECT,
            properties: {
              x: { type: Type.NUMBER },
              y: { type: Type.NUMBER },
              width: { type: Type.NUMBER },
              height: { type: Type.NUMBER },
            },
            required: ['x', 'y', 'width', 'height'],
          },
          recommendedTopY: { type: Type.NUMBER },
          recommendedBottomY: { type: Type.NUMBER },
          contrastQuality: { type: Type.STRING },
          bgLuminance: { type: Type.STRING },
          recommendedTextColor: { type: Type.STRING },
          recommendedStrokeColor: { type: Type.STRING },
          reason: { type: Type.STRING },
        },
        required: ['area', 'box', 'contrastQuality', 'bgLuminance', 'recommendedTextColor', 'recommendedStrokeColor', 'reason'],
      },
    },
    recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
    suggestedTextPlacements: {
      type: Type.OBJECT,
      properties: {
        topTextY: { type: Type.NUMBER },
        bottomTextY: { type: Type.NUMBER },
        align: { type: Type.STRING },
        suggestedFontSize: { type: Type.NUMBER },
        fontRecommendation: { type: Type.STRING },
        reason: { type: Type.STRING },
      },
      required: ['topTextY', 'bottomTextY', 'align', 'suggestedFontSize', 'fontRecommendation', 'reason'],
    },
  },
  required: [
    'overallScore',
    'balanceAssessment',
    'ruleOfThirdsAlignment',
    'detectedStyle',
    'metrics',
    'focalSubjects',
    'safeZones',
    'recommendations',
    'suggestedTextPlacements',
  ],
};

function buildCompositionPrompt(language: AnalysisLanguage): string {
  if (language === 'en') {
    return `You are an art director specializing in visual composition and internet memes. Analyze only what is genuinely visible in the image.

Determine:
1. focalSubjects: key faces/objects, their role, gaze direction, and x/y/width/height coordinates as percentages from 0–100.
2. safeZones: real top/bottom areas where captions will not cover faces or important comedic details.
3. overallScore 1–100, balanceAssessment, and metrics: visualBalance, negativeSpace, contrastReadability, comedicFocus.
4. ruleOfThirdsAlignment: strong, moderate, or centered.
5. 3–5 practical recommendations.
6. suggestedTextPlacements: topTextY, bottomTextY, align, suggestedFontSize, fontRecommendation, reason.
7. detectedStyle.

Do not invent a face, gaze, object, or clean text zone if it cannot be seen confidently. Write ALL descriptive string fields in natural English only.`;
  }

  return `Ты — арт-директор по визуальной композиции и мемам. Проанализируй только то, что реально видно на изображении.

Определи:
1. focalSubjects: ключевые лица/объекты, их роль, направление взгляда и координаты x/y/width/height в процентах 0–100.
2. safeZones: реальные области сверху/снизу, где текст не перекрывает лица и ключевые комедийные детали.
3. overallScore 1–100, balanceAssessment и metrics: visualBalance, negativeSpace, contrastReadability, comedicFocus.
4. ruleOfThirdsAlignment: strong, moderate или centered.
5. 3–5 практических рекомендаций.
6. suggestedTextPlacements: topTextY, bottomTextY, align, suggestedFontSize, fontRecommendation, reason.
7. detectedStyle.

Не выдумывай лицо, взгляд, объект или чистую зону, если их нельзя уверенно увидеть. Все текстовые поля пиши по-русски.`;
}

export function registerCompositionRoute(app: Express) {
  app.post('/api/analyze-composition', async (req, res) => {
    const {
      imageBase64,
      mimeType = 'image/jpeg',
      width = 600,
      height = 600,
      language = 'ru',
    } = req.body || {};
    const safeLanguage: AnalysisLanguage = language === 'en' ? 'en' : 'ru';

    if (typeof imageBase64 !== 'string' || !imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required.' });
    }

    try {
      const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
      const ai = getGeminiClient();
      const prompt = buildCompositionPrompt(safeLanguage);

      const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
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
              responseSchema: compositionSchema,
            },
          });

          if (!response?.text) continue;
          try {
            return res.json({ analysis: JSON.parse(response.text), modelUsed: modelName });
          } catch {
            const match = response.text.match(/\{[\s\S]*\}/);
            if (match) return res.json({ analysis: JSON.parse(match[0]), modelUsed: modelName });
          }
        } catch {
          // Try next model.
        }
      }
    } catch {
      // Fall through to honest heuristic fallback.
    }

    return res.json({
      analysis: getFallbackCompositionAnalysis(
        Number(width) || 600,
        Number(height) || 600,
        safeLanguage
      ),
      isFallback: true,
    });
  });
}
