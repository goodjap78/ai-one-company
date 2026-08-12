/**
 * Sprint 58.4 — Candidate pool audit for Final Batch (+20).
 */
export type Batch5CandidateRecord = {
  name: string;
  category: string;
  status: 'selected' | 'excluded';
  reason?: string;
  recipeId?: string;
};

export const BATCH_5_CANDIDATE_AUDIT: Batch5CandidateRecord[] = [
  // Selected 20 (recipe_0281–0300)
  { name: '시금치크림파스타', category: 'pasta_western', status: 'selected', recipeId: 'recipe_0281' },
  { name: '닭고기오일파스타', category: 'pasta_western', status: 'selected', recipeId: 'recipe_0282' },
  { name: '두부에그샌드', category: 'sandwich_lunch', status: 'selected', recipeId: 'recipe_0283' },
  { name: '불고기치즈샌드', category: 'sandwich_lunch', status: 'selected', recipeId: 'recipe_0284' },
  { name: '참치사과샌드', category: 'sandwich_lunch', status: 'selected', recipeId: 'recipe_0285' },
  { name: '닭가슴살주먹밥', category: 'gimbap', status: 'selected', recipeId: 'recipe_0286' },
  { name: '소고기김주먹밥', category: 'gimbap', status: 'selected', recipeId: 'recipe_0287' },
  { name: '채소치즈김밥', category: 'gimbap', status: 'selected', recipeId: 'recipe_0288' },
  { name: '새우간장덮밥', category: 'rice_bowl', status: 'selected', recipeId: 'recipe_0289' },
  { name: '버섯계란덮밥', category: 'rice_bowl', status: 'selected', recipeId: 'recipe_0290' },
  { name: '소고기숙주덮밥', category: 'rice_bowl', status: 'selected', recipeId: 'recipe_0291' },
  { name: '시금치계란스프', category: 'breakfast_light_soup', status: 'selected', recipeId: 'recipe_0292' },
  { name: '토마토에그토스트', category: 'breakfast_toast', status: 'selected', recipeId: 'recipe_0293' },
  { name: '오트밀호두볼', category: 'breakfast_porridge', status: 'selected', recipeId: 'recipe_0294' },
  { name: '버터계란토스트', category: 'breakfast_toast', status: 'selected', recipeId: 'recipe_0295' },
  { name: '양파계란부침', category: 'lateNight_light', status: 'selected', recipeId: 'recipe_0296' },
  { name: '버섯계란라이트', category: 'lateNight_light_late', status: 'selected', recipeId: 'recipe_0297' },
  { name: '참치야채라이트', category: 'lateNight_light_late', status: 'selected', recipeId: 'recipe_0298' },
  { name: '야채김치볶음', category: 'wildcard_quick_korean', status: 'selected', recipeId: 'recipe_0299' },
  { name: '연어간장덮밥', category: 'wildcard_fish_bowl', status: 'selected', recipeId: 'recipe_0300' },
  // Excluded 20
  { name: '토마토미트파스타', category: 'pasta_western', status: 'excluded', reason: 'not selected; pasta gap filled by 시금치·닭오일' },
  { name: '두부로제파스타', category: 'pasta_western', status: 'excluded', reason: 'near-duplicate cream pasta family' },
  { name: '치킨아보카도샌드', category: 'sandwich_lunch', status: 'excluded', reason: 'near-duplicate of 에그아보카도샌드 (recipe_0247)' },
  { name: '참치계란김밥', category: 'gimbap', status: 'excluded', reason: 'near-duplicate of 계란김밥·참치야채김밥' },
  { name: '채소치즈주먹밥', category: 'gimbap', status: 'excluded', reason: 'replaced by 채소치즈김밥 for gimbap depth' },
  { name: '닭고기김치덮밥', category: 'rice_bowl', status: 'excluded', reason: 'near-duplicate of 참치김치덮밥' },
  { name: '두부버섯덮밥', category: 'rice_bowl', status: 'excluded', reason: 'near-duplicate of 두부마파덮밥' },
  { name: '오트밀요거트', category: 'breakfast', status: 'excluded', reason: 'near-duplicate of 바나나오트요거트' },
  { name: '바나나오트볼', category: 'breakfast', status: 'excluded', reason: 'near-duplicate of 바나나오트요거트' },
  { name: '콩나물라면', category: 'lateNight', status: 'excluded', reason: 'exact title exists (recipe_0208)' },
  { name: '부추전', category: 'lateNight', status: 'excluded', reason: 'exact title exists (recipe_0220)' },
  { name: '김치전', category: 'lateNight', status: 'excluded', reason: 'exact title exists (recipe_0209)' },
  { name: '두부김치볶음', category: 'lateNight', status: 'excluded', reason: 'exact title exists (recipe_0216)' },
  { name: '불고기샌드', category: 'sandwich_lunch', status: 'excluded', reason: 'exact title exists; replaced by 불고기치즈샌드' },
  { name: '에그아보카도샌드', category: 'sandwich_lunch', status: 'excluded', reason: 'exact title exists (recipe_0247)' },
  { name: '불고기주먹밥', category: 'gimbap', status: 'excluded', reason: 'exact title exists (recipe_0243)' },
  { name: '김치치즈주먹밥', category: 'gimbap', status: 'excluded', reason: 'exact title exists (recipe_0244)' },
  { name: '참치야채김밥', category: 'gimbap', status: 'excluded', reason: 'exact title exists (recipe_0239)' },
  { name: '연어덮밥', category: 'wildcard', status: 'excluded', reason: 'core catalog name collision; used 연어간장덮밥' },
  { name: '제육볶음', category: 'wildcard', status: 'excluded', reason: 'exact title exists (recipe_001)' },
];

export const BATCH_5_SELECTED_COUNT = BATCH_5_CANDIDATE_AUDIT.filter((c) => c.status === 'selected').length;
export const BATCH_5_EXCLUDED_COUNT = BATCH_5_CANDIDATE_AUDIT.filter((c) => c.status === 'excluded').length;
