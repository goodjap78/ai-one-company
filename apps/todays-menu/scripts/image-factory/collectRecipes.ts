/**
 * Sprint IMG-1 STEP 1 — collect every HANKKI production recipe.
 */
import { HANKKI_RECIPES } from '../../data/recipes/hankkiRecipes';
import type { Recipe } from '../../data/recipes/types';
import type { CollectedRecipe } from './types';

/**
 * Derive a cooking-style label from existing recipe fields.
 * There is no `cookingStyle` field on Recipe — infer from category / time / difficulty.
 */
export function deriveCookingStyle(recipe: Recipe): string {
  const cats = recipe.category.map((c) => c.toLowerCase());
  const name = recipe.name;
  if (cats.some((c) => c.includes('구이')) || name.includes('구이')) return 'grill';
  if (
    cats.some((c) => c.includes('국물') || c.includes('찌개') || c.includes('국')) ||
    /찌개|탕|국$/.test(name)
  ) {
    return 'stew';
  }
  if (cats.some((c) => c.includes('나물'))) return 'side_namul';
  if (cats.some((c) => c.includes('부침'))) return 'side_pan_fry';
  if (cats.some((c) => c.includes('전'))) return 'side_jeon';
  if (cats.some((c) => c.includes('조림')) || name.includes('조림')) return 'braise';
  if (cats.some((c) => c.includes('볶음')) || name.includes('볶음')) return 'stir_fry';
  if (
    cats.some((c) => c.includes('면')) ||
    name.includes('면') ||
    name.includes('국수') ||
    name.includes('파스타')
  ) {
    return 'noodles';
  }
  if (name.includes('밥') || name.includes('덮밥') || name.includes('비빔')) {
    return 'rice_bowl';
  }
  if (recipe.time <= 15) return 'quick';
  if (recipe.difficulty === '쉬움' && recipe.time <= 20) return 'easy_home';
  if (cats.some((c) => c.includes('분식')) || name.includes('라면') || name.includes('떡볶이')) {
    return 'snack';
  }
  if (cats.some((c) => c.includes('일식') || c.includes('중식') || c.includes('양식'))) {
    return 'fusion_home';
  }
  return 'home_cooked';
}

function mainIngredientNames(recipe: Recipe): string[] {
  return recipe.ingredients
    .filter((ing) => ing.group === 'main')
    .map((ing) => ing.name);
}

export function collectHankkiRecipes(
  recipes: Recipe[] = HANKKI_RECIPES,
): CollectedRecipe[] {
  return recipes.map((recipe) => ({
    id: recipe.id,
    recipeTitle: recipe.name,
    category: [...recipe.category],
    heroImageKey: recipe.heroImageKey,
    cookingStyle: deriveCookingStyle(recipe),
    mainIngredients: mainIngredientNames(recipe),
    recommendationTags: [...recipe.tags],
  }));
}
