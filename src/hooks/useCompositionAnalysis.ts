import { useCallback, useEffect, useRef, useState } from 'react';
import { CompositionAnalysis } from '../types';
import { getImagePayloadFromUrl } from '../utils/imageHelper';
import { useUiPreferences } from '../uiPreferences';

/**
 * Owns composition-analysis requests and the once-per-image/language guard.
 * Analysis text is requested in the active UI language so English mode never
 * receives Russian balance assessments, subject descriptions, or tips.
 */
export function useCompositionAnalysis(activeImageSrc: string) {
  const { language } = useUiPreferences();
  const [compositionAnalysis, setCompositionAnalysis] = useState<CompositionAnalysis | null>(null);
  const [isAnalyzingComposition, setIsAnalyzingComposition] = useState(false);
  const lastAnalysisKeyRef = useRef<string>('');
  const activeLanguageRef = useRef(language);

  useEffect(() => {
    activeLanguageRef.current = language;
  }, [language]);

  const runCompositionAnalysis = useCallback(async (customSrc?: string) => {
    const srcToUse = customSrc || activeImageSrc;
    if (!srcToUse) return;

    const requestLanguage = language;
    setIsAnalyzingComposition(true);
    try {
      const imagePayload = await getImagePayloadFromUrl(srcToUse);
      if (!imagePayload) return;

      const response = await fetch('/api/analyze-composition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePayload.dataUrl,
          mimeType: imagePayload.mimeType,
          width: imagePayload.width,
          height: imagePayload.height,
          language: requestLanguage,
        }),
      });

      if (!response.ok) throw new Error('Analysis server error');

      const data = await response.json();
      if (activeLanguageRef.current !== requestLanguage) return;
      if (data.analysis) setCompositionAnalysis(data.analysis as CompositionAnalysis);
    } catch (err) {
      console.warn('Composition analysis error:', err);
    } finally {
      if (activeLanguageRef.current === requestLanguage) {
        setIsAnalyzingComposition(false);
      }
    }
  }, [activeImageSrc, language]);

  useEffect(() => {
    if (!activeImageSrc) return;
    const analysisKey = `${language}:${activeImageSrc}`;
    if (lastAnalysisKeyRef.current === analysisKey) return;
    lastAnalysisKeyRef.current = analysisKey;
    setCompositionAnalysis(null);
    void runCompositionAnalysis(activeImageSrc);
  }, [activeImageSrc, language, runCompositionAnalysis]);

  return {
    compositionAnalysis,
    isAnalyzingComposition,
    runCompositionAnalysis,
  };
}
