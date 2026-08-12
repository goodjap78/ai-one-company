import { SHOPPING_KEYWORD_ALIASES } from './shoppingAliases';

/** Collapse whitespace — do not lowercase Korean shopping keywords. */
export function normalizeShoppingWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

/**
 * Lightweight spacing heuristics for compact catalog names.
 * Avoids a large hand-built dictionary beyond `SHOPPING_KEYWORD_ALIASES`.
 */
function applyShoppingSpacingHeuristics(name: string): string {
  if (name.includes(' ')) return name;

  const diced = name.match(/^다진(.+)$/);
  if (diced?.[1]) return `다진 ${diced[1]}`;

  const boiled = name.match(/^삶은(.+)$/);
  if (boiled?.[1]) return `삶은 ${boiled[1]}`;

  const sliced = name.match(/^썬(.+)$/);
  if (sliced?.[1]) return `썬 ${sliced[1]}`;

  return name;
}

function lookupShoppingAlias(name: string): string | null {
  const normalized = normalizeShoppingWhitespace(name);
  if (!normalized) return null;

  const direct =
    SHOPPING_KEYWORD_ALIASES[normalized] ??
    SHOPPING_KEYWORD_ALIASES[normalized.replace(/\s+/g, '')];
  if (direct) return direct;

  return null;
}

/**
 * Resolve a recipe ingredient display name to a shopping search keyword.
 * Does not use IIE canonical names or include amount/unit.
 */
export function getShoppingKeyword(ingredientName: string): string {
  const normalized = normalizeShoppingWhitespace(ingredientName);
  if (!normalized) return '';

  const alias = lookupShoppingAlias(normalized);
  if (alias) return alias;

  return applyShoppingSpacingHeuristics(normalized);
}
