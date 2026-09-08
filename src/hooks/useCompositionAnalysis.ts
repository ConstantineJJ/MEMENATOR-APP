import { useCallback, useEffect, useRef, useState } from 'react';
import { CompositionAnalysis } from '../types';
import { getImagePayloadFromUrl } from '../utils/imageHelper';

/**
 * Owns composition-analysis requests and the once-per-image guard. Keeping this
 * outside App makes Gemini quota-sensitive behavior easier to reason about and test.
 */
export function useCompositionAnalysis(activeImageSrc: string) {
  const [compositionAnalysis, setCompositionAnalysis] = useState<CompositionAnalysis | null>(null);
  const [isAnalyzingComposition, setIsAnalyzingComposition] = useState(false);
  const lastAnalyzedSrcRef = useRef<string>('');

  const runCompositionAnalysis = useCallback(async (customSrc?: string) => {
    const srcToUse = customSrc || activeImageSrc;
    if (!srcToUse) return;

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
        }),
      });

      if (!response.ok) throw new Error('Analysis server error');

      const data = await response.json();
      if (data.analysis) setCompositionAnalysis(data.analysis as CompositionAnalysis);
    } catch (err) {
      console.warn('Composition analysis error:', err);
    } finally {
      setIsAnalyzingComposition(false);
    }
  }, [activeImageSrc]);

  useEffect(() => {
    if (!activeImageSrc || lastAnalyzedSrcRef.current === activeImageSrc) return;
    lastAnalyzedSrcRef.current = activeImageSrc;
    void runCompositionAnalysis(activeImageSrc);
  }, [activeImageSrc, runCompositionAnalysis]);

  return {
    compositionAnalysis,
    isAnalyzingComposition,
    runCompositionAnalysis,
  };
}
