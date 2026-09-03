/**
 * Sprint v1.1 #4 / #4.5 — elementary breakfast 7-day plan (data layer only).
 * Not wired to Home / AI recommendation.
 *
 * Soft diversity (school-morning / staple mix) is best-effort.
 * Hard eligibility and collision rules are never relaxed.
 */
import { HANKKI_RECIPES } from './hankkiRecipes';
import { isEligibleForChildFeed } from './recipeFamilyAudiencePolicy';
import {
  WEEKLY_PLAN_DAYS,
  type WeeklyMealPlan,
  type WeeklyPlanDay,
  type WeeklyPlanDiversityCategory,
  type WeeklyPlanSlot,
} from './recipeFamilyAudienceTypes';
import type { Recipe } from './types';
import {
  filterWeeklyCandidatesByAvoid,
  type ElementaryWeeklyPlanGenerateOptions,
} from './elementaryWeeklyPlanCommon';
import {
  weeklyPlanQualityScoreBoost,
  weeklyPlanQualityWeekPenalty,
  weeklyPlanSchoolMorningScoreBoost,
  weeklyPlanSeedSelectionJitter,
} from './elementaryWeeklyPlanQuality';
import { isElementaryWeeklyExcluded } from './elementaryWeeklyPlanExclusions';

const REQUIRED_SLOT_COUNT = 7;
const LONG_COOK_MINUTES = 15;
const MAX_EGG_STREAK = 2;
const SOFT_MAX_SCHOOL_MORNING = 4;
const SOFT_MAX_RICE = 3;
const SOFT_MAX_BREAD = 3;
const BLOCKED_COLLISIONS = ['spicy', 'hangover', 'drinking_snack', 'late_night', 'side_dish'] as const;

export type WeeklyPlanFormGroup = 'sandwich_toast' | 'rice_ball' | 'other';

export type ElementaryBreakfastWeekCandidate = {
  recipe: Recipe;
  diversityCategory: WeeklyPlanDiversityCategory;
  formGroup: WeeklyPlanFormGroup;
  eggCentric: boolean;
  longCook: boolean;
  schoolMorningFriendly: boolean | null;
};

export type ElementaryBreakfastWeekSuccess = {
  ok: true;
  status: 'ok';
  seed: string;
  plan: WeeklyMealPlan;
  eligibleCount: number;
};

export type ElementaryBreakfastWeekFailure = {
  ok: false;
  status: 'INSUFFICIENT_CANDIDATES';
  seed: string;
  eligibleCount: number;
  requiredCount: typeof REQUIRED_SLOT_COUNT;
};

export type ElementaryBreakfastWeekResult =
  | ElementaryBreakfastWeekSuccess
  | ElementaryBreakfastWeekFailure;

type SoftDiversityOptions = {
  capSchoolMorning: boolean;
  capRiceBread: boolean;
  requireOatmeal: boolean;
  requireOther: boolean;
};

type SearchOptions = {
  planSeed: string;
  enforceLongCook: boolean;
  enforceEggStreak: boolean;
  soft: SoftDiversityOptions;
};

const HARD_ONLY_SOFT: SoftDiversityOptions = {
  capSchoolMorning: false,
  capRiceBread: false,
  requireOatmeal: false,
  requireOther: false,
};

type Rng = { next: () => number };

function mulberry32(seed: number): Rng {
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

function hashSeed(seed: string): number {
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

function shuffleInPlace<T>(items: T[], rng: Rng): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng.next() * (i + 1));
    const current = items[i]!;
    items[i] = items[j]!;
    items[j] = current;
  }
  return items;
}

function blob(recipe: Recipe): string {
  return [recipe.name, recipe.category.join(' '), recipe.searchTags.join(' ')].join(' ');
}

