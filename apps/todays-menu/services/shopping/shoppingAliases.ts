/**
 * Sprint 63-B — Shopping keyword aliases (catalog-derived, minimal).
 * Separate from IIE canonicalization — shopping intent may differ (e.g. 밥 ≠ 쌀).
 */

/** Exact match on normalized ingredient display name. */
export const SHOPPING_KEYWORD_ALIASES: Record<string, string> = {
  다진마늘: '다진 마늘',
  삶은계란: '삶은 계란',
};
