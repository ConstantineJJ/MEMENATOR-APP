import { GoogleGenAI } from '@google/genai';

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the environment.');
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'memenator-app',
      },
    },
  });
}

export function parseErrorMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred.';

  const raw = error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : JSON.stringify(error);

  try {
    const parsed = typeof raw === 'string' && (raw.startsWith('{') || raw.includes('{"error"'))
      ? JSON.parse(raw)
      : null;
    if (parsed?.error?.message) return parsed.error.message;
  } catch {
    // Fall back to the original error string.
  }

  return raw;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function callWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 2,
  delayMs = 600
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const message = parseErrorMessage(error).toLowerCase();
      const transient =
        message.includes('503') ||
        message.includes('429') ||
        message.includes('resource_exhausted') ||
        message.includes('high demand') ||
        message.includes('unavailable') ||
        message.includes('overloaded');

      if (!transient || attempt >= maxRetries) throw error;
      await wait(delayMs * (attempt + 1));
    }
  }

  throw lastError;
}
