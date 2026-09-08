import { useCallback, useRef, useState } from 'react';
import { CaptionSuggestion, CompositionAnalysis } from '../types';
import { selectBestCaptionSuggestions } from '../utils/captionSelector';
import { getImagePayloadFromUrl } from '../utils/imageHelper';

interface UseMagicCaptionsOptions {
  activeImageSrc: string;
  compositionAnalysis: CompositionAnalysis | null;
  onGenerated?: (captions: CaptionSuggestion[]) => void;
}

const RECENT_CAPTIONS_PREFIX = 'memenator:recent-captions:';
const DISPLAY_LIMIT = 3;
const RECENT_LIMIT = 9;

function loadRecentCaptions(style: string): CaptionSuggestion[] {
  try {
    const raw = sessionStorage.getItem(`${RECENT_CAPTIONS_PREFIX}${style}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, RECENT_LIMIT) : [];
  } catch {
    return [];
  }
}

function rememberCaptions(style: string, captions: CaptionSuggestion[]) {
  try {
    const previous = loadRecentCaptions(style);
    const next = [...captions, ...previous].slice(0, RECENT_LIMIT);
    sessionStorage.setItem(`${RECENT_CAPTIONS_PREFIX}${style}`, JSON.stringify(next));
  } catch {
    // Session storage is only a diversity aid; generation must never depend on it.
  }
}

/**
 * Owns Gemini caption state and the in-flight request guard. The model can
 * return a wider candidate pool, while the hook curates it down to three
 * stronger and less repetitive suggestions for the user.
 */
export function useMagicCaptions({
  activeImageSrc,
  compositionAnalysis,
  onGenerated,
}: UseMagicCaptionsOptions) {
  const [captions, setCaptions] = useState<CaptionSuggestion[]>([]);
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
  const [captionError, setCaptionError] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('trending');
  const [customContext, setCustomContext] = useState('');
  const requestInFlightRef = useRef(false);

  const clearCaptions = useCallback(() => {
    setCaptions([]);
    setCaptionError(null);
  }, []);

  const generateMagicCaptions = useCallback(async (overrideStyle?: string) => {
    if (requestInFlightRef.current) return;
    requestInFlightRef.current = true;
    setIsGeneratingCaptions(true);
    setCaptionError(null);

    const styleToUse =
      typeof overrideStyle === 'string' && overrideStyle ? overrideStyle : selectedStyle;

    try {
      const imagePayload = await getImagePayloadFromUrl(activeImageSrc);
      if (!imagePayload) {
        throw new Error('Не удалось подготовить изображение для анализа.');
      }

      const compositionPayload = compositionAnalysis
        ? {
            detectedStyle: compositionAnalysis.detectedStyle,
            balanceAssessment: compositionAnalysis.balanceAssessment,
            focalSubjects: compositionAnalysis.focalSubjects?.map((subject) => ({
              name: subject.name,
              role: subject.role,
              gazeDirection: subject.gazeDirection,
              description: subject.description,
            })),
            recommendations: compositionAnalysis.recommendations?.slice(0, 3),
          }
        : undefined;

      const response = await fetch('/api/magic-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePayload.dataUrl,
          mimeType: imagePayload.mimeType,
          style: styleToUse,
          customContext: customContext.trim(),
          compositionContext: compositionPayload,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при генерации подписей.');
      }

      if (!Array.isArray(data.captions)) {
        throw new Error('Получен некорректный ответ от модели.');
      }

      const rawCaptions = data.captions as CaptionSuggestion[];
      const nextCaptions = selectBestCaptionSuggestions(rawCaptions, {
        limit: DISPLAY_LIMIT,
        recentCaptions: loadRecentCaptions(styleToUse),
        styleId: styleToUse,
      });

      setCaptions(nextCaptions);
      rememberCaptions(styleToUse, nextCaptions);
      onGenerated?.(nextCaptions);
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : 'Не удалось получить подписи от ИИ. Попробуйте еще раз.';
      setCaptionError(message);
    } finally {
      requestInFlightRef.current = false;
      setIsGeneratingCaptions(false);
    }
  }, [activeImageSrc, selectedStyle, customContext, compositionAnalysis, onGenerated]);

  return {
    captions,
    isGeneratingCaptions,
    captionError,
    selectedStyle,
    setSelectedStyle,
    customContext,
    setCustomContext,
    generateMagicCaptions,
    clearCaptions,
  };
}
