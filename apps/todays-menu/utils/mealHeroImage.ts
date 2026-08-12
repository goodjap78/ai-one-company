import { getMasterRecipeById } from '../recipes';
import { getDeliveryMealById } from '../library/delivery-meals';
import { getFlagshipGoldMealById as getLibraryFlagshipGoldMealById } from '../library/gold-meals/flagship';
import {
  getCoreRecipeById,
  getHankkiRecipeById,
  getRecipeImageSourceByPath,
} from '../data/recipes';
import { getFlagshipGoldMealById } from '../services/recommendation/goldMealCatalog';
import { resolveMealImageAsRecipe } from '../services/images';
import type { MealMode } from '../types/home';
import type { Recipe, RecipeImage } from '../types/recipe';

/** Canonical hero image for a meal — used across Home → Ingredients → Detail → Cooking. */
export function resolveMealHeroImage(
  recipeId: string,
  mealMode: MealMode,
  imageUrl?: string | null,
  localSource?: RecipeImage['source'],
): RecipeImage {
  let emoji: string | undefined;
  let recipeName: string | undefined;
  let resolvedLocal = localSource;

  // Sprint H3-5.1 — HANKKI: name from recipe.name, image from recipe.image.
  const hankki = getHankkiRecipeById(recipeId);
  if (hankki) {
    recipeName = hankki.name;
    emoji = getFlagshipGoldMealById(recipeId)?.heroImage.emoji;
    if (!resolvedLocal) {
      resolvedLocal = getRecipeImageSourceByPath(hankki.image) ?? undefined;
    }
  }

  const catalogMeal = getFlagshipGoldMealById(recipeId);
  if (catalogMeal) {
    emoji = emoji ?? catalogMeal.heroImage.emoji;
    recipeName = recipeName ?? catalogMeal.title;
    if (!resolvedLocal) {
      resolvedLocal = catalogMeal.heroImage.source;
    }
  }

  if (!emoji || !recipeName) {
    const flagship = getLibraryFlagshipGoldMealById(recipeId);
    if (flagship) {
      emoji = emoji ?? flagship.heroImage.emoji;
      recipeName = recipeName ?? flagship.title;
    }
  }

  if (!emoji) {
    const deliveryMeal = getDeliveryMealById(recipeId);
    if (deliveryMeal) {
      emoji = deliveryMeal.heroImage.emoji;
      recipeName = recipeName ?? deliveryMeal.title;
    }
  }

  if (!emoji) {
    const master = getMasterRecipeById(recipeId);
    if (master?.image?.emoji) emoji = master.image.emoji;
    if (master?.title?.ko) recipeName = recipeName ?? master.title.ko;
  }

  if (!recipeName) {
    recipeName = getCoreRecipeById(recipeId)?.name;
  }

  return resolveMealImageAsRecipe(recipeId, {
    mealMode,
    remoteUrl: imageUrl,
    localSource: resolvedLocal,
    emoji,
    recipeName,
  });
}

/** Ensures every recipe carries the same resolved hero image as Home. */
export function withResolvedHeroImage(recipe: Recipe): Recipe {
  return {
    ...recipe,
    image: resolveMealHeroImage(
      recipe.id,
      recipe.mode,
      recipe.image.url,
      recipe.image.source,
    ),
  };
}
