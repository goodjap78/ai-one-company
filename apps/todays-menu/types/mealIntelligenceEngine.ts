import type { MealMode, MealType } from './home';
import type { ConversationMood } from './conversation';
import type { PreferenceSeason } from './preference';
import type { MockWeather, Weekday } from './today';
import type { CookingSkill } from './userProfile';
import type { MealExperienceRecommendation } from './mealExperience';
import type { MealExplanation } from './mealExplanation';
import type { AiRecommendationSettings } from './aiRecommendationSettings';
import type { RecipeStandardMetadata } from '../data/recipes/recipeStandardMetadataTypes';

/** Live context snapshot used to score meals (0–100). */
export type MealSituationSnapshot = {
  mealType: MealType;
  mealMode: MealMode;
  weather: MockWeather;
  weekday: Weekday;
  isWeekend: boolean;
  hourOfDay: number;
  season: PreferenceSeason;
  mood: ConversationMood | null;
  cookingSkill: CookingSkill;
};

export type MealSituationBase = Omit<MealSituationSnapshot, 'mealType' | 'mealMode'>;

/** HMIE v1.0 — nine scoring dimensions. */
export const MEAL_SCORE_FACTORS = [
  'weather',
  'temperature',
  'season',
  'timeOfDay',
  'weekdayWeekend',
  'mealTime',
  'mealTimeMetadata',
  'preferenceDna',
  'recentMeals',
  'variety',
  'mealDna',
] as const;

export type MealScoreFactor = (typeof MEAL_SCORE_FACTORS)[number];

export type MetadataScoreHit = {
  key: string;
  points: number;
  dimension: string;
  label: string;
};

export type MealScoreBreakdown = {
  total: number;
  baseScore: number;
  factors: Partial<Record<MealScoreFactor, number>>;
  notes: string[];
  /** Sprint 21 — explainable hits from smart scoring. */
  smartReasons?: SmartScoreReasonHit[];
  /** Sprint 25 — metadata preference scoring hits. */
  metadataHits?: MetadataScoreHit[];
  /** Sprint 25 — hard exclusion (candidate pool should filter these out). */
  excluded?: boolean;
  exclusionReasons?: string[];
  /** Sprint 25 — dev-only trace of settings/metadata used for scoring. */
  metadataDebug?: {
    usedSettings?: Partial<AiRecommendationSettings>;
    usedMetadata?: Partial<RecipeStandardMetadata> | null;
  };
};

export type SmartScoreReasonCategory = 'weather' | 'recentMeals' | 'time' | 'personalization';

export type SmartScoreReasonHit = {
  key: string;
  points: number;
  category: SmartScoreReasonCategory;
  label: string;
};

export type ScoredMenuItem = {
  menuId: string;
  score: number;
  breakdown: MealScoreBreakdown;
};

/** Rank 2–3 option shown below the primary Home recommendation. */
export type RecommendationAlternative = {
  rank: 2 | 3;
  recipe: {
    id: string;
    title: string;
    subtitle: string;
    cookingTimeMinutes: number;
    difficulty: 'easy' | 'normal' | 'hard';
  };
  confidence: number;
  reason: string;
  mealExperience?: MealExperienceRecommendation;
  explanation?: MealExplanation;
};

export type HMIERankingResult = {
  primary: ScoredMenuItem | null;
  alternatives: ScoredMenuItem[];
  all: ScoredMenuItem[];
  totalCandidates: number;
  noCandidates?: boolean;
};
