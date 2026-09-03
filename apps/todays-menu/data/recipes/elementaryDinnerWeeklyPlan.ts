/**
 * Sprint v1.1 — elementary dinner 7-day plan (data layer).
 * Reuses shared weekly RNG utilities; breakfast generator stays independent.
 */
import { HANKKI_RECIPES } from './hankkiRecipes';
import { isEligibleForChildFeed } from './recipeFamilyAudiencePolicy';
import {
  WEEKLY_PLAN_DAYS,
  type WeeklyMealPlan,
  type WeeklyPlanDay,
  type WeeklyPlanSlot,
} from './recipeFamilyAudienceTypes';
import {
  hashWeeklyPlanSeed,
  mulberry32,
  normalizeWeeklyPlanSeed,
  recipeWeeklyTextBlob,
  shuffleInPlace,
  filterWeeklyCandidatesByAvoid,
  WEEKLY_PLAN_LONG_COOK_MINUTES,
  WEEKLY_PLAN_REQUIRED_SLOT_COUNT,
  hasWeeklyPlanBlockedCollision,
  type ElementaryWeeklyPlanGenerateOptions,
} from './elementaryWeeklyPlanCommon';
import {
  weeklyPlanQualityScoreBoost,
  weeklyPlanQualityWeekPenalty,
  weeklyPlanSeedSelectionJitter,
} from './elementaryWeeklyPlanQuality';
import { isElementaryWeeklyExcluded } from './elementaryWeeklyPlanExclusions';
import type { Recipe } from './types';

const REQUIRED_SLOT_COUNT = WEEKLY_PLAN_REQUIRED_SLOT_COUNT;
const LONG_COOK_MINUTES = WEEKLY_PLAN_LONG_COOK_MINUTES;
const MAX_PROTEIN_STREAK = 2;
const MAX_FORM_STREAK = 2;
const SOFT_MAX_RICE_SLOTS = 6;

export type DinnerWeeklyFormGroup = 'rice_bowl' | 'fried_rice' | 'rice_other' | 'non_rice';

export type DinnerWeeklyProteinGroup =
  | 'beef'
  | 'chicken'
  | 'egg'
  | 'pork'
  | 'tofu'
  | 'fish'
  | 'other';

export type ElementaryDinnerWeekCandidate = {
  recipe: Recipe;
  formGroup: DinnerWeeklyFormGroup;
  proteinGroup: DinnerWeeklyProteinGroup;
  longCook: boolean;
};

export type ElementaryDinnerWeekSuccess = {
  ok: true;
  status: 'ok';
  seed: string;
  plan: WeeklyMealPlan;
  eligibleCount: number;
};

export type ElementaryDinnerWeekFailure = {
  ok: false;
  status: 'INSUFFICIENT_CANDIDATES';
  seed: string;
  eligibleCount: number;
  requiredCount: typeof REQUIRED_SLOT_COUNT;
};

export type ElementaryDinnerWeekResult = ElementaryDinnerWeekSuccess | ElementaryDinnerWeekFailure;

type SearchOptions = {
  planSeed: string;
  enforceLongCook: boolean;
  enforceProteinStreak: boolean;
  enforceFormStreak: boolean;
  capRice: boolean;
  maxBranch?: number;
};

function classifyDinnerProtein(recipe: Recipe): DinnerWeeklyProteinGroup {
  const text = [
    recipe.name,
    ...recipe.ingredients.map((item) => item.name),
    ...recipe.searchTags,
  ].join(' ');
  if (/소고기|쇠고기/.test(text)) return 'beef';
  if (/닭|닭고기/.test(text)) return 'chicken';
  if (/계란|달걀|에그/.test(text)) return 'egg';
  if (/돼지|돼지고기|햄/.test(text)) return 'pork';
  if (/두부/.test(text)) return 'tofu';
  if (/참치|생선|연어|고등어|명태/.test(text)) return 'fish';
  return 'other';
}

