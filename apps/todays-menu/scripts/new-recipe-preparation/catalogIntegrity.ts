import fs from 'node:fs';
import path from 'node:path';
import { HANKKI_RECIPES } from '../../data/recipes/hankkiRecipes';
import { validateHankkiProductionDb } from '../../data/recipes/validateHankkiProduction';

export type CatalogIntegrityResult = {
  recipeCount: number;
  duplicateIds: string[];
  duplicateNames: Array<{ name: string; ids: string[] }>;
  productionOk: boolean;
  productionIssues: string[];
  blockers: string[];
};

export function runCatalogIntegrity(expectedCount = 517): CatalogIntegrityResult {
  const blockers: string[] = [];
  const ids = HANKKI_RECIPES.map((r) => r.id);
  const idCounts = new Map<string, number>();
  for (const id of ids) {
    idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
  }
  const duplicateIds = [...idCounts.entries()].filter(([, n]) => n > 1).map(([id]) => id);
  if (duplicateIds.length) {
    blockers.push(`duplicate recipe ids: ${duplicateIds.join(', ')}`);
  }

  const nameToIds = new Map<string, string[]>();
  for (const recipe of HANKKI_RECIPES) {
    const list = nameToIds.get(recipe.name) ?? [];
    list.push(recipe.id);
    nameToIds.set(recipe.name, list);
  }
  const duplicateNames = [...nameToIds.entries()]
    .filter(([, recipeIds]) => recipeIds.length > 1)
    .map(([name, recipeIds]) => ({ name, ids: recipeIds }));
  if (duplicateNames.length) {
    for (const row of duplicateNames) {
      blockers.push(`duplicate exact name "${row.name}": ${row.ids.join(', ')}`);
    }
  }

  if (HANKKI_RECIPES.length !== expectedCount) {
    blockers.push(`recipe count ${HANKKI_RECIPES.length} (expected ${expectedCount})`);
  }

  const production = validateHankkiProductionDb();
  const productionIssues = production.issues.map(
    (i) => `[${i.recipeId}] ${i.code}: ${i.message}`,
  );
  if (!production.ok) {
    blockers.push(`validateHankkiProductionDb failed (${production.issues.length} issues)`);
  }

  return {
    recipeCount: HANKKI_RECIPES.length,
    duplicateIds,
    duplicateNames,
    productionOk: production.ok,
    productionIssues,
    blockers,
  };
}

export function assertScopedRecipesExist(recipeIds: string[]): string[] {
  const known = new Set(HANKKI_RECIPES.map((r) => r.id));
  return recipeIds.filter((id) => !known.has(id));
}

export function writeJsonFile(filePath: string, data: unknown, dryRun: boolean): void {
  if (dryRun) return;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}
