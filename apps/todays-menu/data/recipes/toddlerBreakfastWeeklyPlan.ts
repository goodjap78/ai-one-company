/**
 * Sprint 11 — toddler breakfast 7-day weekly plan generator (data layer only).
 * Hard: unique IDs, egg ≤3, no adjacent eggs, non-egg ≥4, deterministic seed.
 * Soft diversity relaxes before uniqueness; egg hard rules never relax.
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
const MAX_EGG = 3;
const MIN_NON_EGG = 4;
const QUICK_MINUTES = 15;
const WEEKDAY_COUNT = 5; // Mon–Fri

function isBreakfastEligible(recipe: Recipe): boolean {
  return isEligibleToddlerMealFeedRecipe(recipe, 'breakfast') && !hasWeeklyPlanBlockedCollision(recipe);
}

export type ToddlerBreakfastCategory =
  | 'oat_fruit'
  | 'potato_sweet'
  | 'tofu'
  | 'rice'
  | 'egg'
  | 'soup'
  | 'other';

export type ToddlerBreakfastWeekCandidate = {
  recipe: Recipe;
  category: ToddlerBreakfastCategory;
  isEgg: boolean;
  quick: boolean;
  prepAheadFriendly: boolean;
};

export type ToddlerBreakfastWeekSuccess = {
  ok: true;
  status: 'ok';
  seed: string;
  plan: WeeklyMealPlan;
  eligibleCount: number;
  usedFallback: boolean;
  fallbackPhase: number;
};

export type ToddlerBreakfastWeekFailure = {
  ok: false;
  status: 'INSUFFICIENT_CANDIDATES';
  seed: string;
  eligibleCount: number;
  requiredCount: typeof REQUIRED;
  usedFallback: boolean;
  fallbackPhase: number;
};

export type ToddlerBreakfastWeekResult = ToddlerBreakfastWeekSuccess | ToddlerBreakfastWeekFailure;

export type ToddlerBreakfastWeekOptions = ElementaryWeeklyPlanGenerateOptions & {
  /** Optional override pool (must still be breakfast-eligible toddler recipes). */
};

type SoftOptions = {
  maxCategoryCount: number;
  preferQuick: boolean;
  preferQualityA: boolean;
  /** Soft: leave room for a second week (pool has 10 non-egg). */
  maxNonEgg: number;
};

type SearchOptions = SoftOptions & {
  planSeed: string;
};

function ingredientBlob(recipe: Recipe): string {
  return [recipeWeeklyTextBlob(recipe), ...recipe.ingredients.map((i) => i.name)].join(' ');
}

export function isToddlerBreakfastEggBased(recipe: Recipe): boolean {
  if (recipe.standardMetadata.allergyTags.includes('egg')) return true;
  const text = ingredientBlob(recipe);
  return /계란|달걀/.test(text) || /계란|달걀|오믈렛|스크램블/.test(recipe.name);
}

export function classifyToddlerBreakfastCategory(recipe: Recipe): ToddlerBreakfastCategory {
  if (isToddlerBreakfastEggBased(recipe)) return 'egg';
  const text = ingredientBlob(recipe);
  if (/국|수프|스프/.test(text)) return 'soup';
  if (/두부|순두부|연두부/.test(text)) return 'tofu';
  if (/고구마|감자|단호박/.test(text)) return 'potato_sweet';
  if (/오트|요거트|바나나|과일|배|사과|블루베리/.test(text)) return 'oat_fruit';
  if (/밥|주먹밥|죽|덮밥|볶음밥/.test(text)) return 'rice';
  return 'other';
}

function isQuickBreakfast(recipe: Recipe): boolean {
  if (recipe.time <= QUICK_MINUTES) return true;
  const tip = [
    recipe.elementaryQuality?.prerequisites ?? '',
    ...recipe.recipe.steps.map((s) => `${s.instruction} ${s.tip ?? ''}`),
  ].join(' ');
  return /전날|미리\s*쪄|미리\s*준비|쪄\s*둔/.test(tip);
}

export function listToddlerBreakfastWeekCandidates(
  recipes: readonly Recipe[] = HANKKI_RECIPES,
): ToddlerBreakfastWeekCandidate[] {
  const pool =
    recipes === HANKKI_RECIPES
      ? listToddlerMealFeedRecipes('breakfast').filter((r) => !hasWeeklyPlanBlockedCollision(r))
      : recipes.filter(isBreakfastEligible);

  return pool.map((recipe) => ({
    recipe,
    category: classifyToddlerBreakfastCategory(recipe),
    isEgg: isToddlerBreakfastEggBased(recipe),
    quick: isQuickBreakfast(recipe),
    prepAheadFriendly: isQuickBreakfast(recipe) && recipe.time > QUICK_MINUTES,
  }));
}

