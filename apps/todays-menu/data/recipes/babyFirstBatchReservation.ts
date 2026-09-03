/**
 * Reserved IDs / names for the first baby complementary-food batch.
 * Production recipes live in batches/batch27.ts.
 */
import type { BabyFoodStage } from './recipeFamilyAudienceTypes';

export const BABY_FIRST_BATCH_ID_START = 'recipe_0336';
export const BABY_FIRST_BATCH_ID_END = 'recipe_0353';

export const BABY_FIRST_BATCH_RESERVATIONS = [
  { id: 'recipe_0336', name: '쌀미음', stage: 'early' },
  { id: 'recipe_0337', name: '단호박미음', stage: 'early' },
  { id: 'recipe_0338', name: '고구마미음', stage: 'early' },
  { id: 'recipe_0339', name: '감자미음', stage: 'early' },
  { id: 'recipe_0340', name: '애호박미음', stage: 'early' },
  { id: 'recipe_0341', name: '소고기미음', stage: 'early' },
  { id: 'recipe_0342', name: '소고기애호박죽', stage: 'middle' },
  { id: 'recipe_0343', name: '소고기당근죽', stage: 'middle' },
  { id: 'recipe_0344', name: '닭고기단호박죽', stage: 'middle' },
  { id: 'recipe_0345', name: '두부채소죽', stage: 'middle' },
  { id: 'recipe_0346', name: '단호박쌀죽', stage: 'middle' },
  { id: 'recipe_0347', name: '감자당근죽', stage: 'middle' },
  { id: 'recipe_0348', name: '시금치쌀죽', stage: 'middle' },
  { id: 'recipe_0349', name: '계란죽', stage: 'middle' },
  { id: 'recipe_0350', name: '소고기무른밥', stage: 'late' },
  { id: 'recipe_0351', name: '이유식계란찜', stage: 'late' },
  { id: 'recipe_0352', name: '고구마막대', stage: 'late' },
  { id: 'recipe_0353', name: '두부무른밥', stage: 'late' },
] as const satisfies ReadonlyArray<{ id: string; name: string; stage: BabyFoodStage }>;

export function listBabyFirstBatchIds(): string[] {
  return BABY_FIRST_BATCH_RESERVATIONS.map((row) => row.id);
}
