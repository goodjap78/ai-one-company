export {
  buildMealSituationBase,
  buildMealSituationBaseSync,
  mergeMealSituation,
  resolveMealSituation,
} from './buildSituationSnapshot';
export type { MealSituationBase } from './buildSituationSnapshot';
export { buildIntelligenceReasons, scoreToConfidence } from './buildIntelligenceReasons';
export { buildMealExplanation } from './buildMealExplanation';
export {
  resolvePersonality,
  scorePersonalityFit,
  buildPersonalityVoice,
} from './personality';
export {
  buildSituationDna,
  deriveMealDna,
  resolveMealDna,
  scoreMealDna,
} from './mealDna';
export { classifyMealArchetypes, getPrimaryArchetype, VARIETY_CYCLE } from './mealProfile';
export { isVeryHot, isCold, isRainy, isTemperatureFatigue } from './mealKnowledge';
export { scoreMeal } from './scoreMeal';
export { scoreSmartRecommendation, pickTopSmartReasons, SMART_SCORE_POINTS, METADATA_SCORE_POINTS } from './smartRecommendationScore';
export {
  evaluateAiRecommendationExclusions,
  menuPassesAiRecommendationExclusions,
} from './aiRecommendationExclusions';
export { scoreMetadataPreferences, METADATA_SCORE_POINTS as METADATA_PREFERENCE_POINTS } from './aiRecommendationMetadataScoring';
export { resolveMenuAiRecipeContext } from './resolveMenuStandardMetadata';
export { buildMetadataPersonalizationReason } from './aiRecommendationReasonCopy';
export {
  getLastRecommendationScoreDebug,
  getRecommendationScoreDebugForMenu,
  storeRecommendationScoreDebug,
} from './recommendationScoreDebug';
export { scoreMenuCandidates, selectBestMeal, rankTopMeals } from './selectMeal';
export { HMIE_BASE_SCORE, HMIE_FACTOR_WEIGHTS, HMIE_TOP_N } from './hmieWeights';
