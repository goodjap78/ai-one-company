/**
 * Shared weekly-plan utilities for elementary breakfast / dinner generators.
 */
import type { Recipe } from './types';

export const WEEKLY_PLAN_REQUIRED_SLOT_COUNT = 7;
export const WEEKLY_PLAN_LONG_COOK_MINUTES = 15;

export const WEEKLY_PLAN_BLOCKED_COLLISIONS = [
  'spicy',
  'hangover',
  'drinking_snack',
  'late_night',
  'side_dish',
] as const;

export type WeeklyPlanRng = { next: () => number };

export function mulberry32(seed: number): WeeklyPlanRng {
  let state = seed >>> 0;
  return {
    next() {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

export function hashWeeklyPlanSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function normalizeWeeklyPlanSeed(seed?: string | number): string {
  if (typeof seed === 'number' && Number.isFinite(seed)) return String(seed >>> 0);
  if (typeof seed === 'string' && seed.trim()) return seed.trim();
  return `auto:${Date.now().toString(36)}:${Math.floor(Math.random() * 1e9).toString(36)}`;
}

export function shuffleInPlace<T>(items: T[], rng: WeeklyPlanRng): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng.next() * (i + 1));
    const current = items[i]!;
    items[i] = items[j]!;
    items[j] = current;
  }
  return items;
}

export function hasWeeklyPlanBlockedCollision(recipe: Recipe): boolean {
  return recipe.familyAudience.collisionFlags.some((flag) =>
    (WEEKLY_PLAN_BLOCKED_COLLISIONS as readonly string[]).includes(flag),
  );
}

export function recipeWeeklyTextBlob(recipe: Recipe): string {
  return [recipe.name, recipe.category.join(' '), recipe.searchTags.join(' ')].join(' ');
}

export type ElementaryWeeklyPlanGenerateOptions = {
  /** Prior-week recipe IDs to exclude from this week's slots (cross-week de-dupe). */
  avoidRecipeIds?: readonly string[];
};

export function filterWeeklyCandidatesByAvoid<T extends { recipe: Recipe }>(
  candidates: readonly T[],
  avoidRecipeIds?: readonly string[],
): T[] {
  if (!avoidRecipeIds?.length) return [...candidates];
  const avoid = new Set(avoidRecipeIds);
  return candidates.filter((candidate) => !avoid.has(candidate.recipe.id));
}

export function weekOverlapsAvoid(
  weekRecipeIds: readonly string[],
  avoidRecipeIds: readonly string[],
): boolean {
  if (!avoidRecipeIds.length) return false;
  const avoid = new Set(avoidRecipeIds);
  return weekRecipeIds.some((id) => avoid.has(id));
}
