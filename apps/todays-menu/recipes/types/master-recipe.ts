import type { Difficulty } from '../../types/home';
import type { MealCourseType } from '../../types/mealCourse';
import type { MealTimeSlot } from '../../types/mealTime';
import type { HankkiMessage } from './hankki-message';

export type RecipeCategory =
  | 'korean'
  | 'japanese'
  | 'chinese'
  | 'western'
  | 'dessert'
  | 'healthy'
  | 'baby'
  | 'snacks'
  | 'drinks';

export type RecipeTagId =
  | 'quick'
  | 'comfort'
  | 'spicy'
  | 'mild'
  | 'healthy'
  | 'budget'
  | 'family'
  | 'solo'
  | 'late_night'
  | 'meal_prep'
  | 'one_pot'
  | 'rice_based'
  | 'high_protein'
  | 'vegetarian_option';

export type RecipeEmotionId =
  | 'warm'
  | 'cozy'
  | 'happy'
  | 'energetic'
  | 'relaxed'
  | 'nostalgic'
  | 'refreshing'
  | 'indulgent';

export type LocalizedText = {
  ko: string;
  en?: string;
};

export type MasterRecipeIngredient = {
  name: LocalizedText;
  amount: string;
  optional?: boolean;
};

export type MasterRecipeStep = {
  order: number;
  instruction: LocalizedText;
  hankkiMessage: HankkiMessage;
};

export type MasterRecipeMeta = {
  version: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
};

export type MasterRecipeImage = {
  emoji?: string;
  url?: string | null;
};

/**
 * Official HANKKI master recipe record (Product Decision #002).
 * All recipe JSON files must conform to this interface.
 */
export type MasterRecipe = {
  id: string;
  slug: string;
  category: RecipeCategory;
  type: MealCourseType;
  mealTime: MealTimeSlot[];
  title: LocalizedText;
  subtitle: LocalizedText;
  description?: LocalizedText;
  difficulty: Difficulty;
  cookTime: number;
  servings: number;
  tags: RecipeTagId[];
  emotions: RecipeEmotionId[];
  ingredients: MasterRecipeIngredient[];
  steps: MasterRecipeStep[];
  hankkiTip: HankkiMessage;
  image: MasterRecipeImage;
  meta: MasterRecipeMeta;
  aiReason?: LocalizedText;
  /** Future: paired 반찬 recipe IDs. */
  recommendedSides?: string[];
};
