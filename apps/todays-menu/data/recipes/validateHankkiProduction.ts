/**
 * Sprint R6-1 — production validation for HANKKI_RECIPES.
 * Developer-side only — does not affect runtime UI.
 */
import type { Recipe, RecipeStepContent } from './types';
import { HANKKI_RECIPES } from './hankkiRecipes';

export type ProductionValidationIssue = {
  recipeId: string;
  recipeName: string;
  code: string;
  message: string;
};

export type ProductionValidationResult = {
  ok: boolean;
  recipeCount: number;
  issues: ProductionValidationIssue[];
  missingIngredientAssets: string[];
  missingStepAssets: string[];
  heroImageKeys: string[];
};

const AI_TAG_HINT =
  /^(quick|comfort|spicy|mild|healthy|budget|family|solo|late_night|meal_prep|one_pot|rice_based|high_protein|vegetarian_option|kids|crispy|soup)$/;

function isRichStep(step: RecipeStepContent): boolean {
  return Boolean(step && typeof step === 'object' && 'instruction' in step);
}

export function validateHankkiRecipe(recipe: Recipe): ProductionValidationIssue[] {
  const issues: ProductionValidationIssue[] = [];
  const push = (code: string, message: string) => {
    issues.push({
      recipeId: recipe.id,
      recipeName: recipe.name,
      code,
      message,
    });
  };

  if (!recipe.id?.trim()) push('id', 'Missing id');
  if (!recipe.name?.trim()) push('name', 'Missing name');
  if (!recipe.heroImageKey?.trim()) push('heroImageKey', 'Missing heroImageKey');
  if (!recipe.image?.trim()) push('image', 'Missing image path');
  if (!recipe.time || recipe.time <= 0) push('time', 'Missing cooking time');
  if (!recipe.difficulty?.trim()) push('difficulty', 'Missing difficulty');
  if (!recipe.serving || recipe.serving <= 0) push('serving', 'Missing serving');
  if (!recipe.nutrition?.calorie || recipe.nutrition.calorie <= 0) {
    push('calories', 'Missing calories');
  }
  if (!recipe.recommendationMessages || recipe.recommendationMessages.length < 4) {
    push('recommendationMessages', 'Need at least 4 recommendation messages');
  }
  if (recipe.recommendationMessages && recipe.recommendationMessages.length > 6) {
    push('recommendationMessages', 'Too many recommendation messages (>6)');
  }
  if (!recipe.tags?.length) push('tags', 'Missing tags');
  if (!recipe.situation?.length) push('situation', 'Missing situation tags');
  if (!recipe.aiTags?.length) push('aiTags', 'Missing AI recommendation tags');

  // Sprint R8 — Decision Recipe Database
  const dt = recipe.decisionTags;
  if (!dt) {
    push('decisionTags', 'Missing decisionTags');
  } else {
    if (!dt.mealTime?.length) push('decisionTags.mealTime', 'Missing mealTime');
    if (!dt.mood?.length) push('decisionTags.mood', 'Missing mood');
    if (!dt.situation?.length) {
      push('decisionTags.situation', 'Missing decision situation');
    }
    if (![10, 20, 30, 40, 60].includes(dt.timeRequired)) {
      push('decisionTags.timeRequired', 'Invalid timeRequired');
    }
    if (!['low', 'medium', 'high'].includes(dt.budget)) {
      push('decisionTags.budget', 'Invalid budget');
    }
    if (!['easy', 'normal', 'hard'].includes(dt.difficultyLevel)) {
      push('decisionTags.difficultyLevel', 'Invalid difficultyLevel');
    }
    if (!dt.weather?.length) push('decisionTags.weather', 'Missing weather');
    if (!dt.season?.length) push('decisionTags.season', 'Missing season');
    if (typeof dt.kidFriendly !== 'boolean') {
      push('decisionTags.kidFriendly', 'Missing kidFriendly');
    }
    if (![0, 1, 2, 3].includes(dt.spicyLevel)) {
      push('decisionTags.spicyLevel', 'Invalid spicyLevel');
    }
  }

  if (!recipe.recommendationReasons || recipe.recommendationReasons.length !== 3) {
    push('recommendationReasons', 'Need exactly 3 recommendation reasons');
  } else {
    recipe.recommendationReasons.forEach((reason, index) => {
      if (!reason?.trim()) {
        push('recommendationReasons', `Reason ${index + 1} is empty`);
      }
    });
  }

  if (!recipe.searchTags?.length) push('searchTags', 'Missing searchTags');

  if (!recipe.standardMetadata) {
    push('standardMetadata', 'Missing standardMetadata');
  }

  if (
    typeof recipe.recommendationPriority !== 'number' ||
    recipe.recommendationPriority < 1 ||
    recipe.recommendationPriority > 100
  ) {
    push('recommendationPriority', 'Priority must be 1–100');
  }

  for (const tag of recipe.aiTags ?? []) {
    if (!AI_TAG_HINT.test(tag)) {
      push('aiTags', `Unexpected aiTag "${tag}"`);
    }
  }

  const mains = recipe.ingredients.filter((i) => i.group === 'main');
  const subs = recipe.ingredients.filter((i) => i.group === 'sub');
  const seasonings = recipe.ingredients.filter((i) => i.group === 'seasoning');
  if (mains.length === 0) push('ingredients.main', 'Need at least one main ingredient');
  if (subs.length === 0) push('ingredients.sub', 'Need at least one sub ingredient');
  if (seasonings.length === 0) {
    push('ingredients.seasoning', 'Need at least one seasoning');
  }

  const names = new Set<string>();
  for (const ing of recipe.ingredients) {
    if (!ing.name?.trim()) push('ingredient.name', 'Ingredient missing name');
    if (!ing.amount?.trim()) {
      push('ingredient.amount', `Missing amount for ${ing.name}`);
    }
    if (!ing.iconKey?.trim()) {
      push('ingredient.iconKey', `Missing iconKey for ${ing.name}`);
    }
    if (!ing.group) push('ingredient.group', `Missing group for ${ing.name}`);
    if (names.has(ing.name)) {
      push('ingredient.duplicate', `Duplicate ingredient name: ${ing.name}`);
    }
    names.add(ing.name);
  }

  const steps = recipe.recipe?.steps ?? [];
  if (steps.length < 4 || steps.length > 6) {
    push('steps.count', `Step count ${steps.length} must be 4–6`);
  }

  steps.forEach((step, index) => {
    const n = index + 1;
    if (!isRichStep(step)) {
      push('steps.shape', `Step ${n} must be a rich object`);
      return;
    }
    const title = step.title?.trim() || step.guide?.trim();
    if (!title) push('steps.title', `Step ${n} missing title`);
    if (!step.instruction?.trim()) {
      push('steps.instruction', `Step ${n} missing instruction`);
    }
    if (!step.imageKey?.trim()) push('steps.imageKey', `Step ${n} missing imageKey`);
    if (!step.tip?.trim()) push('steps.tip', `Step ${n} missing tip`);
  });

  return issues;
}

