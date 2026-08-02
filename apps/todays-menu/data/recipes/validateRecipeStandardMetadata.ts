/**
 * Sprint 25 — Validate standardized metadata on all HANKKI production recipes.
 */
import {
  STANDARD_ALLERGY_TAGS,
  STANDARD_COOKING_METHODS,
  STANDARD_CUISINES,
  STANDARD_DIETARY_TAGS,
  STANDARD_DIFFICULTIES,
  STANDARD_DISH_TYPES,
  STANDARD_MEAL_TYPES,
  STANDARD_SITUATION_TAGS,
  STANDARD_SPICE_LEVELS,
  STANDARD_TASTE_PROFILES,
  type RecipeStandardMetadata,
  type StandardAllergyTag,
} from './recipeStandardMetadataTypes';
import { HANKKI_RECIPES } from './hankkiRecipes';
import type { Recipe } from './types';

const ICON_KEY_ALLERGY_HINTS: Record<string, StandardAllergyTag[]> = {
  egg: ['egg'],
  milk: ['milk'],
  cheese: ['milk'],
  butter: ['milk'],
  peanut: ['peanut'],
  flour: ['wheat'],
  bread_crumbs: ['wheat'],
  soy_sauce: ['soy'],
  doenjang: ['soy'],
  tofu: ['soy'],
  fried_tofu: ['soy'],
  gochujang: ['soy'],
  fish: ['fish'],
  fish_generic: ['fish'],
  tuna: ['fish'],
  salmon: ['fish'],
  mackerel: ['fish'],
  anchovy: ['fish'],
  fish_cake: ['fish'],
  squid: ['shellfish'],
  shrimp: ['shellfish'],
  octopus: ['shellfish'],
  pork: ['pork'],
  beef: ['beef'],
  chicken: ['chicken'],
  ham: ['pork'],
};

export type StandardMetadataIssue = {
  recipeId: string;
  recipeName: string;
  code: string;
  message: string;
};

export type StandardMetadataValidationResult = {
  ok: boolean;
  recipeCount: number;
  issues: StandardMetadataIssue[];
  reviewNeededCount: number;
  autoCompleteCount: number;
  reviewNeededIds: string[];
  conflicts: StandardMetadataIssue[];
};

function push(
  issues: StandardMetadataIssue[],
  recipe: Recipe,
  code: string,
  message: string,
) {
  issues.push({
    recipeId: recipe.id,
    recipeName: recipe.name,
    code,
    message,
  });
}

function hasDuplicateValues<T>(items: T[]): boolean {
  return new Set(items).size !== items.length;
}

function expectedAllergiesFromIngredients(recipe: Recipe): StandardAllergyTag[] {
  const out: StandardAllergyTag[] = [];
  for (const ing of recipe.ingredients) {
    const mapped = ICON_KEY_ALLERGY_HINTS[ing.iconKey];
    if (mapped) out.push(...mapped);
  }
  return [...new Set(out)];
}

