/** Audit-only Korean menu name matching — not used at runtime. */

export function normalizeMenuName(name: string): string {
  return name
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/[\s·\-_]/g, '')
    .replace(/돼지고기|소고기|한우|한돈|흑돼지/g, '')
    .replace(/순댓국/g, '순대국')
    .replace(/닭도리탕/g, '닭볶음탕')
    .trim()
    .toLowerCase();
}

export type CatalogMenu = {
  recipeId: string;
  recipeName: string;
};

export type DuplicateCheck = {
  status: 'NEW' | 'POSSIBLE_DUPLICATE';
  matchedRecipeId?: string;
  matchedRecipeName?: string;
  reason?: string;
};

export function findCatalogDuplicate(
  candidateName: string,
  catalog: readonly CatalogMenu[],
): DuplicateCheck {
  const candidate = normalizeMenuName(candidateName);
  if (candidate.length < 2) {
    return { status: 'POSSIBLE_DUPLICATE', reason: 'name_too_short' };
  }

  for (const recipe of catalog) {
    const existing = normalizeMenuName(recipe.recipeName);
    if (!existing) continue;
    if (candidate === existing) {
      return {
        status: 'POSSIBLE_DUPLICATE',
        matchedRecipeId: recipe.recipeId,
        matchedRecipeName: recipe.recipeName,
        reason: 'exact_or_normalized',
      };
    }
    if (candidate.includes(existing) || existing.includes(candidate)) {
      const shorter = candidate.length <= existing.length ? candidate : existing;
      const longer = candidate.length > existing.length ? candidate : existing;
      if (shorter.length >= 3 && longer.length - shorter.length <= 4) {
        return {
          status: 'POSSIBLE_DUPLICATE',
          matchedRecipeId: recipe.recipeId,
          matchedRecipeName: recipe.recipeName,
          reason: 'near_alias',
        };
      }
    }
  }

  return { status: 'NEW' };
}
