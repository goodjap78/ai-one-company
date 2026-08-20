/**
 * Sprint 66-B — runtime-validated Meal Kit Pilot allowlist.
 * Source: Audit HIGH 24 ∩ runtime guard (2026-08-13) + Phase 3 merge (0301–0304).
 * No product titles / prices / URLs.
 */
export type MealKitValidatedEligibilityEntry = {
  readonly recipeId: string;
  readonly recipeName: string;
  readonly searchKeyword: string;
};

export const MEAL_KIT_VALIDATED_ELIGIBILITY: readonly MealKitValidatedEligibilityEntry[] = [
  { recipeId: '001', recipeName: '제육볶음', searchKeyword: '제육볶음 밀키트' },
  { recipeId: '003', recipeName: '김치찌개', searchKeyword: '김치찌개 밀키트' },
  { recipeId: '004', recipeName: '된장찌개', searchKeyword: '된장찌개 밀키트' },
  { recipeId: '006', recipeName: '불고기', searchKeyword: '불고기 밀키트' },
  { recipeId: '007', recipeName: '김치볶음밥', searchKeyword: '김치볶음밥 밀키트' },
  { recipeId: '012', recipeName: '닭볶음탕', searchKeyword: '닭볶음탕 밀키트' },
  { recipeId: '013', recipeName: '오징어볶음', searchKeyword: '오징어볶음 밀키트' },
  { recipeId: '014', recipeName: '갈비탕', searchKeyword: '갈비탕 밀키트' },
  { recipeId: '015', recipeName: '육개장', searchKeyword: '육개장 밀키트' },
  { recipeId: '024', recipeName: '부대찌개', searchKeyword: '부대찌개 밀키트' },
  { recipeId: '025', recipeName: '청국장찌개', searchKeyword: '청국장찌개 밀키트' },
  { recipeId: '026', recipeName: '소고기무국', searchKeyword: '소고기무국 밀키트' },
  { recipeId: '047', recipeName: '순대국', searchKeyword: '순대국 간편식' },
  { recipeId: '048', recipeName: '칼국수', searchKeyword: '칼국수 밀키트' },
  { recipeId: '049', recipeName: '수제비', searchKeyword: '수제비 밀키트' },
  { recipeId: '062', recipeName: '매콤순대볶음', searchKeyword: '매콤순대볶음 밀키트' },
  { recipeId: '065', recipeName: '치즈볼', searchKeyword: '치즈볼 밀키트' },
  { recipeId: '066', recipeName: '감자튀김', searchKeyword: '감자튀김 밀키트' },
  { recipeId: '088', recipeName: '비빔냉면', searchKeyword: '비빔냉면 밀키트' },
  { recipeId: 'recipe_0103', recipeName: '새우볶음밥', searchKeyword: '새우볶음밥 밀키트' },
  { recipeId: 'recipe_0125', recipeName: '황태해장국', searchKeyword: '황태해장국 밀키트' },
  { recipeId: 'recipe_0159', recipeName: '애호박전', searchKeyword: '애호박전 밀키트' },
  { recipeId: 'recipe_0272', recipeName: '고등어무조림', searchKeyword: '고등어무조림 밀키트' },
  { recipeId: 'recipe_0301', recipeName: '밀푀유나베', searchKeyword: '밀푀유나베 밀키트' },
  { recipeId: 'recipe_0302', recipeName: '불고기전골', searchKeyword: '불고기전골 밀키트' },
  { recipeId: 'recipe_0303', recipeName: '쭈꾸미볶음', searchKeyword: '쭈꾸미볶음 밀키트' },
  { recipeId: 'recipe_0304', recipeName: '해물탕', searchKeyword: '해물탕 밀키트' },
] as const;

export const MEAL_KIT_VALIDATED_COUNT = MEAL_KIT_VALIDATED_ELIGIBILITY.length;

/** Audit HIGH that failed current runtime guard (no valid meal-kit/ready-meal hit). */
export const MEAL_KIT_RUNTIME_FAIL_RECIPE_IDS = ['028'] as const;
