/**
 * Sprint v1.1 — toddler 7-day weekly plan (data layer).
 * One mealType per plan; reuses shared weekly RNG utilities.
 *
 * Sprint 11: breakfast / dinner delegate to dedicated generators with
 * stricter egg / diversity hard rules. Lunch / snack keep the generic packer.
 */
import {
  isEligibleToddlerMealFeedRecipe,
  listToddlerMealFeedRecipes,
  TODDLER_FEED_MEAL_TYPES,
  type ToddlerFeedMealType,
} from './toddlerMealFeed';
import { HANKKI_RECIPES } from './hankkiRecipes';
import {
  WEEKLY_PLAN_DAYS,
  type WeeklyMealPlan,
  type WeeklyPlanDay,
  type WeeklyPlanSlot,
} from './recipeFamilyAudienceTypes';
import {
  hashWeeklyPlanSeed,
  hasWeeklyPlanBlockedCollision,
  mulberry32,
  normalizeWeeklyPlanSeed,
  recipeWeeklyTextBlob,
  shuffleInPlace,
  WEEKLY_PLAN_LONG_COOK_MINUTES,
  WEEKLY_PLAN_REQUIRED_SLOT_COUNT,
} from './elementaryWeeklyPlanCommon';
import { generateToddlerBreakfastWeek } from './toddlerBreakfastWeeklyPlan';
import { generateToddlerDinnerWeek } from './toddlerDinnerWeeklyPlan';
import type { Recipe } from './types';

const REQUIRED_SLOT_COUNT = WEEKLY_PLAN_REQUIRED_SLOT_COUNT;
const LONG_COOK_MINUTES = WEEKLY_PLAN_LONG_COOK_MINUTES;
const MAX_PROTEIN_STREAK = 2;
const MAX_FORM_STREAK = 2;
const MAX_MAIN_INGREDIENT_STREAK = 2;
const MAX_EGG_SLOTS = 3;
const QUICK_BREAKFAST_MINUTES = 12;

export type ToddlerWeeklyProteinGroup =
  | 'beef'
  | 'chicken'
  | 'egg'
  | 'pork'
  | 'tofu'
  | 'fish'
  | 'other';

export type ToddlerWeeklyFormGroup = string;

export type ToddlerWeeklyPlanCandidate = {
  recipe: Recipe;
  mealType: ToddlerFeedMealType;
  formGroup: ToddlerWeeklyFormGroup;
  proteinGroup: ToddlerWeeklyProteinGroup;
  mainIngredientKey: string;
  longCook: boolean;
  isEggMenu: boolean;
};

export type ToddlerWeeklyPlanSuccess = {
  ok: true;
  status: 'ok';
  seed: string;
  mealType: ToddlerFeedMealType;
  plan: WeeklyMealPlan;
  eligibleCount: number;
};

export type ToddlerWeeklyPlanFailure = {
  ok: false;
  status: 'INSUFFICIENT_CANDIDATES';
  seed: string;
  mealType: ToddlerFeedMealType;
  eligibleCount: number;
  requiredCount: typeof REQUIRED_SLOT_COUNT;
};

export type ToddlerWeeklyPlanResult = ToddlerWeeklyPlanSuccess | ToddlerWeeklyPlanFailure;

type SearchOptions = {
  enforceLongCook: boolean;
  enforceProteinStreak: boolean;
  enforceFormStreak: boolean;
  enforceMainIngredientStreak: boolean;
  capEggMenus: boolean;
};

function ingredientBlob(recipe: Recipe): string {
  return [
    recipeWeeklyTextBlob(recipe),
    ...recipe.ingredients.map((item) => item.name),
  ].join(' ');
}

function classifyProtein(recipe: Recipe): ToddlerWeeklyProteinGroup {
  const text = ingredientBlob(recipe);
  if (/소고기|쇠고기/.test(text)) return 'beef';
  if (/닭|닭고기/.test(text)) return 'chicken';
  if (/계란|달걀/.test(text)) return 'egg';
  if (/돼지|돼지고기|햄/.test(text)) return 'pork';
  if (/두부/.test(text)) return 'tofu';
  if (/참치|생선|연어|고등어|명태|대구/.test(text)) return 'fish';
  return 'other';
}

