/**
 * Sprint 57 — Sidecar meal-time metadata for HANKKI recipes.
 *
 * Why sidecar (vs editing 160 recipe objects):
 * - Recipe source files stay stable (no mass edits to batches).
 * - Scoring rules evolve in one module; overrides stay sparse.
 * - Scales to 300 / 500 / 1000 recipes without touching authoring inputs.
 * - Tests validate derived output without mutating golden recipe JSON.
 */
import { HANKKI_RECIPES } from '../recipes/hankkiRecipes';
import type { Recipe } from '../recipes/types';
import { deriveMealTimeFit } from '../../services/recommendation/mealTime/deriveMealTimeFit';
import type { MealTimeFitResult, MealTimeSlotKey } from '../../types/mealTimeRecommendation';

export type RecipeMealTimeMetadataEntry = MealTimeFitResult;

let cachedById: Map<string, RecipeMealTimeMetadataEntry> | null = null;

export function buildRecipeMealTimeMetadataMap(): Map<string, RecipeMealTimeMetadataEntry> {
  const map = new Map<string, RecipeMealTimeMetadataEntry>();
  for (const recipe of HANKKI_RECIPES) {
    const entry = deriveMealTimeFit(recipe);
    if (map.has(entry.recipeId)) {
      throw new Error(`Duplicate recipeId in meal-time metadata: ${entry.recipeId}`);
    }
    map.set(entry.recipeId, entry);
  }
  return map;
}

export function getRecipeMealTimeMetadataMap(): Map<string, RecipeMealTimeMetadataEntry> {
  if (!cachedById) {
    cachedById = buildRecipeMealTimeMetadataMap();
  }
  return cachedById;
}

export function getRecipeMealTimeMetadata(recipeId: string): RecipeMealTimeMetadataEntry | undefined {
  return getRecipeMealTimeMetadataMap().get(recipeId);
}

export function listRecipeMealTimeMetadata(): RecipeMealTimeMetadataEntry[] {
  return [...getRecipeMealTimeMetadataMap().values()];
}

export function recipesForMealTimeSlot(
  slot: MealTimeSlotKey,
  minScore = 0.7,
): RecipeMealTimeMetadataEntry[] {
  return listRecipeMealTimeMetadata()
    .filter((e) => e.fit[slot] >= minScore)
    .sort((a, b) => b.fit[slot] - a.fit[slot]);
}

/** Test helper — bypass module cache. */
export function resetRecipeMealTimeMetadataCache(): void {
  cachedById = null;
}

export function deriveMealTimeFitForRecipe(recipe: Recipe): RecipeMealTimeMetadataEntry {
  return deriveMealTimeFit(recipe);
}
