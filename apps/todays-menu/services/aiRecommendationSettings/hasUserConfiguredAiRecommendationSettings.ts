import {
  DEFAULT_AI_RECOMMENDATION_SETTINGS,
  type AiRecommendationSettings,
} from '../../types/aiRecommendationSettings';

/**
 * True when the user has saved at least one non-default AI recommendation preference.
 * Empty arrays and null fields from defaults do not count as configured.
 */
export function hasUserConfiguredAiRecommendationSettings(
  settings: AiRecommendationSettings,
): boolean {
  return (
    settings.spicyLevel !== DEFAULT_AI_RECOMMENDATION_SETTINGS.spicyLevel ||
    settings.preferredCuisines.length > 0 ||
    settings.preferredDishTypes.length > 0 ||
    settings.preferredSituations.length > 0 ||
    settings.avoidedFoods.length > 0 ||
    settings.customAvoidedFood.trim().length > 0 ||
    settings.customFavoriteFood.trim().length > 0 ||
    settings.householdSize !== DEFAULT_AI_RECOMMENDATION_SETTINGS.householdSize ||
    settings.maxCookTime !== DEFAULT_AI_RECOMMENDATION_SETTINGS.maxCookTime
  );
}