export function classifyDinnerWeeklyForm(recipe: Recipe): DinnerWeeklyFormGroup {
  const text = recipeWeeklyTextBlob(recipe);
  if (/덮밥/.test(text)) return 'rice_bowl';
  if (/볶음밥/.test(text)) return 'fried_rice';
  if (
    /밥|국밥|비빔밥|주먹밥|조림밥/.test(text) ||
    recipe.standardMetadata.dishType === 'rice' ||
    recipe.standardMetadata.dishType === 'rice_bowl'
  ) {
    return 'rice_other';
  }
  return 'non_rice';
}

export function isElementaryDinnerWeekEligible(recipe: Recipe): boolean {
  const { familyAudience, standardMetadata } = recipe;
  if (!familyAudience.audiences.includes('elementary')) return false;
  if (familyAudience.reviewStatus !== 'explicit') return false;
  if (!standardMetadata.mealTypes.includes('dinner')) return false;
  if (hasWeeklyPlanBlockedCollision(recipe)) return false;
  if (familyAudience.safetySignals.isSideDish) return false;

  return isEligibleForChildFeed(familyAudience, {
    audience: 'elementary',
    mealType: 'dinner',
    allowSideDish: false,
  }).ok;
}

export function listElementaryDinnerWeekCandidates(
  recipes: readonly Recipe[] = HANKKI_RECIPES,
): ElementaryDinnerWeekCandidate[] {
  return recipes
    .filter((recipe) => isElementaryDinnerWeekEligible(recipe) && !isElementaryWeeklyExcluded(recipe.id))
    .map((recipe) => ({
      recipe,
      formGroup: classifyDinnerWeeklyForm(recipe),
      proteinGroup: classifyDinnerProtein(recipe),
      longCook: recipe.time >= LONG_COOK_MINUTES,
    }));
}

function countRiceSlots(slots: readonly ElementaryDinnerWeekCandidate[]): number {
  return slots.filter((item) => item.formGroup !== 'non_rice').length;
}

function streakCount<T>(
  slots: readonly ElementaryDinnerWeekCandidate[],
  pick: (item: ElementaryDinnerWeekCandidate) => T,
  value: T,
): number {
  let streak = 0;
  for (let i = slots.length - 1; i >= 0; i -= 1) {
    if (pick(slots[i]!) !== value) break;
    streak += 1;
  }
  return streak;
}

function scoreCandidate(
  chosen: readonly ElementaryDinnerWeekCandidate[],
  candidate: ElementaryDinnerWeekCandidate,
): number {
  const prev = chosen[chosen.length - 1] ?? null;
  let score = weeklyPlanQualityScoreBoost(candidate.recipe);
  score += weeklyPlanQualityWeekPenalty(
    chosen.map((item) => item.recipe),
    candidate.recipe,
  );
  if (prev && prev.formGroup !== candidate.formGroup) score += 4;
  if (prev && prev.proteinGroup !== candidate.proteinGroup) score += 4;
  if (prev && !(prev.longCook && candidate.longCook)) score += 5;
  if (countRiceSlots(chosen) >= SOFT_MAX_RICE_SLOTS - 1 && candidate.formGroup !== 'non_rice') {
    score -= 8;
  }
  if (candidate.formGroup === 'non_rice' && countRiceSlots(chosen) >= 4) score += 6;
  return score;
}

function passesHardRules(
  prevSlots: readonly ElementaryDinnerWeekCandidate[],
  next: ElementaryDinnerWeekCandidate,
  options: SearchOptions,
): boolean {
  const prev = prevSlots[prevSlots.length - 1];
  if (prev) {
    if (prev.formGroup === 'rice_bowl' && next.formGroup === 'rice_bowl') return false;
    if (prev.formGroup === 'fried_rice' && next.formGroup === 'fried_rice') return false;
    if (options.enforceLongCook && prev.longCook && next.longCook) return false;
  }
  if (
    options.enforceProteinStreak &&
    streakCount(prevSlots, (item) => item.proteinGroup, next.proteinGroup) >= MAX_PROTEIN_STREAK
  ) {
    return false;
  }
  if (
    options.enforceFormStreak &&
    streakCount(prevSlots, (item) => item.formGroup, next.formGroup) >= MAX_FORM_STREAK
  ) {
    return false;
  }
  if (options.capRice && countRiceSlots(prevSlots) >= SOFT_MAX_RICE_SLOTS && next.formGroup !== 'non_rice') {
    return false;
  }
  return true;
}

