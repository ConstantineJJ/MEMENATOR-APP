import { useState, useCallback, useEffect } from 'react';
import { GeneratedMemeImage } from '../types';

const STORAGE_KEY = 'memenator_generated_images_v1';
const MAX_STORED_IMAGES = 6;
const MAX_SESSION_IMAGES = 10;

function loadStoredGenerations(): GeneratedMemeImage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item) => item && typeof item.imageUrl === 'string' && typeof item.prompt === 'string'
      );
    }
  } catch {
    // Ignore storage parse errors
  }
  return [];
}

function saveStoredGenerations(items: GeneratedMemeImage[]) {
  try {
    const trimmed = items.slice(0, MAX_STORED_IMAGES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Gracefully ignore QuotaExceededError
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Не удалось преобразовать изображение для редактирования.'));
    };
    reader.onerror = () => reject(reader.error || new Error('Не удалось прочитать изображение.'));
    reader.readAsDataURL(blob);
  });
}

async function normalizeSourceImageForEdit(source: string): Promise<string> {
  if (/^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(source)) {
    return source;
  }

  let response: Response;
  if (/^https?:\/\//i.test(source)) {
    response = await fetch(`/api/proxy-image?url=${encodeURIComponent(source)}`);
  } else {
    response = await fetch(source);
  }

  if (!response.ok) {
    throw new Error('Не удалось подготовить текущее изображение для редактирования.');
  }

  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) {
    throw new Error('Текущее содержимое не является изображением.');
  }
  return blobToDataUrl(blob);
}

export function useImageGeneration() {
  const [history, setHistory] = useState<GeneratedMemeImage[]>(() => loadStoredGenerations());
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    saveStoredGenerations(history);
  }, [history]);

  const generateImage = useCallback(
    async (params: {
      prompt: string;
      aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
      sourceImageBase64?: string;
      mode?: 'create' | 'edit';
    }): Promise<GeneratedMemeImage | null> => {
      const { prompt, aspectRatio = '1:1', sourceImageBase64, mode = 'create' } = params;
      const trimmedPrompt = prompt.trim();
      if (!trimmedPrompt) {
        setError('Пожалуйста, укажите описание для генерации картинки.');
        return null;
      }

      setIsGenerating(true);
      setError(null);

      try {
        const payload: Record<string, unknown> = {
          prompt: trimmedPrompt,
          aspectRatio,
        };

        if (mode === 'edit' && sourceImageBase64) {
          payload.sourceImageBase64 = await normalizeSourceImageForEdit(sourceImageBase64);
        }

        const response = await fetch('/api/generate-template-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Ошибка сервера (${response.status})`);
        }

        const data = await response.json();
        if (!data.imageUrl) {
          throw new Error('Сервер не вернул изображение');
        }

        const newImage: GeneratedMemeImage = {
          id: `gen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          imageUrl: data.imageUrl,
          prompt: trimmedPrompt,
          aspectRatio,
          createdAt: Date.now(),
          modelUsed: data.modelUsed || (data.isFallback ? 'Fallback' : 'gemini-3.1-flash-image'),
          isFallback: Boolean(data.isFallback),
          sourceMode: mode,
        };

        setHistory((prev) => [newImage, ...prev.filter((item) => item.imageUrl !== newImage.imageUrl)].slice(0, MAX_SESSION_IMAGES));
        return newImage;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Не удалось сгенерировать мем-картинку';
        setError(msg);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const deleteGeneratedImage = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  return {
    isGenerating,
    error,
    history,
    latestImage: history[0] || null,
    generateImage,
    deleteGeneratedImage,
    clearHistory,
  };
}
