/**
 * Sprint 11 — toddler dinner 7-day weekly plan generator (data layer only).
 * Hard: unique IDs, no form/protein type ≥4, deterministic seed, avoidRecipeIds.
 * Soft streak / diversity relaxes first; type-count hard cap never relaxes below 4.
 */
import { HANKKI_RECIPES } from './hankkiRecipes';
import {
  filterWeeklyCandidatesByAvoid,
  hashWeeklyPlanSeed,
  hasWeeklyPlanBlockedCollision,
  mulberry32,
  normalizeWeeklyPlanSeed,
  recipeWeeklyTextBlob,
  shuffleInPlace,
  WEEKLY_PLAN_LONG_COOK_MINUTES,
  WEEKLY_PLAN_REQUIRED_SLOT_COUNT,
  type ElementaryWeeklyPlanGenerateOptions,
} from './elementaryWeeklyPlanCommon';
import {
  weeklyPlanQualityScoreBoost,
  weeklyPlanSeedSelectionJitter,
} from './elementaryWeeklyPlanQuality';
import {
  isEligibleToddlerMealFeedRecipe,
  listToddlerMealFeedRecipes,
} from './toddlerMealFeed';
import {
  WEEKLY_PLAN_DAYS,
  type WeeklyMealPlan,
  type WeeklyPlanDay,
  type WeeklyPlanSlot,
} from './recipeFamilyAudienceTypes';
import type { Recipe } from './types';

const REQUIRED = WEEKLY_PLAN_REQUIRED_SLOT_COUNT;
const MAX_TYPE_COUNT = 3; // forbid 4+ of same form or protein
const LONG_COOK = WEEKLY_PLAN_LONG_COOK_MINUTES;

export type ToddlerDinnerForm =
  | 'soup'
  | 'stir_fry'
  | 'braise'
  | 'grill'
  | 'rice_bowl'
  | 'other';

export type ToddlerDinnerProtein =
  | 'beef'
  | 'chicken'
  | 'egg'
  | 'tofu'
  | 'fish'
  | 'veg'
  | 'other';

export type ToddlerDinnerWeekCandidate = {
  recipe: Recipe;
  form: ToddlerDinnerForm;
  protein: ToddlerDinnerProtein;
  longCook: boolean;
};

export type ToddlerDinnerWeekSuccess = {
  ok: true;
  status: 'ok';
  seed: string;
  plan: WeeklyMealPlan;
  eligibleCount: number;
  usedFallback: boolean;
  fallbackPhase: number;
};

export type ToddlerDinnerWeekFailure = {
  ok: false;
  status: 'INSUFFICIENT_CANDIDATES';
  seed: string;
  eligibleCount: number;
  requiredCount: typeof REQUIRED;
  usedFallback: boolean;
  fallbackPhase: number;
};

export type ToddlerDinnerWeekResult = ToddlerDinnerWeekSuccess | ToddlerDinnerWeekFailure;

export type ToddlerDinnerWeekOptions = ElementaryWeeklyPlanGenerateOptions;

type SoftOptions = {
  maxFormStreak: number;
  maxProteinStreak: number;
  enforceLongCookGap: boolean;
  preferQualityA: boolean;
};

type SearchOptions = SoftOptions & { planSeed: string };

function blob(recipe: Recipe): string {
  return [recipeWeeklyTextBlob(recipe), ...recipe.ingredients.map((i) => i.name)].join(' ');
}

export function classifyToddlerDinnerForm(recipe: Recipe): ToddlerDinnerForm {
  const text = recipeWeeklyTextBlob(recipe);
  if (/국|탕|찌개|수프|스프|전골/.test(text)) return 'soup';
  if (/볶음/.test(text)) return 'stir_fry';
  if (/조림/.test(text)) return 'braise';
  if (/구이/.test(text)) return 'grill';
  if (/덮밥|볶음밥|비빔밥|국밥|주먹밥|한그릇/.test(text)) return 'rice_bowl';
  return 'other';
}

