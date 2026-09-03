/**
 * Sprint v1.1 — baby food 7-day weekly plan (data layer).
 * Uses approved baby feed pool per stage only. Does not prescribe medical schedules.
 */
import {
  isEligibleBabyFoodFeedRecipe,
  listBabyFoodFeedRecipes,
  type BabyFoodFeedStage,
} from './babyFoodFeed';
import { HANKKI_RECIPES } from './hankkiRecipes';
import {
  WEEKLY_PLAN_DAYS,
  type BabyFoodStage,
  type WeeklyMealPlan,
  type WeeklyPlanDay,
  type WeeklyPlanSlot,
} from './recipeFamilyAudienceTypes';
import type { StandardMealType } from './recipeStandardMetadataTypes';
import {
  hashWeeklyPlanSeed,
  mulberry32,
  normalizeWeeklyPlanSeed,
  recipeWeeklyTextBlob,
  shuffleInPlace,
  WEEKLY_PLAN_REQUIRED_SLOT_COUNT,
} from './elementaryWeeklyPlanCommon';
import type { Recipe } from './types';

const REQUIRED_SLOT_COUNT = WEEKLY_PLAN_REQUIRED_SLOT_COUNT;
const MAX_PROTEIN_STREAK = 2;
const MAX_VEG_FRUIT_STREAK = 2;
const MAX_TEXTURE_STREAK = 2;
const MAX_FAMILY_STREAK = 1;

export type BabyWeeklyProteinGroup =
  | 'beef'
  | 'chicken'
  | 'egg'
  | 'tofu'
  | 'fish'
  | 'other';

export type BabyWeeklyVegFruitGroup =
  | 'broccoli'
  | 'carrot'
  | 'pumpkin'
  | 'apple'
  | 'pear'
  | 'spinach'
  | 'potato'
  | 'zucchini'
  | 'other';

export type BabyWeeklyTextureGroup =
  | 'thin_puree'
  | 'thick_puree'
  | 'porridge'
  | 'mashed'
  | 'soft'
  | 'finger'
  | 'transition';

export type BabyWeeklyPlanCandidate = {
  recipe: Recipe;
  proteinGroup: BabyWeeklyProteinGroup;
  vegFruitGroup: BabyWeeklyVegFruitGroup;
  textureGroup: BabyWeeklyTextureGroup;
  familyKey: string;
};

export type BabyWeeklyPlanSuccess = {
  ok: true;
  status: 'ok';
  seed: string;
  stage: BabyFoodFeedStage;
  plan: WeeklyMealPlan;
  eligibleCount: number;
};

export type BabyWeeklyPlanFailure = {
  ok: false;
  status: 'INSUFFICIENT_CANDIDATES';
  seed: string;
  stage: BabyFoodFeedStage;
  eligibleCount: number;
  requiredCount: typeof REQUIRED_SLOT_COUNT;
};

export type BabyWeeklyPlanResult = BabyWeeklyPlanSuccess | BabyWeeklyPlanFailure;

type SearchOptions = {
  enforceProteinStreak: boolean;
  enforceVegFruitStreak: boolean;
  enforceTextureStreak: boolean;
  enforceFamilyStreak: boolean;
};

function ingredientBlob(recipe: Recipe): string {
  return [
    recipeWeeklyTextBlob(recipe),
    ...recipe.ingredients.map((item) => item.name),
  ].join(' ');
}

function classifyBabyProtein(recipe: Recipe): BabyWeeklyProteinGroup {
  const text = ingredientBlob(recipe);
  if (/소고기|쇠고기/.test(text)) return 'beef';
  if (/닭|닭고기/.test(text)) return 'chicken';
  if (/계란|달걀/.test(text)) return 'egg';
  if (/두부/.test(text)) return 'tofu';
  if (/생선|연어|고등어|명태|대구/.test(text)) return 'fish';
  return 'other';
}

function classifyBabyVegFruit(recipe: Recipe): BabyWeeklyVegFruitGroup {
  const text = ingredientBlob(recipe);
  if (/브로콜리/.test(text)) return 'broccoli';
  if (/당근/.test(text)) return 'carrot';
  if (/호박|애호박/.test(text)) return 'pumpkin';
  if (/사과/.test(text)) return 'apple';
  if (/배/.test(text)) return 'pear';
  if (/시금치/.test(text)) return 'spinach';
  if (/감자/.test(text)) return 'potato';
  if (/애호박|호박|주키니/.test(text)) return 'zucchini';
  return 'other';
}

