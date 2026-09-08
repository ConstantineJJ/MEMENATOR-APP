import { useCallback, useRef, useState } from 'react';
import { CaptionSuggestion, CompositionAnalysis } from '../types';
import { getImagePayloadFromUrl } from '../utils/imageHelper';

interface UseMagicCaptionsOptions {
  activeImageSrc: string;
  compositionAnalysis: CompositionAnalysis | null;
  onGenerated?: (captions: CaptionSuggestion[]) => void;
}

/**
 * Owns Gemini caption state and the in-flight request guard. Keeping the whole
 * caption feature in one hook prevents App from mixing API transport, loading
 * state and UI orchestration, and preserves the single-request quota safeguard.
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

      const nextCaptions = data.captions as CaptionSuggestion[];
      setCaptions(nextCaptions);
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
