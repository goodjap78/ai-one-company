/**
 * Sprint 58.2 — Candidate pool audit for Batch 3 lunch expansion.
 */
export type Batch3CandidateRecord = {
  name: string;
  category: string;
  status: 'selected' | 'excluded';
  reason?: string;
  recipeId?: string;
};

export const BATCH_3_CANDIDATE_AUDIT: Batch3CandidateRecord[] = [
  // Selected 30 (recipe_0221–0250)
  { name: '닭가슴살간장덮밥', category: 'rice_bowl', status: 'selected', recipeId: 'recipe_0221' },
  { name: '버섯불고기덮밥', category: 'rice_bowl', status: 'selected', recipeId: 'recipe_0222' },
  { name: '두부마파덮밥', category: 'rice_bowl', status: 'selected', recipeId: 'recipe_0223' },
  { name: '참치김치덮밥', category: 'rice_bowl', status: 'selected', recipeId: 'recipe_0224' },
  { name: '계란카레덮밥', category: 'rice_bowl', status: 'selected', recipeId: 'recipe_0225' },
  { name: '가지소보로덮밥', category: 'rice_bowl', status: 'selected', recipeId: 'recipe_0226' },
  { name: '소고기양파덮밥', category: 'rice_bowl', status: 'selected', recipeId: 'recipe_0227' },
  { name: '닭고기데리야키덮밥', category: 'rice_bowl', status: 'selected', recipeId: 'recipe_0228' },
  { name: '새우계란볶음밥', category: 'fried_rice', status: 'selected', recipeId: 'recipe_0229' },
  { name: '버섯간장볶음밥', category: 'fried_rice', status: 'selected', recipeId: 'recipe_0230' },
  { name: '닭가슴살채소볶음밥', category: 'fried_rice', status: 'selected', recipeId: 'recipe_0231' },
  { name: '두부김치볶음밥', category: 'fried_rice', status: 'selected', recipeId: 'recipe_0232' },
  { name: '참치마늘볶음밥', category: 'fried_rice', status: 'selected', recipeId: 'recipe_0233' },
  { name: '카레볶음밥', category: 'fried_rice', status: 'selected', recipeId: 'recipe_0234' },
  { name: '닭칼국수', category: 'noodle', status: 'selected', recipeId: 'recipe_0235' },
  { name: '비빔쫄면', category: 'noodle', status: 'selected', recipeId: 'recipe_0236' },
  { name: '들깨국수', category: 'noodle', status: 'selected', recipeId: 'recipe_0237' },
  { name: '참치냉우동', category: 'noodle', status: 'selected', recipeId: 'recipe_0238' },
  { name: '간장비빔면', category: 'noodle', status: 'selected', recipeId: 'recipe_0239' },
  { name: '버섯크림우동', category: 'noodle', status: 'selected', recipeId: 'recipe_0240' },
  { name: '참치야채김밥', category: 'gimbap', status: 'selected', recipeId: 'recipe_0241' },
  { name: '계란김밥', category: 'gimbap', status: 'selected', recipeId: 'recipe_0242' },
  { name: '불고기주먹밥', category: 'gimbap', status: 'selected', recipeId: 'recipe_0243' },
  { name: '김치치즈주먹밥', category: 'gimbap', status: 'selected', recipeId: 'recipe_0244' },
  { name: '닭가슴살샌드위치', category: 'sandwich_lunch', status: 'selected', recipeId: 'recipe_0245' },
  { name: '불고기샌드', category: 'sandwich_lunch', status: 'selected', recipeId: 'recipe_0246' },
  { name: '에그아보카도샌드', category: 'sandwich_lunch', status: 'selected', recipeId: 'recipe_0247' },
  { name: '두부김치밥', category: 'quick_korean', status: 'selected', recipeId: 'recipe_0248' },
  { name: '콩나물비빔밥', category: 'quick_korean', status: 'selected', recipeId: 'recipe_0249' },
  { name: '참치채소비빔밥', category: 'quick_korean', status: 'selected', recipeId: 'recipe_0250' },
  // Excluded 15
  { name: '칼국수', category: 'noodle', status: 'excluded', reason: 'exact title exists' },
  { name: '김밥', category: 'gimbap', status: 'excluded', reason: 'exact title exists' },
  { name: '비빔밥', category: 'quick_korean', status: 'excluded', reason: 'exact title exists' },
  { name: '소불고기덮밥', category: 'rice_bowl', status: 'excluded', reason: 'exact title exists' },
  { name: '닭가슴살덮밥', category: 'rice_bowl', status: 'excluded', reason: 'near-duplicate; replaced by 닭가슴살간장덮밥' },
  { name: '소고기버섯덮밥', category: 'rice_bowl', status: 'excluded', reason: 'near-duplicate; replaced by 버섯불고기덮밥' },
  { name: '새우볶음밥', category: 'fried_rice', status: 'excluded', reason: 'exact title exists' },
  { name: '가지덮밥', category: 'rice_bowl', status: 'excluded', reason: 'exact title exists; replaced by 가지소보로덮밥' },
  { name: '오징어덮밥', category: 'rice_bowl', status: 'excluded', reason: 'exact title exists' },
  { name: '날치알김치볶음밥', category: 'fried_rice', status: 'excluded', reason: 'exact title exists' },
  { name: '스팸김치볶음밥', category: 'fried_rice', status: 'excluded', reason: 'exact title exists' },
  { name: '참치샌드위치', category: 'sandwich_lunch', status: 'excluded', reason: 'exact title exists' },
  { name: '비빔국수', category: 'noodle', status: 'excluded', reason: 'exact title exists' },
  { name: '우삼겹간장비빔면', category: 'noodle', status: 'excluded', reason: 'exact title exists' },
  { name: '햄에그샌드위치', category: 'sandwich_lunch', status: 'excluded', reason: 'exact title exists' },
];

export const BATCH_3_SELECTED_COUNT = BATCH_3_CANDIDATE_AUDIT.filter((c) => c.status === 'selected').length;
export const BATCH_3_EXCLUDED_COUNT = BATCH_3_CANDIDATE_AUDIT.filter((c) => c.status === 'excluded').length;