function countEgg(slots: readonly ToddlerBreakfastWeekCandidate[]): number {
  return slots.filter((s) => s.isEgg).length;
}

function countCategory(
  slots: readonly ToddlerBreakfastWeekCandidate[],
  category: ToddlerBreakfastCategory,
): number {
  return slots.filter((s) => s.category === category).length;
}

/** No adjacent eggs anywhere; covers weekday consecutive ban + min 1-day gap. */
function wouldCreateAdjacentEgg(
  chosen: readonly ToddlerBreakfastWeekCandidate[],
  next: ToddlerBreakfastWeekCandidate,
): boolean {
  if (!next.isEgg) return false;
  const prev = chosen[chosen.length - 1];
  if (prev?.isEgg) return true;
  return false;
}

/** Weekday pair check when placing at index (also blocks Fri egg after Thu egg via adjacent). */
function wouldBreakWeekdayEggRule(
  chosen: readonly ToddlerBreakfastWeekCandidate[],
  next: ToddlerBreakfastWeekCandidate,
): boolean {
  if (!next.isEgg) return false;
  const index = chosen.length;
  if (index === 0) return false;
  if (index < WEEKDAY_COUNT && chosen[index - 1]?.isEgg) return true;
  return wouldCreateAdjacentEgg(chosen, next);
}

function passesHard(
  chosen: readonly ToddlerBreakfastWeekCandidate[],
  next: ToddlerBreakfastWeekCandidate,
): boolean {
  if (next.isEgg && countEgg(chosen) >= MAX_EGG) return false;
  if (wouldBreakWeekdayEggRule(chosen, next)) return false;
  // Remaining slots must still allow MIN_NON_EGG
  const nextEgg = countEgg(chosen) + (next.isEgg ? 1 : 0);
  const nextLen = chosen.length + 1;
  const remaining = REQUIRED - nextLen;
  const nonEggSoFar = nextLen - nextEgg;
  if (nonEggSoFar + remaining < MIN_NON_EGG) return false;
  if (nextEgg > MAX_EGG) return false;
  return true;
}

function passesSoft(
  chosen: readonly ToddlerBreakfastWeekCandidate[],
  next: ToddlerBreakfastWeekCandidate,
  soft: SoftOptions,
): boolean {
  if (countCategory(chosen, next.category) >= soft.maxCategoryCount) return false;
  const nonEggSoFar = chosen.length - countEgg(chosen) + (next.isEgg ? 0 : 1);
  if (nonEggSoFar > soft.maxNonEgg) return false;
  return true;
}

function scoreCandidate(
  chosen: readonly ToddlerBreakfastWeekCandidate[],
  next: ToddlerBreakfastWeekCandidate,
  options: SearchOptions,
  slotIndex: number,
): number {
  let score = 0;
  if (options.preferQualityA) score += weeklyPlanQualityScoreBoost(next.recipe);
  if (options.preferQuick && next.quick) score += 5;
  if (next.prepAheadFriendly) score += 2;

  const prev = chosen[chosen.length - 1];
  if (prev && prev.category !== next.category) score += 4;
  if (prev && prev.isEgg !== next.isEgg) score += 3;
  if (next.isEgg) score -= countEgg(chosen) * 2;
  if (!next.isEgg && countEgg(chosen) >= 2) score += 2;

  score += weeklyPlanSeedSelectionJitter(options.planSeed, slotIndex, next.recipe.id);
  return score;
}

function greedyPack(
  eligible: ToddlerBreakfastWeekCandidate[],
  options: SearchOptions,
): ToddlerBreakfastWeekCandidate[] | null {
  const chosen: ToddlerBreakfastWeekCandidate[] = [];
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

  if (countEgg(chosen) > MAX_EGG) return null;
  if (REQUIRED - countEgg(chosen) < MIN_NON_EGG) return null;
  return chosen;
}

/** Bounded DFS when greedy fails — hard egg rules always on. */
function searchWeek(
  remaining: ToddlerBreakfastWeekCandidate[],
  chosen: ToddlerBreakfastWeekCandidate[],
  options: SearchOptions,
  branchCap: number,
): ToddlerBreakfastWeekCandidate[] | null {
  if (chosen.length === REQUIRED) {
    if (countEgg(chosen) > MAX_EGG) return null;
    if (REQUIRED - countEgg(chosen) < MIN_NON_EGG) return null;
    return chosen;
  }

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
  { maxCategoryCount: 2, preferQuick: true, preferQualityA: true, maxNonEgg: 5 },
  { maxCategoryCount: 3, preferQuick: true, preferQualityA: true, maxNonEgg: 6 },
  { maxCategoryCount: 4, preferQuick: true, preferQualityA: true, maxNonEgg: 6 },
  { maxCategoryCount: 5, preferQuick: true, preferQualityA: true, maxNonEgg: 7 },
  { maxCategoryCount: 7, preferQuick: false, preferQualityA: true, maxNonEgg: 7 },
  { maxCategoryCount: 7, preferQuick: false, preferQualityA: false, maxNonEgg: 7 },
];