function classifyMainIngredient(recipe: Recipe): string {
  const protein = classifyProtein(recipe);
  if (protein !== 'other') return protein;
  const text = ingredientBlob(recipe);
  if (/감자/.test(text)) return 'potato';
  if (/고구마/.test(text)) return 'sweet_potato';
  if (/당근/.test(text)) return 'carrot';
  if (/브로콜리/.test(text)) return 'broccoli';
  if (/시금치/.test(text)) return 'spinach';
  if (/사과/.test(text)) return 'apple';
  if (/바나나/.test(text)) return 'banana';
  const stem = recipe.name.replace(/\s/g, '').slice(0, 4);
  return `name:${stem}`;
}

function isEggMenu(recipe: Recipe): boolean {
  return classifyProtein(recipe) === 'egg' || /계란|달걀|오믈렛|스크램블/.test(recipe.name);
}

export function classifyToddlerWeeklyForm(
  recipe: Recipe,
  mealType: ToddlerFeedMealType,
): ToddlerWeeklyFormGroup {
  const text = recipeWeeklyTextBlob(recipe);
  switch (mealType) {
    case 'breakfast':
      if (/토스트|빵|베이글|샌드|크로와상/.test(text)) return 'bread';
      if (/계란|달걀|오믈렛|스크램블/.test(text)) return 'egg';
      if (/밥|죽|오트|시리얼|그래놀라|요거트/.test(text)) return 'grain';
      return 'other';
    case 'lunch':
      if (/덮밥/.test(text)) return 'rice_bowl';
      if (/볶음밥/.test(text)) return 'fried_rice';
      if (/밥|비빔밥|주먹밥|국밥/.test(text)) return 'rice_other';
      return 'non_rice';
    case 'dinner':
      if (/국|탕|찌개|스프|전골/.test(text)) return 'soup';
      if (/덮밥|볶음밥|비빔밥|국밥|한그릇/.test(text)) return 'one_bowl';
      if (/밥|조림|구이/.test(text)) return 'rice_side';
      return 'other';
    case 'snack':
      if (/요거트|요거/.test(text)) return 'yogurt';
      if (/팬케이크|핫케이크|전$|부침/.test(text)) return 'pancake';
      if (/찐|찜|스팀/.test(text)) return 'steamed';
      return 'other';
    default:
      return 'other';
  }
}

export function isToddlerWeeklyPlanEligible(
  recipe: Recipe,
  mealType: ToddlerFeedMealType,
): boolean {
  if (!isEligibleToddlerMealFeedRecipe(recipe, mealType)) return false;
  if (hasWeeklyPlanBlockedCollision(recipe)) return false;
  return true;
}

export function listToddlerWeeklyPlanCandidates(
  mealType: ToddlerFeedMealType,
): ToddlerWeeklyPlanCandidate[] {
  return listToddlerMealFeedRecipes(mealType)
    .filter((recipe) => isToddlerWeeklyPlanEligible(recipe, mealType))
    .map((recipe) => ({
      recipe,
      mealType,
      formGroup: classifyToddlerWeeklyForm(recipe, mealType),
      proteinGroup: classifyProtein(recipe),
      mainIngredientKey: classifyMainIngredient(recipe),
      longCook: recipe.time >= LONG_COOK_MINUTES,
      isEggMenu: isEggMenu(recipe),
    }));
}

export function listToddlerWeeklyPlanMealCounts(
  recipes: readonly Recipe[] = HANKKI_RECIPES,
): Record<ToddlerFeedMealType, number> {
  return {
    breakfast: listToddlerWeeklyPlanCandidates('breakfast').length,
    lunch: listToddlerWeeklyPlanCandidates('lunch').length,
    dinner: listToddlerWeeklyPlanCandidates('dinner').length,
    snack: listToddlerWeeklyPlanCandidates('snack').length,
  };
}

function streakCount<T>(
  slots: readonly ToddlerWeeklyPlanCandidate[],
  pick: (item: ToddlerWeeklyPlanCandidate) => T,
  value: T,
): number {
  let streak = 0;
  for (let i = slots.length - 1; i >= 0; i -= 1) {
    if (pick(slots[i]!) !== value) break;
    streak += 1;
  }
  return streak;
}

function countEggMenus(slots: readonly ToddlerWeeklyPlanCandidate[]): number {
  return slots.filter((item) => item.isEggMenu).length;
}

