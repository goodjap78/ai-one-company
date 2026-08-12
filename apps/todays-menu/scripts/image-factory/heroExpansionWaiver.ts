/**
 * Sprint 60 — Track hero expansion recipes removed from waiver after production approve.
 */
import fs from 'node:fs';
import { CATALOG_EXPANSION_HERO_WAIVER_IDS } from '../../data/recipes/catalogExpansionHeroWaiver';
import { MEAL_HERO_EXPANSION_PATHS } from './mealHeroExpansionConfig';

export type HeroExpansionApprovedFile = {
  recipeIds: string[];
  updatedAt: string;
};

function emptyApproved(): HeroExpansionApprovedFile {
  return { recipeIds: [], updatedAt: new Date().toISOString() };
}

export function loadHeroExpansionApproved(): HeroExpansionApprovedFile {
  const path = MEAL_HERO_EXPANSION_PATHS.approvedRecipes;
  if (!fs.existsSync(path)) return emptyApproved();
  try {
    const parsed = JSON.parse(fs.readFileSync(path, 'utf8')) as HeroExpansionApprovedFile;
    if (!Array.isArray(parsed.recipeIds)) return emptyApproved();
    return {
      recipeIds: [...new Set(parsed.recipeIds.filter(Boolean))],
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return emptyApproved();
  }
}

export function saveHeroExpansionApproved(data: HeroExpansionApprovedFile): void {
  fs.mkdirSync(MEAL_HERO_EXPANSION_PATHS.root, { recursive: true });
  fs.writeFileSync(
    MEAL_HERO_EXPANSION_PATHS.approvedRecipes,
    JSON.stringify(
      {
        recipeIds: [...new Set(data.recipeIds)].sort(),
        updatedAt: data.updatedAt,
      },
      null,
      2,
    ),
    'utf8',
  );
}

export function isHeroExpansionApproved(recipeId: string): boolean {
  return loadHeroExpansionApproved().recipeIds.includes(recipeId);
}

export function markHeroExpansionApproved(recipeIds: string[]): string[] {
  const approved = loadHeroExpansionApproved();
  const set = new Set(approved.recipeIds);
  const added: string[] = [];
  for (const id of recipeIds) {
    if (!CATALOG_EXPANSION_HERO_WAIVER_IDS.has(id)) continue;
    if (!set.has(id)) {
      set.add(id);
      added.push(id);
    }
  }
  if (added.length > 0) {
    saveHeroExpansionApproved({
      recipeIds: [...set].sort(),
      updatedAt: new Date().toISOString(),
    });
  }
  return added;
}

export function countActiveHeroExpansionWaiver(): number {
  const approved = new Set(loadHeroExpansionApproved().recipeIds);
  let count = 0;
  for (const id of CATALOG_EXPANSION_HERO_WAIVER_IDS) {
    if (!approved.has(id)) count += 1;
  }
  return count;
}

export function isCatalogExpansionHeroWaiverActive(recipeId: string): boolean {
  if (!CATALOG_EXPANSION_HERO_WAIVER_IDS.has(recipeId)) return false;
  return !isHeroExpansionApproved(recipeId);
}
