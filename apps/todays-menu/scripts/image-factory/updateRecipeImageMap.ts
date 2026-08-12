/**
 * Update recipeImageMap.ts local key for a recipe after hero approval.
 * Does not modify hankkiRecipes / recipe body data — mapping only.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from './config';

const MAP_PATH = path.join(PATHS.appRoot, 'data/recipes/recipeImageMap.ts');

export function updateRecipeImageMapEntry(
  recipeId: string,
  heroImageKey: string,
): { updated: boolean; path: string } {
  if (!fs.existsSync(MAP_PATH)) {
    return { updated: false, path: MAP_PATH };
  }
  const source = fs.readFileSync(MAP_PATH, 'utf8');
  const pattern = new RegExp(
    `(['"]${recipeId}['"]\\s*:\\s*\\{\\s*kind:\\s*['"]local['"]\\s*,\\s*key:\\s*)['"][^'"]+['"]`,
  );
  if (!pattern.test(source)) {
    return { updated: false, path: MAP_PATH };
  }
  const next = source.replace(pattern, `$1'${heroImageKey}'`);
  if (next === source) {
    return { updated: false, path: MAP_PATH };
  }
  fs.writeFileSync(MAP_PATH, next, 'utf8');
  return { updated: true, path: MAP_PATH };
}

export function updateRecipeImageMapEntries(
  pairs: Array<{ recipeId: string; heroImageKey: string }>,
): { updatedCount: number; path: string } {
  let updatedCount = 0;
  for (const p of pairs) {
    if (updateRecipeImageMapEntry(p.recipeId, p.heroImageKey).updated) {
      updatedCount += 1;
    }
  }
  return { updatedCount, path: MAP_PATH };
}