function searchWeek(
  remaining: ElementaryDinnerWeekCandidate[],
  chosen: ElementaryDinnerWeekCandidate[],
  options: SearchOptions,
): ElementaryDinnerWeekCandidate[] | null {
  if (chosen.length === REQUIRED_SLOT_COUNT) return chosen;

  const slotIndex = chosen.length;
  const ranked = remaining
    .map((candidate, index) => ({
      candidate,
      index,
      score: scoreCandidate(chosen, candidate),
      jitter: weeklyPlanSeedSelectionJitter(options.planSeed, slotIndex, candidate.recipe.id),
    }))
    .filter((entry) => passesHardRules(chosen, entry.candidate, options))
    .sort((a, b) => b.score - a.score || b.jitter - a.jitter || a.index - b.index);

  for (const entry of ranked.slice(0, options.maxBranch ?? ranked.length)) {
    const nextChosen = [...chosen, entry.candidate];
    const nextRemaining = remaining.filter((item) => item.recipe.id !== entry.candidate.recipe.id);
    const found = searchWeek(nextRemaining, nextChosen, options);
    if (found) return found;
  }
  return null;
}

function greedyPackWeek(
  resolvedSeed: string,
  eligible: ElementaryDinnerWeekCandidate[],
  options: SearchOptions,
): ElementaryDinnerWeekCandidate[] | null {
  const rng = mulberry32(hashWeeklyPlanSeed(`${resolvedSeed}:greedy`));
  const shuffled = shuffleInPlace([...eligible], rng);
  const chosen: ElementaryDinnerWeekCandidate[] = [];
  const used = new Set<string>();

  while (chosen.length < REQUIRED_SLOT_COUNT) {
    const slotIndex = chosen.length;
    const remaining = shuffled.filter((candidate) => !used.has(candidate.recipe.id));
    const ranked = remaining
      .map((candidate, index) => ({
        candidate,
        index,
        score: scoreCandidate(chosen, candidate),
        jitter: weeklyPlanSeedSelectionJitter(options.planSeed, slotIndex, candidate.recipe.id),
      }))
      .filter((entry) => passesHardRules(chosen, entry.candidate, options))
      .sort((a, b) => b.score - a.score || b.jitter - a.jitter || a.index - b.index);

    const pick = ranked[0]?.candidate;
    if (!pick) return null;
    chosen.push(pick);
    used.add(pick.recipe.id);
  }
  return chosen;
}

function toSlot(day: WeeklyPlanDay, candidate: ElementaryDinnerWeekCandidate): WeeklyPlanSlot {
  return {
    day,
    mealType: 'dinner',
    recipeId: candidate.recipe.id,
    recipeName: candidate.recipe.name,
    time: candidate.recipe.time,
    schoolMorningFriendly: null,
    diversityCategory: candidate.formGroup === 'non_rice' ? 'other' : 'rice',
  };
}

function buildPlan(seed: string, picked: ElementaryDinnerWeekCandidate[]): WeeklyMealPlan {
  return {
    id: `weekly-elementary-dinner:${seed}`,
    audience: 'elementary',
    mealType: 'dinner',
    seed,
    slots: picked.map((candidate, index) => toSlot(WEEKLY_PLAN_DAYS[index]!, candidate)),
  };
}