function scoreCandidate(
  chosen: readonly ToddlerWeeklyPlanCandidate[],
  candidate: ToddlerWeeklyPlanCandidate,
): number {
  const prev = chosen[chosen.length - 1] ?? null;
  let score = 0;
  if (prev && prev.formGroup !== candidate.formGroup) score += 4;
  if (prev && prev.proteinGroup !== candidate.proteinGroup) score += 4;
  if (prev && prev.mainIngredientKey !== candidate.mainIngredientKey) score += 5;
  if (prev && !(prev.longCook && candidate.longCook)) score += 4;

  if (candidate.mealType === 'breakfast' && candidate.recipe.time <= QUICK_BREAKFAST_MINUTES) {
    score += 3;
  }
  if (candidate.mealType === 'snack' && candidate.formGroup === 'other' && chosen.length >= 3) {
    score += 2;
  }
  if (candidate.isEggMenu && countEggMenus(chosen) >= MAX_EGG_SLOTS - 1) score -= 6;
  return score;
}

function passesHardRules(
  prevSlots: readonly ToddlerWeeklyPlanCandidate[],
  next: ToddlerWeeklyPlanCandidate,
  options: SearchOptions,
): boolean {
  const prev = prevSlots[prevSlots.length - 1];
  const mealType = next.mealType;

  if (prev) {
    if (mealType === 'lunch') {
      if (prev.formGroup === 'rice_bowl' && next.formGroup === 'rice_bowl') return false;
      if (prev.formGroup === 'fried_rice' && next.formGroup === 'fried_rice') return false;
    }
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
  if (
    options.enforceMainIngredientStreak &&
    streakCount(prevSlots, (item) => item.mainIngredientKey, next.mainIngredientKey) >=
      MAX_MAIN_INGREDIENT_STREAK
  ) {
    return false;
  }
  if (options.capEggMenus && next.isEggMenu && countEggMenus(prevSlots) >= MAX_EGG_SLOTS) {
    return false;
  }
  return true;
}

function searchWeek(
  remaining: ToddlerWeeklyPlanCandidate[],
  chosen: ToddlerWeeklyPlanCandidate[],
  options: SearchOptions,
): ToddlerWeeklyPlanCandidate[] | null {
  if (chosen.length === REQUIRED_SLOT_COUNT) return chosen;

  const ranked = remaining
    .map((candidate, index) => ({
      candidate,
      index,
      score: scoreCandidate(chosen, candidate),
    }))
    .filter((entry) => passesHardRules(chosen, entry.candidate, options))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  for (const entry of ranked) {
    const nextChosen = [...chosen, entry.candidate];
    const nextRemaining = remaining.filter((item) => item.recipe.id !== entry.candidate.recipe.id);
    const found = searchWeek(nextRemaining, nextChosen, options);
    if (found) return found;
  }
  return null;
}

function toSlot(
  day: WeeklyPlanDay,
  candidate: ToddlerWeeklyPlanCandidate,
): WeeklyPlanSlot {
  return {
    day,
    mealType: candidate.mealType,
    recipeId: candidate.recipe.id,
    recipeName: candidate.recipe.name,
    time: candidate.recipe.time,
    schoolMorningFriendly: null,
    diversityCategory: 'other',
  };
}

function buildPlan(
  mealType: ToddlerFeedMealType,
  seed: string,
  picked: ToddlerWeeklyPlanCandidate[],
): WeeklyMealPlan {
  return {
    id: `weekly-toddler:${mealType}:${seed}`,
    audience: 'toddler',
    mealType,
    seed,
    slots: picked.map((candidate, index) => toSlot(WEEKLY_PLAN_DAYS[index]!, candidate)),
  };
}

function attemptGenerate(
  mealType: ToddlerFeedMealType,
  shuffled: ToddlerWeeklyPlanCandidate[],
): ToddlerWeeklyPlanCandidate[] | null {
  const phases: SearchOptions[] = [
    {
      enforceLongCook: true,
      enforceProteinStreak: true,
      enforceFormStreak: true,
      enforceMainIngredientStreak: true,
      capEggMenus: true,
    },
    {
      enforceLongCook: true,
      enforceProteinStreak: true,
      enforceFormStreak: true,
      enforceMainIngredientStreak: true,
      capEggMenus: false,
    },
    {
      enforceLongCook: false,
      enforceProteinStreak: true,
      enforceFormStreak: true,
      enforceMainIngredientStreak: true,
      capEggMenus: false,
    },
    {
      enforceLongCook: false,
      enforceProteinStreak: true,
      enforceFormStreak: true,
      enforceMainIngredientStreak: false,
      capEggMenus: false,
    },
    {
      enforceLongCook: false,
      enforceProteinStreak: false,
      enforceFormStreak: true,
      enforceMainIngredientStreak: false,
      capEggMenus: false,
    },
    {
      enforceLongCook: false,
      enforceProteinStreak: false,
      enforceFormStreak: false,
      enforceMainIngredientStreak: false,
      capEggMenus: false,
    },
  ];

  for (const options of phases) {
    const packed = searchWeek(shuffled, [], options);
    if (packed) return packed;
  }
  return null;
}

export function generateToddlerWeeklyPlan(
  mealType: ToddlerFeedMealType,
  seed?: string | number,
  options?: { avoidRecipeIds?: readonly string[] },
): ToddlerWeeklyPlanResult {
  if (mealType === 'breakfast') {
    const result = generateToddlerBreakfastWeek(seed, HANKKI_RECIPES, options);
    if (!result.ok) {
      return {
        ok: false,
        status: 'INSUFFICIENT_CANDIDATES',
        seed: result.seed,
        mealType,
        eligibleCount: result.eligibleCount,
        requiredCount: REQUIRED_SLOT_COUNT,
      };
    }
    return {
      ok: true,
      status: 'ok',
      seed: result.seed,
      mealType,
      plan: result.plan,
      eligibleCount: result.eligibleCount,
    };
  }

  if (mealType === 'dinner') {
    const result = generateToddlerDinnerWeek(seed, HANKKI_RECIPES, options);
    if (!result.ok) {
      return {
        ok: false,
        status: 'INSUFFICIENT_CANDIDATES',
        seed: result.seed,
        mealType,
        eligibleCount: result.eligibleCount,
        requiredCount: REQUIRED_SLOT_COUNT,
      };
    }
    return {
      ok: true,
      status: 'ok',
      seed: result.seed,
      mealType,
      plan: result.plan,
      eligibleCount: result.eligibleCount,
    };
  }

  const resolvedSeed = normalizeWeeklyPlanSeed(seed);
  const eligible = listToddlerWeeklyPlanCandidates(mealType);
  if (eligible.length < REQUIRED_SLOT_COUNT) {
    return {
      ok: false,
      status: 'INSUFFICIENT_CANDIDATES',
      seed: resolvedSeed,
      mealType,
      eligibleCount: eligible.length,
      requiredCount: REQUIRED_SLOT_COUNT,
    };
  }

  const avoid = options?.avoidRecipeIds ?? [];
  const attempts = [resolvedSeed, `${resolvedSeed}:alt1`, `${resolvedSeed}:alt2`, `${resolvedSeed}:alt3`];

  for (const attemptSeed of attempts) {
    const rng = mulberry32(hashWeeklyPlanSeed(`${mealType}:${attemptSeed}`));
    const shuffled = shuffleInPlace([...eligible], rng);
    const packed = attemptGenerate(mealType, shuffled);
    if (!packed) continue;

    const ids = packed.map((item) => item.recipe.id);
    if (avoid.length > 0) {
      const avoidSet = new Set(avoid);
      if (ids.some((id) => avoidSet.has(id))) continue;
    }

    return {
      ok: true,
      status: 'ok',
      seed: attemptSeed,
      mealType,
      plan: buildPlan(mealType, attemptSeed, packed),
      eligibleCount: eligible.length,
    };
  }

  return {
    ok: false,
    status: 'INSUFFICIENT_CANDIDATES',
    seed: resolvedSeed,
    mealType,
    eligibleCount: eligible.length,
    requiredCount: REQUIRED_SLOT_COUNT,
  };
}

export { TODDLER_FEED_MEAL_TYPES, normalizeWeeklyPlanSeed };
export { generateToddlerBreakfastWeek } from './toddlerBreakfastWeeklyPlan';
export { generateToddlerDinnerWeek } from './toddlerDinnerWeeklyPlan';