export function classifyToddlerDinnerProtein(recipe: Recipe): ToddlerDinnerProtein {
  const text = blob(recipe);
  if (/소고기|쇠고기/.test(text)) return 'beef';
  if (/닭|닭고기|닭안심/.test(text)) return 'chicken';
  if (/계란|달걀/.test(text)) return 'egg';
  if (/두부|순두부|연두부/.test(text)) return 'tofu';
  if (/참치|생선|연어|고등어|명태|대구/.test(text)) return 'fish';
  if (/애호박|브로콜리|감자|당근|배추|버섯/.test(text) && !/소고기|닭|계란|두부|참치/.test(text)) {
    return 'veg';
  }
  return 'other';
}

function isDinnerEligible(recipe: Recipe): boolean {
  return isEligibleToddlerMealFeedRecipe(recipe, 'dinner') && !hasWeeklyPlanBlockedCollision(recipe);
}

export function listToddlerDinnerWeekCandidates(
  recipes: readonly Recipe[] = HANKKI_RECIPES,
): ToddlerDinnerWeekCandidate[] {
  const pool =
    recipes === HANKKI_RECIPES
      ? listToddlerMealFeedRecipes('dinner').filter((r) => !hasWeeklyPlanBlockedCollision(r))
      : recipes.filter(isDinnerEligible);

  return pool.map((recipe) => ({
    recipe,
    form: classifyToddlerDinnerForm(recipe),
    protein: classifyToddlerDinnerProtein(recipe),
    longCook: recipe.time >= LONG_COOK,
  }));
}

function countForm(slots: readonly ToddlerDinnerWeekCandidate[], form: ToddlerDinnerForm): number {
  return slots.filter((s) => s.form === form).length;
}

function countProtein(
  slots: readonly ToddlerDinnerWeekCandidate[],
  protein: ToddlerDinnerProtein,
): number {
  return slots.filter((s) => s.protein === protein).length;
}

function streak<T>(
  slots: readonly ToddlerDinnerWeekCandidate[],
  pick: (c: ToddlerDinnerWeekCandidate) => T,
  value: T,
): number {
  let n = 0;
  for (let i = slots.length - 1; i >= 0; i -= 1) {
    if (pick(slots[i]!) !== value) break;
    n += 1;
  }
  return n;
}

function passesHard(
  chosen: readonly ToddlerDinnerWeekCandidate[],
  next: ToddlerDinnerWeekCandidate,
): boolean {
  if (countForm(chosen, next.form) >= MAX_TYPE_COUNT) return false;
  if (countProtein(chosen, next.protein) >= MAX_TYPE_COUNT) return false;
  return true;
}

function passesSoft(
  chosen: readonly ToddlerDinnerWeekCandidate[],
  next: ToddlerDinnerWeekCandidate,
  soft: SoftOptions,
): boolean {
  if (streak(chosen, (c) => c.form, next.form) >= soft.maxFormStreak) return false;
  if (streak(chosen, (c) => c.protein, next.protein) >= soft.maxProteinStreak) return false;
  if (soft.enforceLongCookGap) {
    const prev = chosen[chosen.length - 1];
    if (prev?.longCook && next.longCook) return false;
  }
  return true;
}

function scoreCandidate(
  chosen: readonly ToddlerDinnerWeekCandidate[],
  next: ToddlerDinnerWeekCandidate,
  options: SearchOptions,
  slotIndex: number,
): number {
  let score = 0;
  if (options.preferQualityA) score += weeklyPlanQualityScoreBoost(next.recipe);
  const prev = chosen[chosen.length - 1];
  if (prev && prev.form !== next.form) score += 4;
  if (prev && prev.protein !== next.protein) score += 4;
  if (prev && !(prev.longCook && next.longCook)) score += 2;
  score -= countForm(chosen, next.form);
  score -= countProtein(chosen, next.protein);
  score += weeklyPlanSeedSelectionJitter(options.planSeed, slotIndex, next.recipe.id);
  return score;
}

