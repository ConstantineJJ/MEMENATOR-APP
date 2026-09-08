import { useCallback, useEffect, useRef, useState } from 'react';
import { CaptionSuggestion, CompositionAnalysis } from '../types';
import { selectBestCaptionSuggestions } from '../utils/captionSelector';
import { getImagePayloadFromUrl } from '../utils/imageHelper';
import { useUiPreferences, type UiLanguage } from '../uiPreferences';

interface UseMagicCaptionsOptions {
  activeImageSrc: string;
  compositionAnalysis: CompositionAnalysis | null;
  onGenerated?: (captions: CaptionSuggestion[]) => void;
}

const RECENT_CAPTIONS_PREFIX = 'memenator:recent-captions:';
const DISPLAY_LIMIT = 3;
const RECENT_LIMIT = 9;

function recentStorageKey(style: string, language: UiLanguage): string {
  return `${RECENT_CAPTIONS_PREFIX}${language}:${style}`;
}

function loadRecentCaptions(style: string, language: UiLanguage): CaptionSuggestion[] {
  try {
    const raw = sessionStorage.getItem(recentStorageKey(style, language));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, RECENT_LIMIT) : [];
  } catch {
    return [];
  }
}

function rememberCaptions(style: string, language: UiLanguage, captions: CaptionSuggestion[]) {
  try {
    const previous = loadRecentCaptions(style, language);
    const next = [...captions, ...previous].slice(0, RECENT_LIMIT);
    sessionStorage.setItem(recentStorageKey(style, language), JSON.stringify(next));
  } catch {
    // Session storage is only a diversity aid; generation must never depend on it.
  }
}

/**
 * Owns Gemini caption state and the in-flight request guard. Caption history is
 * isolated by both humor style and UI language, so Russian ideas never leak
 * into English diversity memory (and vice versa).
 */
export function useMagicCaptions({
  activeImageSrc,
  compositionAnalysis,
  onGenerated,
}: UseMagicCaptionsOptions) {
  const { language, tr } = useUiPreferences();
  const [captions, setCaptions] = useState<CaptionSuggestion[]>([]);
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
  const [captionError, setCaptionError] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('trending');
  const [customContext, setCustomContext] = useState('');
  const requestInFlightRef = useRef(false);
  const activeLanguageRef = useRef<UiLanguage>(language);

  const clearCaptions = useCallback(() => {
    setCaptions([]);
    setCaptionError(null);
  }, []);

  useEffect(() => {
    activeLanguageRef.current = language;
    // Existing suggestions belong to the previous language. Clearing them is
    // safer than machine-translating punchlines after generation.
    clearCaptions();
  }, [clearCaptions, language]);

  const generateMagicCaptions = useCallback(async (overrideStyle?: string) => {
    if (requestInFlightRef.current) return;
    requestInFlightRef.current = true;
    setIsGeneratingCaptions(true);
    setCaptionError(null);

    const requestLanguage = language;
    const styleToUse =
      typeof overrideStyle === 'string' && overrideStyle ? overrideStyle : selectedStyle;

    try {
      const imagePayload = await getImagePayloadFromUrl(activeImageSrc);
      if (!imagePayload) {
        throw new Error(tr(
          'Не удалось подготовить изображение для анализа.',
          'Could not prepare the image for analysis.'
        ));
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

      const recentForStyle = loadRecentCaptions(styleToUse, requestLanguage);
      const response = await fetch('/api/magic-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePayload.dataUrl,
          mimeType: imagePayload.mimeType,
          style: styleToUse,
          language: requestLanguage,
          customContext: customContext.trim(),
          compositionContext: compositionPayload,
          recentCaptions: recentForStyle.map((caption) => ({
            headline: caption.headline,
            topText: caption.topText,
            bottomText: caption.bottomText,
            humorMechanic: caption.humorMechanic,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || tr('Ошибка при генерации подписей.', 'Caption generation failed.'));
      }

      if (!Array.isArray(data.captions)) {
        throw new Error(tr('Получен некорректный ответ от модели.', 'The model returned an invalid response.'));
      }

      // Ignore a late response if the user switched languages while Gemini was working.
      if (activeLanguageRef.current !== requestLanguage) return;

      const rawCaptions = data.captions as CaptionSuggestion[];
      const nextCaptions = selectBestCaptionSuggestions(rawCaptions, {
        limit: DISPLAY_LIMIT,
        recentCaptions: recentForStyle,
        styleId: styleToUse,
      });

      setCaptions(nextCaptions);
      rememberCaptions(styleToUse, requestLanguage, nextCaptions);
      onGenerated?.(nextCaptions);
    } catch (err) {
      if (activeLanguageRef.current !== requestLanguage) return;
      const message = err instanceof Error
        ? err.message
        : tr(
            'Не удалось получить подписи от ИИ. Попробуйте еще раз.',
            'Could not get AI captions. Please try again.'
          );
      setCaptionError(message);
    } finally {
      requestInFlightRef.current = false;
      setIsGeneratingCaptions(false);
    }
  }, [activeImageSrc, selectedStyle, customContext, compositionAnalysis, onGenerated, language, tr]);

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
