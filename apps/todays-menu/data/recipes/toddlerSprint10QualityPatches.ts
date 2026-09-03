/**
 * Sprint 10 — A-grade quality for snack→breakfast promoted recipes.
 * Editorial only; nutrition stays unverified. No new recipe IDs.
 */
import type { ElementaryRecipeQualityMetadata } from './elementaryRecipeQualityTypes';
import type { Recipe, RecipeStepContent } from './types';
import { TODDLER_SPRINT10_BREAKFAST_PROMOTED_IDS } from './toddlerBreakfastPoolPromotions';

export { TODDLER_SPRINT10_BREAKFAST_PROMOTED_IDS };

type StepUpdate = Partial<Pick<RecipeStepContent, 'title' | 'instruction' | 'tip'>>;

export type ToddlerSprint10Patch = {
  prepTimeMinutes: number;
  time?: number;
  serving?: number;
  ingredientAmounts?: Record<string, string>;
  stepUpdates?: StepUpdate[];
  elementaryQuality: ElementaryRecipeQualityMetadata;
};

const KID_CUT =
  '재료는 한입 크기(약 5mm~1cm)로 다지거나 으깨 주세요. 질기거나 큰 덩어리는 내지 않아요.';
const KID_SALT =
  '간은 성인 입맛보다 싱겁게. 아이 반응을 보고 보호자가 따로 간을 더하지 않는 것을 기본으로 해요.';
const STORAGE_DAY = '완성 후 냉장 1일. 유아식은 당일 섭취를 권장해요.';
const REHEAT_SOFT =
  '전자레인지 30~40초 또는 팬 약불 1분. 뜨거우면 2분 식혀 보호자가 확인 후 내요.';
const REHEAT_COLD =
  '요거트·과일 계열은 재가열하지 않고 냉장에서 바로 내요. 오트밀·찐 채소는 전자레인지 30초 후 온도 확인.';

function breakfastQuality(
  nameHint: string,
  extras: Partial<ElementaryRecipeQualityMetadata> = {},
): ElementaryRecipeQualityMetadata {
  return {
    prerequisites:
      extras.prerequisites ??
      `${nameHint} 재료를 미리 꺼내 두면 아침에도 바로 시작할 수 있어요.`,
    kidAdjustmentTip: extras.kidAdjustmentTip ?? `${KID_SALT} ${KID_CUT}`,
    substituteIngredients:
      extras.substituteIngredients ?? '우유 → 두유(알레르기 확인) / 요거트 → 무가당 플레인',
    storageInfo: extras.storageInfo ?? STORAGE_DAY,
    reheatingMethod: extras.reheatingMethod ?? REHEAT_SOFT,
    ...extras,
    contentVerificationStatus: 'reviewed',
    targetAudience: 'toddler',
    imageRecipeMatch: true,
    recipeQualityGrade: 'A',
  };
}

function applyStepUpdates(
  steps: RecipeStepContent[],
  updates: StepUpdate[] | undefined,
): RecipeStepContent[] {
  return steps.map((step, index) => {
    const patch = updates?.[index];
    if (!patch) return step;
    return {
      ...step,
      title: patch.title ?? step.title,
      instruction: patch.instruction ?? step.instruction,
      tip: patch.tip ?? step.tip,
    };
  });
}

/**
 * Six snack promotions — already measured, soft, non-egg, with hero images.
 * Soften "snack-only portion" tips so breakfast use is clear.
 */
