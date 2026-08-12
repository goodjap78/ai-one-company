const RECENT_KEYS_MAX = 8;

let recentReasonKeys: string[] = [];

export type ReasonVariant<T extends string = string> = {
  key: T;
  text: string;
};

/** Pick a variant that was not shown recently; falls back when all were used. */
export function pickReasonVariant<T extends ReasonVariant>(
  variants: T[],
  seed: number,
): T {
  if (variants.length === 0) {
    throw new Error('pickReasonVariant requires at least one variant');
  }

  const fresh = variants.filter((variant) => !recentReasonKeys.includes(variant.key));
  const pool = fresh.length > 0 ? fresh : variants;
  const picked = pool[((seed % pool.length) + pool.length) % pool.length];

  recentReasonKeys = [picked.key, ...recentReasonKeys.filter((key) => key !== picked.key)].slice(
    0,
    RECENT_KEYS_MAX,
  );

  return picked;
}

/** Deterministic seed from menu + situation — shifts on refresh and meal change. */
export function buildReasonSeed(
  menuId: string,
  hourOfDay: number,
  rank: number,
  noteCount: number,
): number {
  const idSeed = menuId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return idSeed + hourOfDay * 11 + rank * 17 + noteCount * 3;
}

/** @internal Test helper */
export function resetReasonRotationForTests(): void {
  recentReasonKeys = [];
}
