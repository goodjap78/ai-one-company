const DEFAULT_MAX_WORDS = 12;
const RECOMMENDATION_MAX_CHARS = 96;

/** Keep home-facing sentences short and scannable. */
export function clampVisibleSentence(text: string, maxWords = DEFAULT_MAX_WORDS): string {
  const normalized = text.trim().replace(/\s+/g, ' ');
  if (!normalized) return normalized;

  const units = normalized.split(' ');
  if (units.length <= maxWords) return normalized;

  return `${units.slice(0, maxWords).join(' ')}…`;
}

/** RC2 — allow one full natural recommendation sentence on Home. */
export function clampRecommendationSentence(text: string, maxChars = RECOMMENDATION_MAX_CHARS): string {
  const normalized = text.trim().replace(/\s+/g, ' ');
  if (!normalized || normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, maxChars - 1)}…`;
}
