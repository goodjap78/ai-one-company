/**
 * Sprint 58.3 — Candidate pool audit for Batch 4 dinner expansion.
 */
export type Batch4CandidateRecord = {
  name: string;
  category: string;
  status: 'selected' | 'excluded';
  reason?: string;
  recipeId?: string;
};

export const BATCH_4_CANDIDATE_AUDIT: Batch4CandidateRecord[] = [
  // Selected 30 (recipe_0251–0280)
  { name: '버섯들깨탕', category: 'soup_stew', status: 'selected', recipeId: 'recipe_0251' },
  { name: '애호박된장찌개', category: 'soup_stew', status: 'selected', recipeId: 'recipe_0252' },
  { name: '두부버섯전골', category: 'soup_stew', status: 'selected', recipeId: 'recipe_0253' },
  { name: '닭곰탕', category: 'soup_stew', status: 'selected', recipeId: 'recipe_0254' },
  { name: '돼지고기김치찌개', category: 'soup_stew', status: 'selected', recipeId: 'recipe_0255' },
  { name: '팽이버섯맑은국', category: 'soup_stew', status: 'selected', recipeId: 'recipe_0256' },
  { name: '청양어묵탕', category: 'soup_stew', status: 'selected', recipeId: 'recipe_0257' },
  { name: '간장닭구이', category: 'meat', status: 'selected', recipeId: 'recipe_0258' },
  { name: '고추장돼지불고기', category: 'meat', status: 'selected', recipeId: 'recipe_0259' },
  { name: '소고기숙주볶음', category: 'meat', status: 'selected', recipeId: 'recipe_0260' },
  { name: '닭다리살채소볶음', category: 'meat', status: 'selected', recipeId: 'recipe_0261' },
  { name: '돼지고기두부조림', category: 'meat', status: 'selected', recipeId: 'recipe_0262' },
  { name: '소고기가지볶음', category: 'meat', status: 'selected', recipeId: 'recipe_0263' },
  { name: '닭고기버섯볶음', category: 'meat', status: 'selected', recipeId: 'recipe_0264' },
  { name: '고등어간장구이', category: 'grilled', status: 'selected', recipeId: 'recipe_0265' },
  { name: '두부양념구이', category: 'grilled', status: 'selected', recipeId: 'recipe_0266' },
  { name: '닭가슴살마늘구이', category: 'grilled', status: 'selected', recipeId: 'recipe_0267' },
  { name: '버섯치즈구이', category: 'grilled', status: 'selected', recipeId: 'recipe_0268' },
  { name: '가지된장구이', category: 'grilled', status: 'selected', recipeId: 'recipe_0269' },
  { name: '오징어간장볶음', category: 'fish_seafood', status: 'selected', recipeId: 'recipe_0270' },
  { name: '새우마늘볶음', category: 'fish_seafood', status: 'selected', recipeId: 'recipe_0271' },
  { name: '고등어무조림', category: 'fish_seafood', status: 'selected', recipeId: 'recipe_0272' },
  { name: '연어채소구이', category: 'fish_seafood', status: 'selected', recipeId: 'recipe_0273' },
  { name: '버섯크림파스타', category: 'pasta_western', status: 'selected', recipeId: 'recipe_0274' },
  { name: '토마토치킨파스타', category: 'pasta_western', status: 'selected', recipeId: 'recipe_0275' },
  { name: '새우오일파스타', category: 'pasta_western', status: 'selected', recipeId: 'recipe_0276' },
  { name: '가지토마토파스타', category: 'pasta_western', status: 'selected', recipeId: 'recipe_0277' },
  { name: '감자소고기조림', category: 'family_side_combo', status: 'selected', recipeId: 'recipe_0278' },
  { name: '두부버섯조림', category: 'family_side_combo', status: 'selected', recipeId: 'recipe_0279' },
  { name: '닭감자간장조림', category: 'family_side_combo', status: 'selected', recipeId: 'recipe_0280' },
  // Excluded 15
  { name: '소고기무국', category: 'soup_stew', status: 'excluded', reason: 'exact title exists' },
  { name: '얼큰콩나물국', category: 'soup_stew', status: 'excluded', reason: 'exact title exists' },
  { name: '김치찌개', category: 'soup_stew', status: 'excluded', reason: 'exact title exists' },
  { name: '된장찌개', category: 'soup_stew', status: 'excluded', reason: 'exact title exists' },
  { name: '고등어구이', category: 'grilled', status: 'excluded', reason: 'exact title exists; replaced by 고등어간장구이' },
  { name: '오징어볶음', category: 'fish_seafood', status: 'excluded', reason: 'exact title exists; replaced by 오징어간장볶음' },
  { name: '감자조림', category: 'family_side_combo', status: 'excluded', reason: 'exact title exists; replaced by 감자소고기조림' },
  { name: '두부조림', category: 'family_side_combo', status: 'excluded', reason: 'exact title exists; replaced by 두부버섯조림' },
  { name: '제육볶음', category: 'meat', status: 'excluded', reason: 'near-duplicate of 고추장돼지불고기' },
  { name: '불고기', category: 'meat', status: 'excluded', reason: 'exact title exists' },
  { name: '부대찌개', category: 'soup_stew', status: 'excluded', reason: 'exact title exists' },
  { name: '순두부찌개', category: 'soup_stew', status: 'excluded', reason: 'exact title exists' },
  { name: '갈비탕', category: 'soup_stew', status: 'excluded', reason: 'exact title exists' },
  { name: '새우볶음', category: 'fish_seafood', status: 'excluded', reason: 'exact title exists' },
  { name: '닭볶음탕', category: 'meat', status: 'excluded', reason: 'exact title exists' },
];

export const BATCH_4_SELECTED_COUNT = BATCH_4_CANDIDATE_AUDIT.filter((c) => c.status === 'selected').length;
export const BATCH_4_EXCLUDED_COUNT = BATCH_4_CANDIDATE_AUDIT.filter((c) => c.status === 'excluded').length;