export function validateHankkiProductionDb(
  recipes: Recipe[] = HANKKI_RECIPES,
): ProductionValidationResult {
  const issues = recipes.flatMap((recipe) => validateHankkiRecipe(recipe));

  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  const seenHeroKeys = new Set<string>();

  for (const recipe of recipes) {
    if (seenIds.has(recipe.id)) {
      issues.push({
        recipeId: recipe.id,
        recipeName: recipe.name,
        code: 'duplicate.id',
        message: `Duplicate recipe id: ${recipe.id}`,
      });
    }
    seenIds.add(recipe.id);

    const nameKey = recipe.name.trim();
    if (nameKey && seenNames.has(nameKey)) {
      issues.push({
        recipeId: recipe.id,
        recipeName: recipe.name,
        code: 'duplicate.name',
        message: `Duplicate recipe name: ${recipe.name}`,
      });
    }
    if (nameKey) seenNames.add(nameKey);

    const heroKey = recipe.heroImageKey.trim();
    if (heroKey && seenHeroKeys.has(heroKey)) {
      issues.push({
        recipeId: recipe.id,
        recipeName: recipe.name,
        code: 'duplicate.heroImageKey',
        message: `Duplicate heroImageKey: ${heroKey}`,
      });
    }
    if (heroKey) seenHeroKeys.add(heroKey);
  }

  const ingredientKeys = new Set<string>();
  const stepKeys = new Set<string>();
  const heroImageKeys: string[] = [];

  for (const recipe of recipes) {
    heroImageKeys.push(recipe.heroImageKey);
    if (!recipe.heroImageKey?.trim()) {
      issues.push({
        recipeId: recipe.id,
        recipeName: recipe.name,
        code: 'missing.heroImageKey',
        message: 'Missing hero image key',
      });
    }
    for (const ing of recipe.ingredients) {
      if (ing.iconKey) ingredientKeys.add(ing.iconKey);
      else {
        issues.push({
          recipeId: recipe.id,
          recipeName: recipe.name,
          code: 'missing.ingredient.iconKey',
          message: `Missing iconKey for ${ing.name}`,
        });
      }
    }
    for (const step of recipe.recipe.steps) {
      if (step.imageKey) stepKeys.add(step.imageKey);
      else {
        issues.push({
          recipeId: recipe.id,
          recipeName: recipe.name,
          code: 'missing.step.imageKey',
          message: 'Missing step imageKey',
        });
      }
    }
    if (!recipe.recommendationMessages?.length) {
      issues.push({
        recipeId: recipe.id,
        recipeName: recipe.name,
        code: 'missing.recommendationMessages',
        message: 'Missing recommendation messages',
      });
    }
    if (!recipe.tags?.length) {
      issues.push({
        recipeId: recipe.id,
        recipeName: recipe.name,
        code: 'missing.tags',
        message: 'Missing tags',
      });
    }
  }

  return {
    ok: issues.length === 0,
    recipeCount: recipes.length,
    issues,
    missingIngredientAssets: [...ingredientKeys].sort().map((k) => `assets/ingredients/${k}.png`),
    missingStepAssets: [...stepKeys].sort().map((k) => `assets/recipe-steps/${k}.jpg`),
    heroImageKeys,
  };
}