function greedyPack(
  eligible: ToddlerDinnerWeekCandidate[],
  options: SearchOptions,
): ToddlerDinnerWeekCandidate[] | null {
  const chosen: ToddlerDinnerWeekCandidate[] = [];
  const used = new Set<string>();

  for (let slot = 0; slot < REQUIRED; slot += 1) {
    const ranked = eligible
      .filter((c) => !used.has(c.recipe.id))
      .map((candidate, index) => ({
        candidate,
        index,
        score: scoreCandidate(chosen, candidate, options, slot),
      }))
      .filter((e) => passesHard(chosen, e.candidate) && passesSoft(chosen, e.candidate, options))
      .sort((a, b) => b.score - a.score || a.index - b.index);

    const pick = ranked[0]?.candidate;
    if (!pick) return null;
    chosen.push(pick);
    used.add(pick.recipe.id);
  }
  return chosen;
}

function searchWeek(
  remaining: ToddlerDinnerWeekCandidate[],
  chosen: ToddlerDinnerWeekCandidate[],
  options: SearchOptions,
  branchCap: number,
): ToddlerDinnerWeekCandidate[] | null {
  if (chosen.length === REQUIRED) return chosen;

  const ranked = remaining
    .map((candidate, index) => ({
      candidate,
      index,
      score: scoreCandidate(chosen, candidate, options, chosen.length),
    }))
    .filter((e) => passesHard(chosen, e.candidate) && passesSoft(chosen, e.candidate, options))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, branchCap);

  for (const entry of ranked) {
    const nextChosen = [...chosen, entry.candidate];
    const nextRemaining = remaining.filter((c) => c.recipe.id !== entry.candidate.recipe.id);
    const found = searchWeek(nextRemaining, nextChosen, options, branchCap);
    if (found) return found;
  }
  return null;
}

const SOFT_PHASES: SoftOptions[] = [
  { maxFormStreak: 1, maxProteinStreak: 1, enforceLongCookGap: true, preferQualityA: true },
  { maxFormStreak: 2, maxProteinStreak: 2, enforceLongCookGap: true, preferQualityA: true },
  { maxFormStreak: 2, maxProteinStreak: 2, enforceLongCookGap: false, preferQualityA: true },
  { maxFormStreak: 3, maxProteinStreak: 3, enforceLongCookGap: false, preferQualityA: true },
  { maxFormStreak: 3, maxProteinStreak: 3, enforceLongCookGap: false, preferQualityA: false },
  { maxFormStreak: 7, maxProteinStreak: 7, enforceLongCookGap: false, preferQualityA: false },
];

function packDinnerWeek(
  resolvedSeed: string,
  eligible: ToddlerDinnerWeekCandidate[],
): { packed: ToddlerDinnerWeekCandidate[]; phase: number } | null {
  const rng = mulberry32(hashWeeklyPlanSeed(`toddler-dn:${resolvedSeed}`));
  const shuffled = shuffleInPlace([...eligible], rng);

  for (let phase = 0; phase < SOFT_PHASES.length; phase += 1) {
    const soft = SOFT_PHASES[phase]!;
    const options: SearchOptions = { planSeed: resolvedSeed, ...soft };
    const greedy = greedyPack(shuffled, options);
    if (greedy) return { packed: greedy, phase };
    const dfs = searchWeek(shuffled, [], options, phase <= 2 ? 10 : 16);
    if (dfs) return { packed: dfs, phase };
  }
  return null;
}

function toSlot(day: WeeklyPlanDay, candidate: ToddlerDinnerWeekCandidate): WeeklyPlanSlot {
  return {
    day,
    mealType: 'dinner',
    recipeId: candidate.recipe.id,
    recipeName: candidate.recipe.name,
    time: candidate.recipe.time,
    schoolMorningFriendly: null,
    diversityCategory: candidate.form === 'rice_bowl' ? 'rice' : 'other',
  };
}