export function classifyWeeklyPlanDiversity(recipe: Recipe): {
  diversityCategory: WeeklyPlanDiversityCategory;
  formGroup: WeeklyPlanFormGroup;
  eggCentric: boolean;
} {
  const text = blob(recipe);
  const dishType = recipe.standardMetadata.dishType;
  const ingredientNames = recipe.ingredients.map((item) => item.name).join(' ');

  const isRiceBall = /주먹밥|밥버거/.test(text);
  const isSandwichToast =
    dishType === 'sandwich' || /토스트|샌드위치/.test(text) || /프렌치토스트/.test(text);
  const isOatmealCereal = /오트밀|시리얼/.test(text);
  const hasRiceStaple =
    dishType === 'rice' ||
    dishType === 'rice_bowl' ||
    isRiceBall ||
    /덮밥|볶음밥|오므라이스|김밥|주먹밥|밥버거/.test(text) ||
    recipe.ingredients.some((item) => item.group === 'main' && item.iconKey === 'rice');
  const hasBreadStaple =
    isSandwichToast ||
    /식빵|토스트|샌드위치|핫케이크|팬케이크/.test(text) ||
    recipe.ingredients.some(
      (item) => item.group === 'main' && (item.iconKey === 'bread' || /식빵|토스트/.test(item.name)),
    );

  let diversityCategory: WeeklyPlanDiversityCategory = 'other';
  if (isOatmealCereal) diversityCategory = 'oatmeal_cereal';
  else if (hasRiceStaple) diversityCategory = 'rice';
  else if (hasBreadStaple) diversityCategory = 'bread';

  const formGroup: WeeklyPlanFormGroup = isRiceBall
    ? 'rice_ball'
    : isSandwichToast
      ? 'sandwich_toast'
      : 'other';

  const eggCentric =
    /계란|에그|오믈렛|오므라|스크램블|핫케이크|프렌치토스트/.test(text) ||
    (/토스트|샌드위치/.test(text) && /계란/.test(ingredientNames));

  return { diversityCategory, formGroup, eggCentric };
}

function hasBlockedCollision(recipe: Recipe): boolean {
  return recipe.familyAudience.collisionFlags.some((flag) =>
    (BLOCKED_COLLISIONS as readonly string[]).includes(flag),
  );
}

export function isElementaryBreakfastWeekEligible(recipe: Recipe): boolean {
  const { familyAudience, standardMetadata } = recipe;
  if (!familyAudience.audiences.includes('elementary')) return false;
  if (familyAudience.reviewStatus !== 'explicit') return false;
  if (!standardMetadata.mealTypes.includes('breakfast')) return false;
  if (hasBlockedCollision(recipe)) return false;
  if (familyAudience.safetySignals.isSideDish) return false;

  const childFeed = isEligibleForChildFeed(familyAudience, {
    audience: 'elementary',
    mealType: 'breakfast',
    allowSideDish: false,
  });
  return childFeed.ok;
}

export function listElementaryBreakfastWeekCandidates(
  recipes: readonly Recipe[] = HANKKI_RECIPES,
): ElementaryBreakfastWeekCandidate[] {
  return recipes
    .filter(
      (recipe) => isElementaryBreakfastWeekEligible(recipe) && !isElementaryWeeklyExcluded(recipe.id),
    )
    .map((recipe) => {
      const classified = classifyWeeklyPlanDiversity(recipe);
      return {
        recipe,
        ...classified,
        longCook: recipe.time >= LONG_COOK_MINUTES,
        schoolMorningFriendly: recipe.familyAudience.childMeal?.schoolMorningFriendly ?? null,
      };
    });
}

function countCategory(
  slots: readonly ElementaryBreakfastWeekCandidate[],
  category: WeeklyPlanDiversityCategory,
): number {
  return slots.filter((item) => item.diversityCategory === category).length;
}

function countSchoolMorning(slots: readonly ElementaryBreakfastWeekCandidate[]): number {
  return slots.filter((item) => item.schoolMorningFriendly === true).length;
}