function classifyBabyTexture(recipe: Recipe): BabyWeeklyTextureGroup {
  const texture = recipe.familyAudience.babyFood?.texture;
  const name = recipe.name;
  if (texture === 'thin_puree' || texture === 'liquid' || /미음/.test(name)) return 'thin_puree';
  if (texture === 'thick_puree' || /퓌레/.test(name)) return 'thick_puree';
  if (/죽/.test(name) && texture !== 'family_transition') return 'porridge';
  if (texture === 'mashed' || /무른밥/.test(name)) return 'mashed';
  if (texture === 'finger_food') return 'finger';
  if (texture === 'family_transition' || /진밥|국밥/.test(name)) return 'transition';
  if (texture === 'soft_chunks') return 'soft';
  return 'porridge';
}

function babyMenuFamilyKey(recipe: Recipe): string {
  const protein = classifyBabyProtein(recipe);
  const texture = classifyBabyTexture(recipe);
  const stem = recipe.name.replace(/\s/g, '').slice(0, 6);
  return `${protein}:${texture}:${stem}`;
}

export function isBabyWeeklyPlanEligible(recipe: Recipe, stage: BabyFoodFeedStage): boolean {
  if (!isEligibleBabyFoodFeedRecipe(recipe, stage)) return false;
  const review = recipe.familyAudience.babySafetyReview;
  if (review?.honeyListed) return false;
  if (recipe.familyAudience.safetySignals.honeyListed) return false;
  return true;
}

export function listBabyWeeklyPlanCandidates(stage: BabyFoodFeedStage): BabyWeeklyPlanCandidate[] {
  return listBabyFoodFeedRecipes(stage)
    .filter((recipe) => isBabyWeeklyPlanEligible(recipe, stage))
    .map((recipe) => ({
      recipe,
      proteinGroup: classifyBabyProtein(recipe),
      vegFruitGroup: classifyBabyVegFruit(recipe),
      textureGroup: classifyBabyTexture(recipe),
      familyKey: babyMenuFamilyKey(recipe),
    }));
}

function streakCount<T>(
  slots: readonly BabyWeeklyPlanCandidate[],
  pick: (item: BabyWeeklyPlanCandidate) => T,
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
  chosen: readonly BabyWeeklyPlanCandidate[],
  candidate: BabyWeeklyPlanCandidate,
): number {
  const prev = chosen[chosen.length - 1] ?? null;
  let score = 0;
  if (prev && prev.proteinGroup !== candidate.proteinGroup) score += 4;
  if (prev && prev.vegFruitGroup !== candidate.vegFruitGroup) score += 3;
  if (prev && prev.textureGroup !== candidate.textureGroup) score += 3;
  if (prev && prev.familyKey !== candidate.familyKey) score += 6;
  return score;
}

function passesHardRules(
  prevSlots: readonly BabyWeeklyPlanCandidate[],
  next: BabyWeeklyPlanCandidate,
  options: SearchOptions,
): boolean {
  const prev = prevSlots[prevSlots.length - 1];
  if (prev && prev.familyKey === next.familyKey) return false;
  if (
    options.enforceFamilyStreak &&
    streakCount(prevSlots, (item) => item.familyKey, next.familyKey) >= MAX_FAMILY_STREAK
  ) {
    return false;
  }
  if (
    options.enforceProteinStreak &&
    streakCount(prevSlots, (item) => item.proteinGroup, next.proteinGroup) >= MAX_PROTEIN_STREAK
  ) {
    return false;
  }
  if (
    options.enforceVegFruitStreak &&
    streakCount(prevSlots, (item) => item.vegFruitGroup, next.vegFruitGroup) >= MAX_VEG_FRUIT_STREAK
  ) {
    return false;
  }
  if (
    options.enforceTextureStreak &&
    streakCount(prevSlots, (item) => item.textureGroup, next.textureGroup) >= MAX_TEXTURE_STREAK
  ) {
    return false;
  }
  return true;
}

