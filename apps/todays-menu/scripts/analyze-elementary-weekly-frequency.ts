/**
 * Sprint 6 — elementary weekly pool frequency analysis.
 * Run: npx tsx scripts/analyze-elementary-weekly-frequency.ts
 */
import { generateElementaryBreakfastWeek, listElementaryBreakfastWeekCandidates } from '../data/recipes/elementaryBreakfastWeeklyPlan';
import { generateElementaryDinnerWeek, listElementaryDinnerWeekCandidates } from '../data/recipes/elementaryDinnerWeeklyPlan';
import { getHankkiRecipeById } from '../data/recipes/hankkiRecipes';

const SEEDS = 100;

function analyze(
  label: string,
  generate: (seed: number) => ReturnType<typeof generateElementaryBreakfastWeek>,
  candidates: ReturnType<typeof listElementaryBreakfastWeekCandidates>,
) {
  const freq = new Map<string, number>();
  for (let i = 0; i < SEEDS; i++) {
    const result = generate(i);
    if (!result.ok || !result.plan) continue;
    for (const slot of result.plan.slots) {
      freq.set(slot.recipeId, (freq.get(slot.recipeId) ?? 0) + 1);
    }
  }

  const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
  console.log(`\n=== ${label} (pool ${candidates.length}, ${SEEDS} seeds) ===`);
  for (const [id, count] of sorted) {
    const name = getHankkiRecipeById(id)?.name ?? '?';
    const inPool = candidates.some((r) => r.id === id);
    console.log(`${count.toString().padStart(3)} | ${id.padEnd(14)} | ${name}${inPool ? '' : ' [NOT IN POOL]'}`);
  }

  const never = candidates.filter((r) => !freq.has(r.id));
  if (never.length) {
    console.log(`Never selected (${never.length}): ${never.map((r) => r.id).join(', ')}`);
  }
}

analyze('BREAKFAST', generateElementaryBreakfastWeek, listElementaryBreakfastWeekCandidates());
analyze('DINNER', generateElementaryDinnerWeek, listElementaryDinnerWeekCandidates());
