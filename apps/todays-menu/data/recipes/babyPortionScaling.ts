/**
 * Baby portion scaling + batch-cooking classification (runtime, no recipe body edits).
 * UI presets: 1 / 3 / 6. Storage days are intentionally omitted.
 */
import type { Recipe, RecipeIngredient } from './types';

export type BabyPortionScaling = 'scalable' | 'review_required' | 'not_scalable';
export type BabyBatchCooking = 'friendly' | 'single_meal' | 'review_required';

export const BABY_PORTION_UI_PRESETS = [1, 3, 6] as const;
export type BabyPortionPreset = (typeof BABY_PORTION_UI_PRESETS)[number];

const SCALABLE_AMOUNT =
  /^\s*\d+(?:\.\d+)?(?:\s*~\s*\d+(?:\.\d+)?)?\s*(?:g|ml|큰술|작은술|꼬집)\s*$/i;
const FRACTION_SCALABLE =
  /^\s*\d+\/\d+\s*(?:큰술|작은술|꼬집|g|ml)\s*$/i;
const VAGUE_AMOUNT = /적당량|약간|충분량|취향|조금|마음껏/;
const DISCRETE_AMOUNT = /\d+\s*(?:개|장|공기|캔|방울|줄|쪽|대)/;
const EGG_NAME = /계란|달걀/;
const FORMED_NAME = /밥볼|주먹밥|막대/;

function amountIsScalable(amount: string): boolean {
  const trimmed = amount.trim();
  if (!trimmed) return false;
  if (VAGUE_AMOUNT.test(trimmed)) return false;
  if (SCALABLE_AMOUNT.test(trimmed) || FRACTION_SCALABLE.test(trimmed)) return true;
  return false;
}

function ingredientNeedsReview(ing: RecipeIngredient): boolean {
  if (EGG_NAME.test(ing.name) && /\d+\s*개/.test(ing.amount)) return true;
  if (DISCRETE_AMOUNT.test(ing.amount) && !SCALABLE_AMOUNT.test(ing.amount.trim())) return true;
  if (/방울/.test(ing.amount)) return true;
  return false;
}

export function classifyBabyPortionScaling(recipe: Recipe): BabyPortionScaling {
  if (!recipe.familyAudience.audiences.includes('baby')) return 'not_scalable';

  const texture = recipe.familyAudience.babyFood?.texture;
  if (texture === 'finger_food') return 'review_required';
  if (FORMED_NAME.test(recipe.name)) return 'review_required';

  let hasVague = false;
  let hasReview = false;
  for (const ing of recipe.ingredients) {
    if (VAGUE_AMOUNT.test(ing.amount)) {
      hasVague = true;
      break;
    }
    if (ingredientNeedsReview(ing) || !amountIsScalable(ing.amount)) {
      hasReview = true;
    }
  }
  if (hasVague) return 'not_scalable';
  if (hasReview) return 'review_required';
  return 'scalable';
}

export function classifyBabyBatchCooking(recipe: Recipe): BabyBatchCooking {
  const texture = recipe.familyAudience.babyFood?.texture;
  if (texture === 'finger_food' || FORMED_NAME.test(recipe.name)) return 'single_meal';
  if (/계란찜|찜$/.test(recipe.name) && texture !== 'family_transition') {
    return 'review_required';
  }
  if (
    /미음|죽|퓌레|무른밥|진밥|국밥|국$|으깨|퓌레/.test(recipe.name) ||
    texture === 'thin_puree' ||
    texture === 'thick_puree' ||
    texture === 'mashed' ||
    texture === 'family_transition' ||
    texture === 'soft_chunks'
  ) {
    return 'friendly';
  }
  return 'review_required';
}

export function listBabyPortionScalingSummary(recipes: readonly Recipe[]): {
  scalable: Recipe[];
  reviewRequired: Recipe[];
  notScalable: Recipe[];
} {
  const baby = recipes.filter((r) => r.familyAudience.audiences.includes('baby'));
  return {
    scalable: baby.filter((r) => classifyBabyPortionScaling(r) === 'scalable'),
    reviewRequired: baby.filter((r) => classifyBabyPortionScaling(r) === 'review_required'),
    notScalable: baby.filter((r) => classifyBabyPortionScaling(r) === 'not_scalable'),
  };
}

/** Scale a single amount string by multiplier when mechanically safe; otherwise return original. */
export function scaleBabyIngredientAmount(
  amount: string,
  multiplier: number,
  scaling: BabyPortionScaling,
): string {
  if (scaling !== 'scalable' || multiplier === 1) return amount;
  const trimmed = amount.trim();
  const decimalMatch = trimmed.match(
    /^(\d+(?:\.\d+)?)(?:\s*~\s*(\d+(?:\.\d+)?))?\s*(g|ml|큰술|작은술|꼬집)$/i,
  );
  if (decimalMatch) {
    const a = Number(decimalMatch[1]) * multiplier;
    const unit = decimalMatch[3]!;
    if (decimalMatch[2]) {
      const b = Number(decimalMatch[2]) * multiplier;
      return `${formatScaledNumber(a)}~${formatScaledNumber(b)}${unit}`;
    }
    return `${formatScaledNumber(a)}${unit}`;
  }
  const fractionMatch = trimmed.match(/^(\d+)\/(\d+)\s*(g|ml|큰술|작은술|꼬집)$/i);
  if (fractionMatch) {
    const num = Number(fractionMatch[1]);
    const den = Number(fractionMatch[2]);
    if (!den) return amount;
    const scaled = (num / den) * multiplier;
    return `${formatScaledNumber(scaled)}${fractionMatch[3]!}`;
  }
  return amount;
}

function formatScaledNumber(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 100) / 100);
}
