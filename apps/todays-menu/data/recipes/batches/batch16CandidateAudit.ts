/**
 * Sprint 58.1 — Candidate pool audit for Batch 2 late night expansion.
 */
export type Batch2CandidateRecord = {
  name: string;
  category: string;
  status: 'selected' | 'excluded';
  reason?: string;
  recipeId?: string;
};

export const BATCH_2_CANDIDATE_AUDIT: Batch2CandidateRecord[] = [
  // Selected 30 (recipe_0191–0220)
  { name: '계란치즈라면', category: 'ramen_noodle', status: 'selected', recipeId: 'recipe_0191' },
  { name: '순두부라면', category: 'ramen_noodle', status: 'selected', recipeId: 'recipe_0192' },
  { name: '콩나물라면', category: 'ramen_noodle', status: 'selected', recipeId: 'recipe_0193' },
  { name: '김치비빔면', category: 'ramen_noodle', status: 'selected', recipeId: 'recipe_0194' },
  { name: '참치비빔면', category: 'ramen_noodle', status: 'selected', recipeId: 'recipe_0195' },
  { name: '볶음우동', category: 'ramen_noodle', status: 'selected', recipeId: 'recipe_0196' },
  { name: '매콤어묵우동', category: 'ramen_noodle', status: 'selected', recipeId: 'recipe_0197' },
  { name: '들기름비빔국수', category: 'ramen_noodle', status: 'selected', recipeId: 'recipe_0198' },
  { name: '치즈떡볶이', category: 'bunsik', status: 'selected', recipeId: 'recipe_0199' },
  { name: '간장떡볶이', category: 'bunsik', status: 'selected', recipeId: 'recipe_0200' },
  { name: '어묵떡볶이', category: 'bunsik', status: 'selected', recipeId: 'recipe_0201' },
  { name: '김치전', category: 'bunsik', status: 'selected', recipeId: 'recipe_0202' },
  { name: '감자전', category: 'bunsik', status: 'selected', recipeId: 'recipe_0203' },
  { name: '부추전', category: 'bunsik', status: 'selected', recipeId: 'recipe_0220' },
  { name: '매콤참치덮밥', category: 'spicy_quick', status: 'selected', recipeId: 'recipe_0204' },
  { name: '매운어묵볶음밥', category: 'spicy_quick', status: 'selected', recipeId: 'recipe_0205' },
  { name: '고추장계란밥', category: 'spicy_quick', status: 'selected', recipeId: 'recipe_0206' },
  { name: '매콤두부덮밥', category: 'spicy_quick', status: 'selected', recipeId: 'recipe_0207' },
  { name: '김치치즈밥', category: 'spicy_quick', status: 'selected', recipeId: 'recipe_0208' },
  { name: '계란두부국', category: 'light_late', status: 'selected', recipeId: 'recipe_0209' },
  { name: '오이참치무침', category: 'light_late', status: 'selected', recipeId: 'recipe_0210' },
  { name: '두부김치라이트', category: 'light_late', status: 'selected', recipeId: 'recipe_0211' },
  { name: '계란김밥볼', category: 'light_late', status: 'selected', recipeId: 'recipe_0212' },
  { name: '야채계란죽', category: 'light_late', status: 'selected', recipeId: 'recipe_0213' },
  { name: '매콤어묵볶음', category: 'anju', status: 'selected', recipeId: 'recipe_0214' },
  { name: '버터오징어볶음', category: 'anju', status: 'selected', recipeId: 'recipe_0215' },
  { name: '두부김치볶음', category: 'anju', status: 'selected', recipeId: 'recipe_0216' },
  { name: '콘치즈', category: 'snack', status: 'selected', recipeId: 'recipe_0217' },
  { name: '치즈감자', category: 'snack', status: 'selected', recipeId: 'recipe_0218' },
  { name: '마요감자', category: 'snack', status: 'selected', recipeId: 'recipe_0219' },
  // Excluded
  { name: '라면', category: 'ramen_noodle', status: 'excluded', reason: 'exact title exists' },
  { name: '라볶이', category: 'bunsik', status: 'excluded', reason: 'exact title exists' },
  { name: '떡볶이', category: 'bunsik', status: 'excluded', reason: 'exact title exists' },
  { name: '로제떡볶이', category: 'bunsik', status: 'excluded', reason: 'exact title exists' },
  { name: '치즈라면', category: 'ramen_noodle', status: 'excluded', reason: 'exact title exists; replaced by 계란치즈라면' },
  { name: '김치라면', category: 'ramen_noodle', status: 'excluded', reason: 'exact title exists' },
  { name: '비빔국수', category: 'ramen_noodle', status: 'excluded', reason: 'exact title exists' },
  { name: '냄비우동', category: 'ramen_noodle', status: 'excluded', reason: 'exact title exists' },
  { name: '어묵볶음', category: 'anju', status: 'excluded', reason: 'exact title exists; replaced by 매콤어묵볶음' },
  { name: '참치마요덮밥', category: 'spicy_quick', status: 'excluded', reason: 'exact title exists' },
  { name: '치즈계란밥', category: 'spicy_quick', status: 'excluded', reason: 'exact title exists' },
  { name: '순두부찌개', category: 'light_late', status: 'excluded', reason: 'exact title exists' },
  { name: '해물파전', category: 'bunsik', status: 'excluded', reason: 'exact title exists' },
  { name: '애호박전', category: 'bunsik', status: 'excluded', reason: 'exact title exists' },
  { name: '라면볶이', category: 'ramen_noodle', status: 'excluded', reason: 'exact title exists' },
];

export const BATCH_2_SELECTED_COUNT = BATCH_2_CANDIDATE_AUDIT.filter((c) => c.status === 'selected').length;
export const BATCH_2_EXCLUDED_COUNT = BATCH_2_CANDIDATE_AUDIT.filter((c) => c.status === 'excluded').length;
