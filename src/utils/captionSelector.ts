import { CaptionSuggestion } from '../types';

const STOP_WORDS = new Set([
  'когда', 'только', 'чтобы', 'этот', 'эта', 'это', 'того', 'как', 'что', 'моя', 'мой', 'мне',
  'его', 'ее', 'для', 'или', 'уже', 'вот', 'там', 'тут', 'при', 'про', 'над', 'под', 'без', 'если',
  'then', 'this', 'that', 'when', 'with', 'from', 'your', 'you', 'the', 'and', 'for', 'but',
]);

export interface CaptionSelectionOptions {
  limit?: number;
  recentCaptions?: CaptionSuggestion[];
}

function tokenize(value: string): Set<string> {
  const words = value
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s]/gi, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
  return new Set(words);
}

function captionText(caption: CaptionSuggestion): string {
  return [
    caption.headline,
    caption.topText,
    caption.bottomText,
    caption.spottedDetail,
    caption.visualContradiction,
  ].filter(Boolean).join(' ');
}

export function captionSimilarity(a: CaptionSuggestion, b: CaptionSuggestion): number {
  const left = tokenize(captionText(a));
  const right = tokenize(captionText(b));
  if (left.size === 0 || right.size === 0) return 0;

  let intersection = 0;
  for (const word of left) {
    if (right.has(word)) intersection += 1;
  }
  const union = left.size + right.size - intersection;
  return union > 0 ? intersection / union : 0;
}

function intrinsicQuality(caption: CaptionSuggestion): number {
  let score = 0;
  if (caption.topText?.trim()) score += 1;
  if (caption.bottomText?.trim()) score += 2;
  if ((caption.imageConnection?.trim().length ?? 0) >= 24) score += 2;
  if ((caption.spottedDetail?.trim().length ?? 0) >= 8) score += 1.5;
  if ((caption.visualContradiction?.trim().length ?? 0) >= 12) score += 1.5;
  if ((caption.explanation?.trim().length ?? 0) >= 12) score += 0.5;
  if (caption.humorMechanic?.trim()) score += 1;

  const totalTextLength = (caption.topText?.length ?? 0) + (caption.bottomText?.length ?? 0);
  if (totalTextLength > 190) score -= 1.5;
  if (totalTextLength < 20) score -= 1;
  return score;
}

/**
 * Picks a small set of the strongest caption candidates while penalizing
 * near-duplicates within the current batch and ideas that are too close to
 * recently shown captions. The model may still over-generate candidates, but
 * the UI only receives a compact, diverse shortlist.
 */
export function selectBestCaptionSuggestions(
  captions: CaptionSuggestion[],
  options: CaptionSelectionOptions = {}
): CaptionSuggestion[] {
  const limit = Math.max(1, options.limit ?? 3);
  const recent = options.recentCaptions ?? [];
  const remaining = captions.filter((caption) => caption.topText || caption.bottomText);
  const selected: CaptionSuggestion[] = [];

  while (remaining.length > 0 && selected.length < limit) {
    let bestIndex = 0;
    let bestScore = Number.NEGATIVE_INFINITY;

    remaining.forEach((candidate, index) => {
      const batchSimilarity = selected.length > 0
        ? Math.max(...selected.map((chosen) => captionSimilarity(candidate, chosen)))
        : 0;
      const recentSimilarity = recent.length > 0
        ? Math.max(...recent.map((old) => captionSimilarity(candidate, old)))
        : 0;
      const mechanicDuplicate = selected.some(
        (chosen) => chosen.humorMechanic && chosen.humorMechanic === candidate.humorMechanic
      );

      const diversityScore = (1 - batchSimilarity) * 3.2 + (1 - recentSimilarity) * 2.4;
      const mechanicBonus = mechanicDuplicate ? -0.9 : 0.9;
      const score = intrinsicQuality(candidate) + diversityScore + mechanicBonus;

      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    selected.push(remaining.splice(bestIndex, 1)[0]);
  }

  return selected;
}
