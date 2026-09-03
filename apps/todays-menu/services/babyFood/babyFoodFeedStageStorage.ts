/**
 * Last selected baby-food feed stage. No profile, age, or month storage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BABY_FOOD_FEED_DEFAULT_STAGE,
  isBabyFoodFeedStage,
  type BabyFoodFeedStage,
} from '../../data/recipes/babyFoodFeed';

export const BABY_FOOD_FEED_STAGE_STORAGE_KEY = '@hankki/baby_food_feed_stage';

export function parseBabyFoodFeedStage(raw: string | null): BabyFoodFeedStage | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed === 'string' && isBabyFoodFeedStage(parsed)) return parsed;
    if (
      parsed &&
      typeof parsed === 'object' &&
      'stage' in parsed &&
      typeof (parsed as { stage: unknown }).stage === 'string' &&
      isBabyFoodFeedStage((parsed as { stage: string }).stage)
    ) {
      return (parsed as { stage: BabyFoodFeedStage }).stage;
    }
  } catch {
    return null;
  }
  return null;
}

export function serializeBabyFoodFeedStage(stage: BabyFoodFeedStage): string {
  return JSON.stringify({ stage });
}

export async function loadBabyFoodFeedStage(): Promise<BabyFoodFeedStage> {
  try {
    const raw = await AsyncStorage.getItem(BABY_FOOD_FEED_STAGE_STORAGE_KEY);
    return parseBabyFoodFeedStage(raw) ?? BABY_FOOD_FEED_DEFAULT_STAGE;
  } catch {
    return BABY_FOOD_FEED_DEFAULT_STAGE;
  }
}

export async function saveBabyFoodFeedStage(stage: BabyFoodFeedStage): Promise<void> {
  if (!isBabyFoodFeedStage(stage)) return;
  try {
    await AsyncStorage.setItem(BABY_FOOD_FEED_STAGE_STORAGE_KEY, serializeBabyFoodFeedStage(stage));
  } catch {
    // ignore
  }
}
