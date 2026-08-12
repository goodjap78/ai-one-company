import type { Difficulty, MealMode } from './home';
import type { MealPurpose, SituationTag, WeatherTag } from './mealIntelligence';
import type { MealTimeSlot } from './mealTime';
import type { MealStyle } from './mealStyle';
import type { RecipeImage, RecipeIngredient, RecipeStep } from './recipe';
import type { RecipeTagId } from '../recipes/types';
import type { MealDNA } from './mealDna';

/** Guided step-by-step cooking — `mealStyle = recipe` (and some grill/assembly). */
export type GoldMealCookingSupport = {
  kind: 'steps';
  steps: RecipeStep[];
  tip?: string;
};

/** Non-recipe path — grill, delivery, instant, simple assembly. */
export type GoldMealEnjoyGuide = {
  kind: 'enjoy';
  title: string;
  lines: string[];
};

/**
 * Gold Meal Library v1.0 — canonical meal record.
 * HANKKI solves meals; recipes only support meals when needed.
 */
export type GoldMealRecord = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  type: 'MAIN';
  mealStyle: MealStyle;
  mealPurpose: MealPurpose[];
  mealTime: MealTimeSlot[];
  weatherTags: WeatherTag[];
  situationTags: SituationTag[];
  cuisine: 'Korean' | 'Japanese' | 'Chinese' | 'Western';
  mode: MealMode;
  cookTime: number;
  difficulty: Difficulty;
  servings: number;
  aiReason: string;
  experienceLabel: string;
  suggestedPairings: { name: string; menuId?: string }[];
  ingredients: RecipeIngredient[];
  cookingSupport?: GoldMealCookingSupport;
  enjoyGuide?: GoldMealEnjoyGuide;
  tags: RecipeTagId[];
  heroImage: RecipeImage;
  /** Structured attributes for HMIE Meal DNA scoring. */
  mealDna?: MealDNA;
  /** Sprint R3 — Seed message pool for Home / Recipe Detail. */
  recommendationMessages?: string[];
  /** Sprint R3 — preferred Seed line inside Recipe Detail hero. */
  heroMascotMessage?: string;
};
