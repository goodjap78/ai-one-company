import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_AI_RECOMMENDATION_SETTINGS,
  type AiRecommendationSettings,
  type AvoidedFoodPreset,
  type HouseholdSize,
  type MaxCookTimePreference,
  type PreferredCuisine,
  type PreferredDishType,
  type PreferredSituation,
  type SpicyTolerance,
} from '../../types/aiRecommendationSettings';

const STORAGE_KEY = '@hankki/ai_recommendation_settings';

const SPICY_LEVELS = new Set<SpicyTolerance>(['mild', 'like', 'normal', 'dislike']);
const CUISINES = new Set<PreferredCuisine>([
  'korean',
  'western',
  'chinese',
  'japanese',
  'snack',
  'asian',
  'fusion',
  'healthy',
]);
const DISH_TYPES = new Set<PreferredDishType>([
  'rice',
  'rice_bowl',
  'noodle',
  'soup',
  'stew',
  'stir_fry',
  'grilled',
  'fried',
  'salad',
  'sandwich',
]);
const SITUATIONS = new Set<PreferredSituation>([
  'solo_meal',
  'family_meal',
  'kids_meal',
  'quick_meal',
  'comfort_food',
  'light_meal',
]);
const AVOIDED = new Set<AvoidedFoodPreset>([
  'cucumber',
  'eggplant',
  'cilantro',
  'seafood',
  'mushroom',
]);
const HOUSEHOLDS = new Set<HouseholdSize>(['solo', 'two', 'three_four', 'family']);
const COOK_TIMES = new Set<MaxCookTimePreference>(['10', '20', '30', 'any']);

let aiSettingsRevision = 0;

export function getAiSettingsRevision(): number {
  return aiSettingsRevision;
}

function bumpAiSettingsRevision(): void {
  aiSettingsRevision += 1;
}

function parseSettings(raw: string | null): AiRecommendationSettings {
  if (!raw) return { ...DEFAULT_AI_RECOMMENDATION_SETTINGS };

  try {
    const parsed = JSON.parse(raw) as Partial<AiRecommendationSettings>;
    return {
      spicyLevel:
        parsed.spicyLevel && SPICY_LEVELS.has(parsed.spicyLevel) ? parsed.spicyLevel : null,
      preferredCuisines: Array.isArray(parsed.preferredCuisines)
        ? parsed.preferredCuisines.filter((value): value is PreferredCuisine =>
            CUISINES.has(value as PreferredCuisine),
          )
        : [],
      preferredDishTypes: Array.isArray(parsed.preferredDishTypes)
        ? parsed.preferredDishTypes.filter((value): value is PreferredDishType =>
            DISH_TYPES.has(value as PreferredDishType),
          )
        : [],
      preferredSituations: Array.isArray(parsed.preferredSituations)
        ? parsed.preferredSituations.filter((value): value is PreferredSituation =>
            SITUATIONS.has(value as PreferredSituation),
          )
        : [],
      avoidedFoods: Array.isArray(parsed.avoidedFoods)
        ? parsed.avoidedFoods.filter((value): value is AvoidedFoodPreset =>
            AVOIDED.has(value as AvoidedFoodPreset),
          )
        : [],
      customAvoidedFood:
        typeof parsed.customAvoidedFood === 'string' ? parsed.customAvoidedFood.trim() : '',
      customFavoriteFood:
        typeof parsed.customFavoriteFood === 'string' ? parsed.customFavoriteFood.trim() : '',
      householdSize:
        parsed.householdSize && HOUSEHOLDS.has(parsed.householdSize)
          ? parsed.householdSize
          : null,
      maxCookTime:
        parsed.maxCookTime && COOK_TIMES.has(parsed.maxCookTime) ? parsed.maxCookTime : null,
      updatedAt:
        typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return { ...DEFAULT_AI_RECOMMENDATION_SETTINGS };
  }
}

export async function getAiRecommendationSettings(): Promise<AiRecommendationSettings> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return parseSettings(raw);
}

export async function saveAiRecommendationSettings(
  settings: AiRecommendationSettings,
): Promise<AiRecommendationSettings> {
  const next = {
    ...settings,
    updatedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  bumpAiSettingsRevision();
  return next;
}

export async function updateAiRecommendationSettings(
  patch: Partial<AiRecommendationSettings>,
): Promise<AiRecommendationSettings> {
  const current = await getAiRecommendationSettings();
  return saveAiRecommendationSettings({ ...current, ...patch });
}
