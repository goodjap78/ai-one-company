/**
 * Sprint 58 — Candidate pool audit for Batch 1 breakfast expansion.
 * 45 candidates reviewed; 30 selected after duplicate checks against catalog 160.
 */
export type Batch1CandidateRecord = {
  name: string;
  category: string;
  status: 'selected' | 'excluded';
  reason?: string;
  recipeId?: string;
};

export const BATCH_1_CANDIDATE_AUDIT: Batch1CandidateRecord[] = [
  // — Selected 30 (recipe_0161–0190)
  { name: '닭가슴살죽', category: 'porridge', status: 'selected', recipeId: 'recipe_0161' },
  { name: '참치야채죽', category: 'porridge', status: 'selected', recipeId: 'recipe_0162' },
  { name: '단호박죽', category: 'porridge', status: 'selected', recipeId: 'recipe_0163' },
  { name: '버섯죽', category: 'porridge', status: 'selected', recipeId: 'recipe_0164' },
  { name: '감자계란죽', category: 'porridge', status: 'selected', recipeId: 'recipe_0165' },
  { name: '두부야채죽', category: 'porridge', status: 'selected', recipeId: 'recipe_0166' },
  { name: '에그스크램블', category: 'egg', status: 'selected', recipeId: 'recipe_0167' },
  { name: '햄에그샌드위치', category: 'egg', status: 'selected', recipeId: 'recipe_0168' },
  { name: '채소오믈렛', category: 'egg', status: 'selected', recipeId: 'recipe_0169' },
  { name: '토마토계란볶음', category: 'egg', status: 'selected', recipeId: 'recipe_0170' },
  { name: '치즈계란프라이', category: 'egg', status: 'selected', recipeId: 'recipe_0171' },
  { name: '페퍼에그', category: 'egg', status: 'selected', recipeId: 'recipe_0172' },
  { name: '햄치즈토스트', category: 'sandwich_toast', status: 'selected', recipeId: 'recipe_0173' },
  { name: '참치샌드위치', category: 'sandwich_toast', status: 'selected', recipeId: 'recipe_0174' },
  { name: '사과치즈토스트', category: 'sandwich_toast', status: 'selected', recipeId: 'recipe_0175' },
  { name: '감자샐러드샌드', category: 'sandwich_toast', status: 'selected', recipeId: 'recipe_0176' },
  { name: '바질토마토샌드', category: 'sandwich_toast', status: 'selected', recipeId: 'recipe_0177' },
  { name: '요거트과일볼', category: 'yogurt_fruit', status: 'selected', recipeId: 'recipe_0178' },
  { name: '바나나오트요거트', category: 'yogurt_fruit', status: 'selected', recipeId: 'recipe_0179' },
  { name: '사과요거트', category: 'yogurt_fruit', status: 'selected', recipeId: 'recipe_0180' },
  { name: '베리요거트파르페', category: 'yogurt_fruit', status: 'selected', recipeId: 'recipe_0181' },
  { name: '과일그래놀라볼', category: 'yogurt_fruit', status: 'selected', recipeId: 'recipe_0182' },
  { name: '계란아보카도샐러드', category: 'salad_light', status: 'selected', recipeId: 'recipe_0183' },
  { name: '두부콩나물샐러드', category: 'salad_light', status: 'selected', recipeId: 'recipe_0184' },
  { name: '닭가슴살아침샐러드', category: 'salad_light', status: 'selected', recipeId: 'recipe_0185' },
  { name: '감자오이샐러드', category: 'salad_light', status: 'selected', recipeId: 'recipe_0186' },
  { name: '파계란국', category: 'light_soup', status: 'selected', recipeId: 'recipe_0187' },
  { name: '두부맑은국', category: 'light_soup', status: 'selected', recipeId: 'recipe_0188' },
  { name: '감자맑은국', category: 'light_soup', status: 'selected', recipeId: 'recipe_0189' },
  { name: '양파계란국', category: 'light_soup', status: 'selected', recipeId: 'recipe_0190' },
  // — Excluded (duplicate / near-duplicate vs existing 160)
  { name: '계란국', category: 'light_soup', status: 'excluded', reason: 'exact title exists (recipe catalog)' },
  { name: '계란국밥', category: 'egg', status: 'excluded', reason: 'exact title exists' },
  { name: '계란말이', category: 'egg', status: 'excluded', reason: 'exact title exists' },
  { name: '오믈렛', category: 'egg', status: 'excluded', reason: 'exact title exists; replaced by 채소오믈렛' },
  { name: '프렌치토스트', category: 'toast', status: 'excluded', reason: 'exact title exists' },
  { name: '아보카도토스트', category: 'toast', status: 'excluded', reason: 'exact title exists' },
  { name: '그릭요거트볼', category: 'yogurt_fruit', status: 'excluded', reason: 'exact title exists; replaced by 요거트과일볼' },
  { name: '시저샐러드', category: 'salad_light', status: 'excluded', reason: 'exact title exists' },
  { name: '닭가슴살샐러드', category: 'salad_light', status: 'excluded', reason: 'exact title exists; replaced by 닭가슴살아침샐러드' },
  { name: '클럽샌드위치', category: 'sandwich', status: 'excluded', reason: 'exact title exists' },
  { name: '계란토스트', category: 'toast', status: 'excluded', reason: 'normalized duplicate of egg toast variants' },
  { name: '달걀토스트', category: 'toast', status: 'excluded', reason: 'normalized duplicate of egg toast' },
  { name: '닭죽', category: 'porridge', status: 'excluded', reason: 'near-duplicate; selected 닭가슴살죽 instead' },
  { name: '에그샌드위치', category: 'sandwich', status: 'excluded', reason: 'near-duplicate; selected 햄에그샌드위치' },
  { name: '치즈계란밥', category: 'egg', status: 'excluded', reason: 'exact title exists' },
];

export const BATCH_1_SELECTED_COUNT = BATCH_1_CANDIDATE_AUDIT.filter((c) => c.status === 'selected').length;
export const BATCH_1_EXCLUDED_COUNT = BATCH_1_CANDIDATE_AUDIT.filter((c) => c.status === 'excluded').length;