function packBreakfastWeek(
  resolvedSeed: string,
  eligible: ToddlerBreakfastWeekCandidate[],
): { packed: ToddlerBreakfastWeekCandidate[]; phase: number } | null {
  const rng = mulberry32(hashWeeklyPlanSeed(`toddler-bf:${resolvedSeed}`));
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

function toSlot(day: WeeklyPlanDay, candidate: ToddlerBreakfastWeekCandidate): WeeklyPlanSlot {
  return {
    day,
    mealType: 'breakfast',
    recipeId: candidate.recipe.id,
    recipeName: candidate.recipe.name,
    time: candidate.recipe.time,
    schoolMorningFriendly: null,
    diversityCategory:
      candidate.category === 'rice'
        ? 'rice'
        : candidate.category === 'oat_fruit'
          ? 'oatmeal_cereal'
          : 'other',
  };
}

function buildPlan(seed: string, packed: ToddlerBreakfastWeekCandidate[]): WeeklyMealPlan {
  return {
    id: `weekly-toddler:breakfast:${seed}`,
    audience: 'toddler',
    mealType: 'breakfast',
    seed,
    slots: packed.map((c, i) => toSlot(WEEKLY_PLAN_DAYS[i]!, c)),
  };
}

/**
 * Deterministic toddler breakfast week.
 * Egg hard rules (≤3, no adjacent, non-egg ≥4) are never relaxed.
 */
export function generateToddlerBreakfastWeek(
  seed?: string | number,
  recipes: readonly Recipe[] = HANKKI_RECIPES,
  options?: ToddlerBreakfastWeekOptions,
): ToddlerBreakfastWeekResult {
  const resolvedSeed = normalizeWeeklyPlanSeed(seed);
  const fullEligible = listToddlerBreakfastWeekCandidates(recipes);
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
      const result = packBreakfastWeek(attemptSeed, filtered);
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

  // Soft diversity already relaxed inside pack; last resort: ignore avoid (record fallback).
  if (avoid.length > 0) {
    for (const attemptSeed of attemptSeeds) {
      const result = packBreakfastWeek(`${attemptSeed}:fallback`, fullEligible);
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

/** Validate a packed breakfast week against Sprint 11 hard rules. */
export function validateToddlerBreakfastWeekPlan(
  plan: WeeklyMealPlan,
  recipesById: Map<string, Recipe>,
): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const ids = plan.slots.map((s) => s.recipeId);
  if (new Set(ids).size !== ids.length) reasons.push('duplicate');
  if (ids.length !== REQUIRED) reasons.push('slot_count');

  const candidates = ids.map((id) => {
    const recipe = recipesById.get(id);
    if (!recipe) return null;
    return {
      recipe,
      category: classifyToddlerBreakfastCategory(recipe),
      isEgg: isToddlerBreakfastEggBased(recipe),
      quick: isQuickBreakfast(recipe),
      prepAheadFriendly: false,
    } satisfies ToddlerBreakfastWeekCandidate;
  });

  if (candidates.some((c) => !c)) reasons.push('missing_recipe');
  const present = candidates.filter(Boolean) as ToddlerBreakfastWeekCandidate[];
  const eggs = countEgg(present);
  if (eggs > MAX_EGG) reasons.push(`egg>${MAX_EGG}`);
  if (REQUIRED - eggs < MIN_NON_EGG) reasons.push(`non_egg<${MIN_NON_EGG}`);
  for (let i = 1; i < present.length; i += 1) {
    if (present[i]!.isEgg && present[i - 1]!.isEgg) reasons.push('adjacent_egg');
  }
  for (let i = 1; i < Math.min(WEEKDAY_COUNT, present.length); i += 1) {
    if (present[i]!.isEgg && present[i - 1]!.isEgg) reasons.push('weekday_adjacent_egg');
  }
  return { ok: reasons.length === 0, reasons };
}

export { MAX_EGG as TODDLER_BREAKFAST_MAX_EGG, MIN_NON_EGG as TODDLER_BREAKFAST_MIN_NON_EGG };