function searchWeek(
  remaining: BabyWeeklyPlanCandidate[],
  chosen: BabyWeeklyPlanCandidate[],
  options: SearchOptions,
): BabyWeeklyPlanCandidate[] | null {
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

function resolveSlotMealType(recipe: Recipe): StandardMealType {
  const mealTypes = recipe.standardMetadata.mealTypes;
  if (mealTypes.includes('lunch')) return 'lunch';
  if (mealTypes.includes('dinner')) return 'dinner';
  if (mealTypes.includes('breakfast')) return 'breakfast';
  if (mealTypes.includes('snack')) return 'snack';
  return 'lunch';
}

function toSlot(day: WeeklyPlanDay, candidate: BabyWeeklyPlanCandidate, stage: BabyFoodStage): WeeklyPlanSlot {
  return {
    day,
    mealType: resolveSlotMealType(candidate.recipe),
    recipeId: candidate.recipe.id,
    recipeName: candidate.recipe.name,
    time: candidate.recipe.time,
    schoolMorningFriendly: null,
    diversityCategory: 'other',
    babyStage: stage,
  };
}

function buildPlan(stage: BabyFoodFeedStage, seed: string, picked: BabyWeeklyPlanCandidate[]): WeeklyMealPlan {
  return {
    id: `weekly-baby:${stage}:${seed}`,
    audience: 'baby',
    mealType: 'lunch',
    seed,
    babyStage: stage,
    slots: picked.map((candidate, index) => toSlot(WEEKLY_PLAN_DAYS[index]!, candidate, stage)),
  };
}

function sameRecipeSet(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((id) => setA.has(id));
}

function attemptGenerate(
  stage: BabyFoodFeedStage,
  seed: string,
  shuffled: BabyWeeklyPlanCandidate[],
): BabyWeeklyPlanCandidate[] | null {
  const phases: SearchOptions[] = [
    {
      enforceProteinStreak: true,
      enforceVegFruitStreak: true,
      enforceTextureStreak: true,
      enforceFamilyStreak: true,
    },
    {
      enforceProteinStreak: true,
      enforceVegFruitStreak: true,
      enforceTextureStreak: false,
      enforceFamilyStreak: true,
    },
    {
      enforceProteinStreak: false,
      enforceVegFruitStreak: false,
      enforceTextureStreak: false,
      enforceFamilyStreak: true,
    },
    {
      enforceProteinStreak: false,
      enforceVegFruitStreak: false,
      enforceTextureStreak: false,
      enforceFamilyStreak: false,
    },
  ];

  for (const options of phases) {
    const packed = searchWeek(shuffled, [], options);
    if (packed) return packed;
  }
  return null;
}

export function generateBabyWeeklyPlan(
  stage: BabyFoodFeedStage,
  seed?: string | number,
  options?: { avoidRecipeIds?: readonly string[] },
): BabyWeeklyPlanResult {
  const resolvedSeed = normalizeWeeklyPlanSeed(seed);
  const eligible = listBabyWeeklyPlanCandidates(stage);
  if (eligible.length < REQUIRED_SLOT_COUNT) {
    return {
      ok: false,
      status: 'INSUFFICIENT_CANDIDATES',
      seed: resolvedSeed,
      stage,
      eligibleCount: eligible.length,
      requiredCount: REQUIRED_SLOT_COUNT,
    };
  }

  const avoid = options?.avoidRecipeIds ?? [];
  const attempts = [resolvedSeed, `${resolvedSeed}:alt1`, `${resolvedSeed}:alt2`, `${resolvedSeed}:alt3`];

  for (const attemptSeed of attempts) {
    const rng = mulberry32(hashWeeklyPlanSeed(attemptSeed));
    const shuffled = shuffleInPlace([...eligible], rng);
    const packed = attemptGenerate(stage, attemptSeed, shuffled);
    if (!packed) continue;

    const ids = packed.map((item) => item.recipe.id);
    if (avoid.length > 0 && sameRecipeSet(ids, avoid)) continue;

    return {
      ok: true,
      status: 'ok',
      seed: attemptSeed,
      stage,
      plan: buildPlan(stage, attemptSeed, packed),
      eligibleCount: eligible.length,
    };
  }

  return {
    ok: false,
    status: 'INSUFFICIENT_CANDIDATES',
    seed: resolvedSeed,
    stage,
    eligibleCount: eligible.length,
    requiredCount: REQUIRED_SLOT_COUNT,
  };
}

export function listBabyWeeklyPlanStageCounts(
  recipes: readonly Recipe[] = HANKKI_RECIPES,
): Record<BabyFoodFeedStage, number> {
  return {
    early: listBabyWeeklyPlanCandidates('early').length,
    middle: listBabyWeeklyPlanCandidates('middle').length,
    late: listBabyWeeklyPlanCandidates('late').length,
    completion: listBabyWeeklyPlanCandidates('completion').length,
  };
}

export { normalizeWeeklyPlanSeed };