function scoreCandidate(
  planSeed: string,
  slotIndex: number,
  day: WeeklyPlanDay,
  chosen: readonly ElementaryBreakfastWeekCandidate[],
  candidate: ElementaryBreakfastWeekCandidate,
): number {
  const prev = chosen[chosen.length - 1] ?? null;
  let score = weeklyPlanQualityScoreBoost(candidate.recipe);
  score += weeklyPlanQualityWeekPenalty(
    chosen.map((item) => item.recipe),
    candidate.recipe,
  );
  score += weeklyPlanSchoolMorningScoreBoost(day, candidate.schoolMorningFriendly);
  score += weeklyPlanSeedSelectionJitter(planSeed, slotIndex, candidate.recipe.id);
  if (prev && prev.diversityCategory !== candidate.diversityCategory) score += 4;
  if (prev && prev.formGroup !== candidate.formGroup) score += 3;
  if (prev && !(prev.eggCentric && candidate.eggCentric)) score += 3;
  if (prev && !(prev.longCook && candidate.longCook)) score += 5;
  const eggDays = chosen.filter((item) => item.eggCentric).length;
  if (candidate.eggCentric) {
    if (eggDays >= 3) score -= 10;
    else if (eggDays >= 2) score -= 4;
  }
  if (countCategory(chosen, 'oatmeal_cereal') === 0 && candidate.diversityCategory === 'oatmeal_cereal') {
    score += 12;
  }
  if (countCategory(chosen, 'other') === 0 && candidate.diversityCategory === 'other') {
    score += 12;
  }
  if (candidate.diversityCategory === 'rice' && countCategory(chosen, 'rice') >= 2) score -= 6;
  if (candidate.diversityCategory === 'bread' && countCategory(chosen, 'bread') >= 2) score -= 6;
  if (candidate.schoolMorningFriendly === true && countSchoolMorning(chosen) >= SOFT_MAX_SCHOOL_MORNING) {
    score -= 10;
  }
  return score;
}

function passesSoftDiversity(
  chosen: readonly ElementaryBreakfastWeekCandidate[],
  next: ElementaryBreakfastWeekCandidate,
  remainingAfterPick: readonly ElementaryBreakfastWeekCandidate[],
  opts: SoftDiversityOptions,
): boolean {
  if (
    opts.capSchoolMorning &&
    next.schoolMorningFriendly === true &&
    countSchoolMorning(chosen) >= SOFT_MAX_SCHOOL_MORNING
  ) {
    return false;
  }
  if (opts.capRiceBread && next.diversityCategory === 'rice' && countCategory(chosen, 'rice') >= SOFT_MAX_RICE) {
    return false;
  }
  if (opts.capRiceBread && next.diversityCategory === 'bread' && countCategory(chosen, 'bread') >= SOFT_MAX_BREAD) {
    return false;
  }

  const nextChosen = [...chosen, next];
  const slotsLeftAfter = REQUIRED_SLOT_COUNT - nextChosen.length;
  let missingRequired = 0;
  if (opts.requireOatmeal && countCategory(nextChosen, 'oatmeal_cereal') === 0) {
    if (remainingAfterPick.every((item) => item.diversityCategory !== 'oatmeal_cereal')) return false;
    missingRequired += 1;
  }
  if (opts.requireOther && countCategory(nextChosen, 'other') === 0) {
    if (remainingAfterPick.every((item) => item.diversityCategory !== 'other')) return false;
    missingRequired += 1;
  }
  return missingRequired <= slotsLeftAfter;
}

function eggStreak(
  prevSlots: readonly ElementaryBreakfastWeekCandidate[],
  next: ElementaryBreakfastWeekCandidate,
): number {
  if (!next.eggCentric) return 0;
  let streak = 1;
  for (let i = prevSlots.length - 1; i >= 0; i -= 1) {
    if (!prevSlots[i]?.eggCentric) break;
    streak += 1;
  }
  return streak;
}

function passesHardRules(
  prevSlots: readonly ElementaryBreakfastWeekCandidate[],
  next: ElementaryBreakfastWeekCandidate,
  options: { enforceLongCook: boolean; enforceEggStreak: boolean },
): boolean {
  const prev = prevSlots[prevSlots.length - 1];
  if (prev) {
    if (prev.formGroup === 'sandwich_toast' && next.formGroup === 'sandwich_toast') return false;
    if (prev.formGroup === 'rice_ball' && next.formGroup === 'rice_ball') return false;
    if (options.enforceLongCook && prev.longCook && next.longCook) return false;
  }
  if (options.enforceEggStreak && eggStreak(prevSlots, next) > MAX_EGG_STREAK) return false;
  return true;
}

