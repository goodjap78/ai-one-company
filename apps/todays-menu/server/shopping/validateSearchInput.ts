export const COUPANG_SEARCH_KEYWORD_MAX_LENGTH = 100;
export const COUPANG_SEARCH_LIMIT_MAX = 10;
export const COUPANG_SEARCH_LIMIT_DEFAULT = 3;

export type ValidatedCoupangSearchInput = {
  keyword: string;
  limit: number;
};

export function validateCoupangSearchKeyword(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const keyword = raw.trim();
  if (!keyword) return null;
  if (keyword.length > COUPANG_SEARCH_KEYWORD_MAX_LENGTH) return null;
  if (/[\u0000-\u001f\u007f]/.test(keyword)) return null;
  return keyword;
}

export function validateCoupangSearchLimit(
  raw: unknown,
  maxLimit = COUPANG_SEARCH_LIMIT_MAX,
): number {
  const parsed =
    typeof raw === 'number'
      ? raw
      : typeof raw === 'string' && raw.trim()
        ? Number(raw)
        : COUPANG_SEARCH_LIMIT_DEFAULT;

  if (!Number.isFinite(parsed)) return COUPANG_SEARCH_LIMIT_DEFAULT;

  const clampedMax = Math.min(maxLimit, COUPANG_SEARCH_LIMIT_MAX);
  const limit = Math.floor(parsed);
  if (limit < 1) return 1;
  if (limit > clampedMax) return clampedMax;
  return limit;
}

export function validateCoupangSearchInput(
  body: { keyword?: unknown; limit?: unknown },
  maxLimit = COUPANG_SEARCH_LIMIT_MAX,
): ValidatedCoupangSearchInput | null {
  const keyword = validateCoupangSearchKeyword(body.keyword);
  if (!keyword) return null;
  const limit = validateCoupangSearchLimit(body.limit, maxLimit);
  return { keyword, limit };
}
