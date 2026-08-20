/**
 * Sprint 66-A — Meal Kit Limited Pilot (HIGH only).
 * Extracted from docs/meal-kit-audit-results.json — no product prices/URLs.
 * MEDIUM / LOW / NONE are intentionally excluded.
 */
export type MealKitHighEligibilityEntry = {
  readonly recipeId: string;
  readonly recipeName: string;
  readonly quality: 'HIGH';
  /** Audit-validated Coupang search keyword — do not invent new ones. */
  readonly searchKeyword: string;
};

export const MEAL_KIT_HIGH_ELIGIBILITY: readonly MealKitHighEligibilityEntry[] = [
  { recipeId: '001', recipeName: '제육볶음', quality: 'HIGH', searchKeyword: '제육볶음 밀키트' },
  { recipeId: '003', recipeName: '김치찌개', quality: 'HIGH', searchKeyword: '김치찌개 밀키트' },
  { recipeId: '004', recipeName: '된장찌개', quality: 'HIGH', searchKeyword: '된장찌개 밀키트' },
  { recipeId: '006', recipeName: '불고기', quality: 'HIGH', searchKeyword: '불고기 밀키트' },
  { recipeId: '007', recipeName: '김치볶음밥', quality: 'HIGH', searchKeyword: '김치볶음밥 밀키트' },
  { recipeId: '012', recipeName: '닭볶음탕', quality: 'HIGH', searchKeyword: '닭볶음탕 밀키트' },
  { recipeId: '013', recipeName: '오징어볶음', quality: 'HIGH', searchKeyword: '오징어볶음 밀키트' },
  { recipeId: '014', recipeName: '갈비탕', quality: 'HIGH', searchKeyword: '갈비탕 밀키트' },
  { recipeId: '015', recipeName: '육개장', quality: 'HIGH', searchKeyword: '육개장 밀키트' },
  { recipeId: '024', recipeName: '부대찌개', quality: 'HIGH', searchKeyword: '부대찌개 밀키트' },
  { recipeId: '025', recipeName: '청국장찌개', quality: 'HIGH', searchKeyword: '청국장찌개 밀키트' },
  { recipeId: '026', recipeName: '소고기무국', quality: 'HIGH', searchKeyword: '소고기무국 밀키트' },
  { recipeId: '028', recipeName: '콩나물국', quality: 'HIGH', searchKeyword: '콩나물국 밀키트' },
  { recipeId: '047', recipeName: '순대국', quality: 'HIGH', searchKeyword: '순대국 간편식' },
  { recipeId: '048', recipeName: '칼국수', quality: 'HIGH', searchKeyword: '칼국수 밀키트' },
  { recipeId: '049', recipeName: '수제비', quality: 'HIGH', searchKeyword: '수제비 밀키트' },
  { recipeId: '062', recipeName: '매콤순대볶음', quality: 'HIGH', searchKeyword: '매콤순대볶음 밀키트' },
  { recipeId: '065', recipeName: '치즈볼', quality: 'HIGH', searchKeyword: '치즈볼 밀키트' },
  { recipeId: '066', recipeName: '감자튀김', quality: 'HIGH', searchKeyword: '감자튀김 밀키트' },
  { recipeId: '088', recipeName: '비빔냉면', quality: 'HIGH', searchKeyword: '비빔냉면 밀키트' },
  { recipeId: 'recipe_0103', recipeName: '새우볶음밥', quality: 'HIGH', searchKeyword: '새우볶음밥 밀키트' },
  { recipeId: 'recipe_0125', recipeName: '황태해장국', quality: 'HIGH', searchKeyword: '황태해장국 밀키트' },
  { recipeId: 'recipe_0159', recipeName: '애호박전', quality: 'HIGH', searchKeyword: '애호박전 밀키트' },
  { recipeId: 'recipe_0272', recipeName: '고등어무조림', quality: 'HIGH', searchKeyword: '고등어무조림 밀키트' },
] as const;

export const MEAL_KIT_HIGH_COUNT = MEAL_KIT_HIGH_ELIGIBILITY.length;