function packWeek(
  resolvedSeed: string,
  eligible: ElementaryDinnerWeekCandidate[],
): ElementaryDinnerWeekCandidate[] | null {
  const greedyPhases: SearchOptions[] = [
    {
      planSeed: resolvedSeed,
      enforceLongCook: true,
      enforceProteinStreak: true,
      enforceFormStreak: true,
      capRice: true,
    },
    {
      planSeed: resolvedSeed,
      enforceLongCook: true,
      enforceProteinStreak: true,
      enforceFormStreak: true,
      capRice: false,
    },
    {
      planSeed: resolvedSeed,
      enforceLongCook: false,
      enforceProteinStreak: true,
      enforceFormStreak: true,
      capRice: false,
    },
    {
      planSeed: resolvedSeed,
      enforceLongCook: false,
      enforceProteinStreak: false,
      enforceFormStreak: true,
      capRice: false,
    },
    {
      planSeed: resolvedSeed,
      enforceLongCook: false,
      enforceProteinStreak: false,
      enforceFormStreak: false,
      capRice: false,
    },
  ];
  for (const options of greedyPhases) {
    const packed = greedyPackWeek(resolvedSeed, eligible, options);
    if (packed) return packed;
  }

  const rng = mulberry32(hashWeeklyPlanSeed(resolvedSeed));
  const shuffled = shuffleInPlace([...eligible], rng);
  return (
    searchWeek(shuffled, [], {
      planSeed: resolvedSeed,
      enforceLongCook: false,
      enforceProteinStreak: false,
      enforceFormStreak: false,
      capRice: false,
      maxBranch: 12,
    }) ?? null
  );
}

/** Deterministic when `seed` is provided. Hard safety rules are never relaxed. */
export function generateElementaryDinnerWeek(
  seed?: string | number,
  recipes: readonly Recipe[] = HANKKI_RECIPES,
  options?: ElementaryWeeklyPlanGenerateOptions,
): ElementaryDinnerWeekResult {
  const resolvedSeed = normalizeWeeklyPlanSeed(seed);
  const fullEligible = listElementaryDinnerWeekCandidates(recipes);
  if (fullEligible.length < REQUIRED_SLOT_COUNT) {
    return {
      ok: false,
      status: 'INSUFFICIENT_CANDIDATES',
      seed: resolvedSeed,
      eligibleCount: fullEligible.length,
      requiredCount: REQUIRED_SLOT_COUNT,
    };
  }

  const avoid = options?.avoidRecipeIds ?? [];
  const filteredEligible = filterWeeklyCandidatesByAvoid(fullEligible, avoid);

  if (avoid.length > 0) {
    const attemptSeeds = [
      resolvedSeed,
      `${resolvedSeed}:alt1`,
      `${resolvedSeed}:alt2`,
      `${resolvedSeed}:alt3`,
    ];
    for (const attemptSeed of attemptSeeds) {
      if (filteredEligible.length < REQUIRED_SLOT_COUNT) break;
      const packed = packWeek(attemptSeed, filteredEligible);
      if (packed) {
        return {
          ok: true,
          status: 'ok',
          seed: attemptSeed,
          plan: buildPlan(attemptSeed, packed),
          eligibleCount: filteredEligible.length,
        };
      }
    }
    for (const attemptSeed of attemptSeeds) {
      const packed = packWeek(`${attemptSeed}:fallback`, fullEligible);
      if (packed) {
        return {
          ok: true,
          status: 'ok',
          seed: `${attemptSeed}:fallback`,
          plan: buildPlan(`${attemptSeed}:fallback`, packed),
          eligibleCount: fullEligible.length,
        };
      }
    }
    return {
      ok: false,
      status: 'INSUFFICIENT_CANDIDATES',
      seed: resolvedSeed,
      eligibleCount: filteredEligible.length,
      requiredCount: REQUIRED_SLOT_COUNT,
    };
  }

  const packed = packWeek(resolvedSeed, fullEligible);
  if (!packed) {
    return {
      ok: false,
      status: 'INSUFFICIENT_CANDIDATES',
      seed: resolvedSeed,
      eligibleCount: fullEligible.length,
      requiredCount: REQUIRED_SLOT_COUNT,
    };
  }

  return {
    ok: true,
    status: 'ok',
    seed: resolvedSeed,
    plan: buildPlan(resolvedSeed, packed),
    eligibleCount: fullEligible.length,
  };
}

export { normalizeWeeklyPlanSeed };