function buildPlan(seed: string, packed: ToddlerDinnerWeekCandidate[]): WeeklyMealPlan {
  return {
    id: `weekly-toddler:dinner:${seed}`,
    audience: 'toddler',
    mealType: 'dinner',
    seed,
    slots: packed.map((c, i) => toSlot(WEEKLY_PLAN_DAYS[i]!, c)),
  };
}

export function generateToddlerDinnerWeek(
  seed?: string | number,
  recipes: readonly Recipe[] = HANKKI_RECIPES,
  options?: ToddlerDinnerWeekOptions,
): ToddlerDinnerWeekResult {
  const resolvedSeed = normalizeWeeklyPlanSeed(seed);
  const fullEligible = listToddlerDinnerWeekCandidates(recipes);
  if (fullEligible.length < REQUIRED) {
    return {
      ok: false,
      status: 'INSUFFICIENT_CANDIDATES',
      seed: resolvedSeed,
      eligibleCount: fullEligible.length,
      requiredCount: REQUIRED,
      usedFallback: false,
      fallbackPhase: -1,
    };
  }

  const avoid = options?.avoidRecipeIds ?? [];
  const filtered = filterWeeklyCandidatesByAvoid(fullEligible, avoid);
  const attemptSeeds = [
    resolvedSeed,
    `${resolvedSeed}:alt1`,
    `${resolvedSeed}:alt2`,
    `${resolvedSeed}:alt3`,
  ];

  if (filtered.length >= REQUIRED) {
    for (const attemptSeed of attemptSeeds) {
      const result = packDinnerWeek(attemptSeed, filtered);
      if (result) {
        return {
          ok: true,
          status: 'ok',
          seed: attemptSeed,
          plan: buildPlan(attemptSeed, result.packed),
          eligibleCount: filtered.length,
          usedFallback: result.phase >= 4,
          fallbackPhase: result.phase,
        };
      }
    }
  }

  if (avoid.length > 0) {
    for (const attemptSeed of attemptSeeds) {
      const result = packDinnerWeek(`${attemptSeed}:fallback`, fullEligible);
      if (result) {
        return {
          ok: true,
          status: 'ok',
          seed: `${attemptSeed}:fallback`,
          plan: buildPlan(`${attemptSeed}:fallback`, result.packed),
          eligibleCount: fullEligible.length,
          usedFallback: true,
          fallbackPhase: result.phase + 100,
        };
      }
    }
  }

  return {
    ok: false,
    status: 'INSUFFICIENT_CANDIDATES',
    seed: resolvedSeed,
    eligibleCount: filtered.length,
    requiredCount: REQUIRED,
    usedFallback: true,
    fallbackPhase: -1,
  };
}

export function validateToddlerDinnerWeekPlan(
  plan: WeeklyMealPlan,
  recipesById: Map<string, Recipe>,
): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const ids = plan.slots.map((s) => s.recipeId);
  if (new Set(ids).size !== ids.length) reasons.push('duplicate');
  if (ids.length !== REQUIRED) reasons.push('slot_count');

  const forms: Record<string, number> = {};
  const proteins: Record<string, number> = {};
  for (const id of ids) {
    const recipe = recipesById.get(id);
    if (!recipe) {
      reasons.push('missing_recipe');
      continue;
    }
    const form = classifyToddlerDinnerForm(recipe);
    const protein = classifyToddlerDinnerProtein(recipe);
    forms[form] = (forms[form] ?? 0) + 1;
    proteins[protein] = (proteins[protein] ?? 0) + 1;
  }
  for (const [k, n] of Object.entries(forms)) {
    if (n >= 4) reasons.push(`form_${k}>=4`);
  }
  for (const [k, n] of Object.entries(proteins)) {
    if (n >= 4) reasons.push(`protein_${k}>=4`);
  }
  return { ok: reasons.length === 0, reasons };
}

export { MAX_TYPE_COUNT as TODDLER_DINNER_MAX_TYPE_COUNT };