function searchWeek(
  remaining: ElementaryBreakfastWeekCandidate[],
  chosen: ElementaryBreakfastWeekCandidate[],
  options: SearchOptions,
): ElementaryBreakfastWeekCandidate[] | null {
  if (chosen.length === REQUIRED_SLOT_COUNT) return chosen;
  const day = WEEKLY_PLAN_DAYS[chosen.length]!;

  const slotIndex = chosen.length;
  const ranked = remaining
    .map((candidate, index) => ({
      candidate,
      index,
      score: scoreCandidate(options.planSeed, slotIndex, day, chosen, candidate),
      jitter: weeklyPlanSeedSelectionJitter(options.planSeed, slotIndex, candidate.recipe.id),
    }))
    .filter((entry) => {
      if (!passesHardRules(chosen, entry.candidate, options)) return false;
      const remainingAfterPick = remaining.filter((item) => item.recipe.id !== entry.candidate.recipe.id);
      return passesSoftDiversity(chosen, entry.candidate, remainingAfterPick, options.soft);
    })
    .sort((a, b) => b.score - a.score || b.jitter - a.jitter || a.index - b.index);

  for (const entry of ranked) {
    const nextChosen = [...chosen, entry.candidate];
    const nextRemaining = remaining.filter((item) => item.recipe.id !== entry.candidate.recipe.id);
    const found = searchWeek(nextRemaining, nextChosen, options);
    if (found) return found;
  }
  return null;
}

function toSlot(day: WeeklyPlanDay, candidate: ElementaryBreakfastWeekCandidate): WeeklyPlanSlot {
  return {
    day,
    mealType: 'breakfast',
    recipeId: candidate.recipe.id,
    recipeName: candidate.recipe.name,
    time: candidate.recipe.time,
    schoolMorningFriendly: candidate.schoolMorningFriendly,
    diversityCategory: candidate.diversityCategory,
  };
}

function buildPlan(seed: string, picked: ElementaryBreakfastWeekCandidate[]): WeeklyMealPlan {
  return {
    id: `weekly-elementary-breakfast:${seed}`,
    audience: 'elementary',
    mealType: 'breakfast',
    seed,
    slots: picked.map((candidate, index) => toSlot(WEEKLY_PLAN_DAYS[index]!, candidate)),
  };
}

function packBreakfastWeek(
  resolvedSeed: string,
  eligible: ElementaryBreakfastWeekCandidate[],
): ElementaryBreakfastWeekCandidate[] | null {
  const rng = mulberry32(hashSeed(resolvedSeed));
  const shuffled = shuffleInPlace([...eligible], rng);
  const hasOatmeal = shuffled.some((item) => item.diversityCategory === 'oatmeal_cereal');
  const hasOther = shuffled.some((item) => item.diversityCategory === 'other');

  const softPhases: SoftDiversityOptions[] = [
    {
      capSchoolMorning: true,
      capRiceBread: true,
      requireOatmeal: hasOatmeal,
      requireOther: hasOther,
    },
    {
      capSchoolMorning: true,
      capRiceBread: true,
      requireOatmeal: hasOatmeal,
      requireOther: false,
    },
    {
      capSchoolMorning: true,
      capRiceBread: true,
      requireOatmeal: false,
      requireOther: hasOther,
    },
    {
      capSchoolMorning: true,
      capRiceBread: true,
      requireOatmeal: false,
      requireOther: false,
    },
    HARD_ONLY_SOFT,
  ];

  for (const soft of softPhases) {
    const packed =
      searchWeek(shuffled, [], { planSeed: resolvedSeed, enforceLongCook: true, enforceEggStreak: true, soft }) ??
      searchWeek(shuffled, [], { planSeed: resolvedSeed, enforceLongCook: false, enforceEggStreak: true, soft }) ??
      searchWeek(shuffled, [], { planSeed: resolvedSeed, enforceLongCook: false, enforceEggStreak: false, soft });
    if (packed) return packed;
  }
  return null;
}

/**
 * Deterministic when `seed` is provided. Same seed → same week.
 * Soft diversity is attempted first, then dropped. Hard safety rules stay.
 */
export function generateElementaryBreakfastWeek(
  seed?: string | number,
  recipes: readonly Recipe[] = HANKKI_RECIPES,
  options?: ElementaryWeeklyPlanGenerateOptions,
): ElementaryBreakfastWeekResult {
  const resolvedSeed = normalizeWeeklyPlanSeed(seed);
  const fullEligible = listElementaryBreakfastWeekCandidates(recipes);
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
      const packed = packBreakfastWeek(attemptSeed, filteredEligible);
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
      const packed = packBreakfastWeek(`${attemptSeed}:fallback`, fullEligible);
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

  const packed = packBreakfastWeek(resolvedSeed, fullEligible);
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
