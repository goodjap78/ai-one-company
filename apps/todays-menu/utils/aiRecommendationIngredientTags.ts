export const MAX_INGREDIENT_TAGS = 10;

export function parseIngredientTagList(raw: string): string[] {
  const tags = raw
    .split(/[,，]+/)
    .map((token) => normalizeIngredientTagInput(token))
    .filter(Boolean);

  const unique: string[] = [];
  for (const tag of tags) {
    if (!hasDuplicateIngredientTag(unique, tag)) unique.push(tag);
  }
  return unique;
}

export function serializeIngredientTagList(tags: string[]): string {
  return tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .join(', ');
}

export function normalizeIngredientTagInput(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function tagKey(value: string): string {
  return normalizeIngredientTagInput(value).toLowerCase();
}

export function hasDuplicateIngredientTag(tags: string[], candidate: string): boolean {
  const key = tagKey(candidate);
  return tags.some((tag) => tagKey(tag) === key);
}

export type AddIngredientTagResult =
  | { ok: true; tags: string[] }
  | { ok: false; reason: 'empty' | 'duplicate' | 'max' };

export function addIngredientTag(
  tags: string[],
  raw: string,
  max = MAX_INGREDIENT_TAGS,
): AddIngredientTagResult {
  const token = normalizeIngredientTagInput(raw);
  if (!token) return { ok: false, reason: 'empty' };
  if (tags.length >= max) return { ok: false, reason: 'max' };
  if (hasDuplicateIngredientTag(tags, token)) return { ok: false, reason: 'duplicate' };
  return { ok: true, tags: [...tags, token] };
}

export function removeIngredientTag(tags: string[], target: string): string[] {
  const key = tagKey(target);
  return tags.filter((tag) => tagKey(tag) !== key);
}
