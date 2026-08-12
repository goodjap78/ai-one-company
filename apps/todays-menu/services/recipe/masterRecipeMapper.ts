import type { MasterRecipe } from '../../recipes/types';
import type { MealMode } from '../../types/home';
import type { Recipe, RecipeIngredient, RecipeStep } from '../../types/recipe';
import { resolveIngredient } from '../ingredient';

function pickKo(text: { ko: string; en?: string }): string {
  return text.ko;
}

function mapIngredients(recipe: MasterRecipe): RecipeIngredient[] {
  return recipe.ingredients.map((item) => {
    const name = pickKo(item.name);
    const resolved = resolveIngredient(name);
    return {
      name,
      amount: item.amount,
      optional: item.optional,
      canonicalName: resolved.canonicalName,
      ingredientId: resolved.ingredientId,
    };
  });
}

function mapSteps(recipe: MasterRecipe): RecipeStep[] {
  const fallbackEmoji = recipe.image.emoji ?? null;

  return recipe.steps.map((step) => ({
    order: step.order,
    guide: step.hankkiMessage.text,
    instruction: pickKo(step.instruction),
    imageEmoji: fallbackEmoji,
  }));
}

function mapDescription(recipe: MasterRecipe): string {
  if (recipe.description?.ko) return pickKo(recipe.description);
  return pickKo(recipe.subtitle);
}

function mapAiReason(recipe: MasterRecipe): string {
  if (recipe.aiReason?.ko) return pickKo(recipe.aiReason);
  return pickKo(recipe.subtitle);
}

export function mapMasterRecipeToRecipe(
  recipe: MasterRecipe,
  mode: MealMode = 'homemade',
): Recipe {
  return {
    id: recipe.id,
    slug: recipe.slug,
    title: pickKo(recipe.title),
    description: mapDescription(recipe),
    mode,
    type: recipe.type,
    mealTime: recipe.mealTime,
    cookTime: recipe.cookTime,
    difficulty: recipe.difficulty,
    servings: recipe.servings,
    tags: [...recipe.tags],
    aiReason: mapAiReason(recipe),
    image: {
      emoji: recipe.image.emoji ?? '🍽️',
      url: recipe.image.url ?? null,
    },
    ingredients: mapIngredients(recipe),
    steps: mapSteps(recipe),
    tip: recipe.hankkiTip.text,
    recommendedSides: recipe.recommendedSides,
  };
}

/** @deprecated Use `mapMasterRecipeToRecipe` */
export const mapMasterRecipeToDetail = mapMasterRecipeToRecipe;
