import type { GoldMealRecord } from '../../types/goldMeal';
import type { Recipe, RecipeStep } from '../../types/recipe';
import { resolveRecipeIngredients } from '../ingredient';
import { resolveMealImageAsRecipe } from '../images';
import {
  getGoldMealById,
  getFlagshipGoldMealById,
  listGoldMeals,
  listGoldMealsByCuisine,
  listGoldMealsByStyle,
  GOLD_MEAL_LIBRARY,
  GOLD_MEALS_FLAGSHIP,
  isFlagshipGoldMeal,
} from '../../library/gold-meals';

function enjoyGuideToSteps(meal: GoldMealRecord): RecipeStep[] {
  if (!meal.enjoyGuide) return [];

  return meal.enjoyGuide.lines.map((line, index) => ({
    order: index + 1,
    guide: index === 0 ? meal.enjoyGuide!.title : '이렇게 즐겨보세요.',
    instruction: line,
    imageEmoji: meal.heroImage.emoji,
  }));
}

/** Map a Gold Meal to the UI-facing Recipe model when cooking support exists. */
export function goldMealToRecipe(meal: GoldMealRecord): Recipe {
  return {
    id: meal.id,
    title: meal.title,
    type: meal.type,
    mealTime: meal.mealTime,
    cookTime: meal.cookTime,
    difficulty: meal.difficulty,
    ingredients: resolveRecipeIngredients(meal.ingredients),
    steps: meal.cookingSupport?.steps ?? enjoyGuideToSteps(meal),
    tags: meal.tags,
    recommendedSides: meal.suggestedPairings
      .map((p: { menuId?: string }) => p.menuId)
      .filter((id): id is string => Boolean(id)),
    image: resolveMealImageAsRecipe(meal.id, {
      emoji: meal.heroImage.emoji,
      remoteUrl: meal.heroImage.url,
      mealMode: meal.mode,
    }),
    heroImageKey: undefined,
    aiReason: meal.aiReason,
    mode: meal.mode,
    servings: meal.servings,
    description: meal.description,
    tip: meal.cookingSupport?.tip ?? meal.enjoyGuide?.lines[0] ?? '',
    heroMascotMessage: meal.heroMascotMessage ?? null,
    recommendationMessages: meal.recommendationMessages,
  };
}

export {
  getGoldMealById,
  getFlagshipGoldMealById,
  listGoldMeals,
  listGoldMealsByCuisine,
  listGoldMealsByStyle,
  GOLD_MEAL_LIBRARY,
  GOLD_MEALS_FLAGSHIP,
  isFlagshipGoldMeal,
};