export const TODDLER_SPRINT10_PATCHES: Record<string, ToddlerSprint10Patch> = {
  recipe_0332: {
    prepTimeMinutes: 1,
    elementaryQuality: breakfastQuality('바나나·요거트', {
      prerequisites: '바나나·플레인요구르트만 준비. 조리 열 없음. 총 약 5분.',
      reheatingMethod: REHEAT_COLD,
      kidAdjustmentTip: `꿀·견과 금지. ${KID_CUT}`,
      substituteIngredients: '우유 생략 가능 / 바나나 → 잘 익은 배(으깨기)',
    }),
    stepUpdates: [
      undefined,
      undefined,
      undefined,
      {
        tip: '아침·간식 모두 가능. 미리 만들어 두지 말고 바로 내요.',
      },
    ],
  },
  recipe_0333: {
    prepTimeMinutes: 2,
    elementaryQuality: breakfastQuality('찐고구마', {
      prerequisites:
        '전날 쪄 둔 고구마를 냉장해 두면 아침에는 데우기만 해도 돼요. 당일 전자레인지 기준 약 10분.',
      kidAdjustmentTip: `${KID_CUT} 통째로 쥐여 주지 않아요.`,
      substituteIngredients: '고구마 → 찐단호박(껍질·씨 제거) / 식용유 생략 가능',
    }),
    stepUpdates: [
      {
        tip: '가운데까지 익었는지 젓가락으로 확인해요. 전날 쪄 둔 것은 전자레인지 40초만 데워요.',
      },
    ],
  },
  recipe_0335: {
    prepTimeMinutes: 1,
    elementaryQuality: breakfastQuality('우유오트밀', {
      prerequisites: '오트밀·우유·바나나 준비. 냄비 중약불. 총 약 7분.',
      kidAdjustmentTip: `꿀·견과 금지. 바나나는 전부 으깨요. ${KID_CUT}`,
      substituteIngredients: '우유 → 두유(알레르기 확인) / 바나나 생략 시 물로 농도만 맞춤',
    }),
    stepUpdates: [
      undefined,
      undefined,
      undefined,
      {
        tip: '아침이면 한 끼 분량으로, 간식이면 조금 적게 담아요. 2분 식힌 뒤 내요.',
      },
    ],
  },
  recipe_0434: {
    prepTimeMinutes: 2,
    elementaryQuality: breakfastQuality('고구마요거트', {
      prerequisites:
        '전날 찐 고구마가 있으면 으깨+요거트만으로 약 5분. 당일 찌면 약 12분.',
      reheatingMethod: REHEAT_COLD,
      kidAdjustmentTip: `꿀·견과 금지. 고구마는 완전히 으깨요. ${KID_CUT}`,
      substituteIngredients: '고구마 → 찐단호박 / 요거트 → 무가당 플레인',
    }),
  },
  recipe_0495: {
    prepTimeMinutes: 5,
    elementaryQuality: breakfastQuality('찐단호박', {
      prerequisites:
        '단호박 껍질·씨 제거 후 1cm 큐브. 전날 쪄 두면 아침에는 데우기만. 당일 약 15분.',
      kidAdjustmentTip: `설탕·꿀 금지. 포크로 반쯤 으깨요. ${KID_CUT}`,
      substituteIngredients: '단호박 → 찐고구마 / 식용유 생략 가능',
    }),
  },
  recipe_0499: {
    prepTimeMinutes: 2,
    elementaryQuality: breakfastQuality('바나나오트밀볼', {
      prerequisites: '오트밀·우유·바나나 준비. 냄비 중약불. 총 약 10분.',
      kidAdjustmentTip: `꿀·견과 금지. 바나나는 전부 으깨요. ${KID_CUT}`,
      substituteIngredients: '우유 → 두유(알레르기 확인) / 오트밀 → 쌀가루 죽(별도 레시피)',
    }),
    stepUpdates: [
      undefined,
      undefined,
      undefined,
      {
        tip: '아침이면 한 끼 분량으로, 간식이면 조금 적게 담아요.',
      },
    ],
  },
};

export function applyToddlerSprint10QualityPatch(recipe: Recipe): Recipe {
  const patch = TODDLER_SPRINT10_PATCHES[recipe.id];
  if (!patch) return recipe;

  const ingredients = recipe.ingredients.map((item) => {
    const nextAmount = patch.ingredientAmounts?.[item.name];
    return nextAmount ? { ...item, amount: nextAmount } : item;
  });

  const steps = applyStepUpdates(recipe.recipe.steps, patch.stepUpdates);

  return {
    ...recipe,
    time: patch.time ?? recipe.time,
    serving: patch.serving ?? recipe.serving,
    prepTimeMinutes: patch.prepTimeMinutes,
    ingredients,
    nutrition: { ...recipe.nutrition, source: 'unverified' },
    recipe: { steps },
    elementaryQuality: patch.elementaryQuality,
  };
}

export function isToddlerSprint10PromotedBreakfast(recipeId: string): boolean {
  return (TODDLER_SPRINT10_BREAKFAST_PROMOTED_IDS as readonly string[]).includes(recipeId);
}