function validateMetadataBlock(
  recipe: Recipe,
  meta: RecipeStandardMetadata,
  issues: StandardMetadataIssue[],
): void {
  if (!STANDARD_CUISINES.includes(meta.cuisine)) {
    push(issues, recipe, 'enum.cuisine', `Invalid cuisine: ${meta.cuisine}`);
  }
  if (!STANDARD_DISH_TYPES.includes(meta.dishType)) {
    push(issues, recipe, 'enum.dishType', `Invalid dishType: ${meta.dishType}`);
  }
  for (const taste of meta.tasteProfile) {
    if (!STANDARD_TASTE_PROFILES.includes(taste)) {
      push(issues, recipe, 'enum.tasteProfile', `Invalid tasteProfile: ${taste}`);
    }
  }
  for (const meal of meta.mealTypes) {
    if (!STANDARD_MEAL_TYPES.includes(meal)) {
      push(issues, recipe, 'enum.mealTypes', `Invalid mealType: ${meal}`);
    }
  }
  for (const tag of meta.situationTags) {
    if (!STANDARD_SITUATION_TAGS.includes(tag)) {
      push(issues, recipe, 'enum.situationTags', `Invalid situationTag: ${tag}`);
    }
  }
  for (const method of meta.cookingMethods) {
    if (!STANDARD_COOKING_METHODS.includes(method)) {
      push(issues, recipe, 'enum.cookingMethods', `Invalid cookingMethod: ${method}`);
    }
  }
  for (const tag of meta.dietaryTags) {
    if (!STANDARD_DIETARY_TAGS.includes(tag)) {
      push(issues, recipe, 'enum.dietaryTags', `Invalid dietaryTag: ${tag}`);
    }
  }
  for (const tag of meta.allergyTags) {
    if (!STANDARD_ALLERGY_TAGS.includes(tag)) {
      push(issues, recipe, 'enum.allergyTags', `Invalid allergyTag: ${tag}`);
    }
  }
  if (!STANDARD_SPICE_LEVELS.includes(meta.spiceLevel)) {
    push(issues, recipe, 'enum.spiceLevel', `Invalid spiceLevel: ${meta.spiceLevel}`);
  }
  if (!STANDARD_DIFFICULTIES.includes(meta.difficulty)) {
    push(issues, recipe, 'enum.difficulty', `Invalid difficulty: ${meta.difficulty}`);
  }

  if (typeof meta.cookingTime !== 'number' || Number.isNaN(meta.cookingTime)) {
    push(issues, recipe, 'cookingTime.type', 'cookingTime must be a number');
  } else if (meta.cookingTime !== recipe.time) {
    push(
      issues,
      recipe,
      'cookingTime.mismatch',
      `cookingTime ${meta.cookingTime} !== recipe.time ${recipe.time}`,
    );
  }

  if (typeof meta.servings !== 'number' || Number.isNaN(meta.servings)) {
    push(issues, recipe, 'servings.type', 'servings must be a number');
  } else if (meta.servings !== recipe.serving) {
    push(
      issues,
      recipe,
      'servings.mismatch',
      `servings ${meta.servings} !== recipe.serving ${recipe.serving}`,
    );
  }

  if (!meta.mainIngredients.length) {
    push(issues, recipe, 'mainIngredients.missing', 'mainIngredients is empty');
  }

  const mains = recipe.ingredients.filter((i) => i.group === 'main').map((i) => i.iconKey);
  for (const key of meta.mainIngredients) {
    if (!mains.includes(key)) {
      push(
        issues,
        recipe,
        'mainIngredients.unknown',
        `mainIngredients contains non-main iconKey: ${key}`,
      );
    }
  }

  const expectedAllergies = expectedAllergiesFromIngredients(recipe);
  for (const allergy of expectedAllergies) {
    if (!meta.allergyTags.includes(allergy)) {
      push(
        issues,
        recipe,
        'allergyTags.missing',
        `Expected allergyTag "${allergy}" from ingredients`,
      );
    }
  }

  if (hasDuplicateValues(meta.tasteProfile)) {
    push(issues, recipe, 'duplicate.tasteProfile', 'Duplicate tasteProfile values');
  }
  if (hasDuplicateValues(meta.mealTypes)) {
    push(issues, recipe, 'duplicate.mealTypes', 'Duplicate mealTypes values');
  }
  if (hasDuplicateValues(meta.situationTags)) {
    push(issues, recipe, 'duplicate.situationTags', 'Duplicate situationTags values');
  }
  if (hasDuplicateValues(meta.cookingMethods)) {
    push(issues, recipe, 'duplicate.cookingMethods', 'Duplicate cookingMethods values');
  }
  if (hasDuplicateValues(meta.dietaryTags)) {
    push(issues, recipe, 'duplicate.dietaryTags', 'Duplicate dietaryTags values');
  }
  if (hasDuplicateValues(meta.allergyTags)) {
    push(issues, recipe, 'duplicate.allergyTags', 'Duplicate allergyTags values');
  }
  if (hasDuplicateValues(meta.mainIngredients)) {
    push(issues, recipe, 'duplicate.mainIngredients', 'Duplicate mainIngredients values');
  }

  if (/파스타|라면|우동|면|국수/.test(recipe.name)) {
    if (!['noodle', 'soup', 'stew', 'snack'].includes(meta.dishType)) {
      push(
        issues,
        recipe,
        'conflict.nameDishType',
        `Noodle-like name "${recipe.name}" vs dishType ${meta.dishType}`,
      );
    }
  }
  if (/돈까스|우동|라멘|초밥|유부/.test(recipe.name) && meta.cuisine !== 'japanese') {
    push(
      issues,
      recipe,
      'conflict.nameCuisine',
      `Japanese name "${recipe.name}" vs cuisine ${meta.cuisine}`,
    );
  }
  if (/파스타|버거|스테이크|그라탕/.test(recipe.name) && meta.cuisine !== 'western') {
    push(
      issues,
      recipe,
      'conflict.nameCuisine',
      `Western name "${recipe.name}" vs cuisine ${meta.cuisine}`,
    );
  }
}

export function validateRecipeStandardMetadata(recipe: Recipe): StandardMetadataIssue[] {
  const issues: StandardMetadataIssue[] = [];

  if (!recipe.standardMetadata) {
    push(issues, recipe, 'missing.standardMetadata', 'Missing standardMetadata block');
    return issues;
  }

  validateMetadataBlock(recipe, recipe.standardMetadata, issues);
  return issues;
}

export function validateAllRecipeStandardMetadata(
  recipes: Recipe[] = HANKKI_RECIPES,
): StandardMetadataValidationResult {
  const issues = recipes.flatMap((recipe) => validateRecipeStandardMetadata(recipe));
  const conflicts = issues.filter((i) => i.code.startsWith('conflict.'));
  const reviewNeededIds = recipes
    .filter((r) => r.standardMetadata?.reviewNeeded)
    .map((r) => r.id);
  const autoCompleteCount = recipes.filter((r) => r.standardMetadata && !r.standardMetadata.reviewNeeded)
    .length;

  return {
    ok: issues.length === 0,
    recipeCount: recipes.length,
    issues,
    reviewNeededCount: reviewNeededIds.length,
    autoCompleteCount,
    reviewNeededIds,
    conflicts,
  };
}
