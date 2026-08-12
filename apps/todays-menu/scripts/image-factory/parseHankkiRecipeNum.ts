/**
 * Sprint 60 — Parse HANKKI recipe id to numeric catalog index.
 */
export function parseHankkiRecipeNum(recipeId: string): number | null {
  const trimmed = recipeId.trim();
  const prefixed = trimmed.match(/^recipe_(\d+)$/i);
  if (prefixed) return Number(prefixed[1]);
  if (/^\d{1,4}$/.test(trimmed)) return Number(trimmed);
  return null;
}
