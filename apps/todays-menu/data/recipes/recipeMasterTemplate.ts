/**
 * Sprint R6.5 / R8 — HANKKI Recipe Master Template (factory).
 *
 * One path to create production recipes. Do not hand-build derived fields
 * (e.g. meal image path) outside this helper.
 *
 * Sprint R8 adds decision metadata (decisionTags, recommendationReasons,
 * searchTags, recommendationPriority). Overrides are optional on input;
 * missing values are derived so Batch 01/02 stay compatible.
 */
import { deriveRecipeStandardMetadata } from './deriveRecipeStandardMetadata';
import { deriveCollectionIds } from './deriveCollectionIds';
import { enrichDecisionMetadata } from './enrichDecisionMetadata';
import type { RecipeDecisionInput } from './decisionTypes';
import type { CollectionId } from '../content/types/contentBase';
import type { RecipeStandardMetadataOverride } from './recipeStandardMetadataTypes';
import type {
  Recipe,
  RecipeBody,
  RecipeIngredient,
  RecipeStepContent,
} from './types';

/** Input for the master template — `image` is optional (derived from heroImageKey). */
export type HankkiRecipeInput = Omit<
  Recipe,
  | 'image'
  | 'recipe'
  | 'decisionTags'
  | 'recommendationReasons'
  | 'searchTags'
  | 'recommendationPriority'
  | 'standardMetadata'
  | 'contentType'
  | 'collectionIds'
> & {
  image?: string;
  recipe: RecipeBody;
  /** Optional manual collection override (merged with auto-derived ids). */
  collectionIds?: CollectionId[];
} & RecipeDecisionInput & {
  /** Optional per-recipe override for standardized metadata derivation. */
  standardMetadata?: RecipeStandardMetadataOverride;
};

function trimMessages(messages: string[]): string[] {
  return messages.map((line) => line.trim()).filter(Boolean);
}

function normalizeIngredient(item: RecipeIngredient): RecipeIngredient {
  return {
    name: item.name.trim(),
    amount: item.amount.trim(),
    tags: [...item.tags],
    iconKey: item.iconKey.trim(),
    group: item.group,
  };
}

function normalizeStep(step: RecipeStepContent): RecipeStepContent {
  const title = (step.title?.trim() || step.guide?.trim() || '').trim();
  return {
    title,
    instruction: step.instruction.trim(),
    imageKey: step.imageKey.trim(),
    tip: step.tip.trim(),
  };
}

/**
 * Build one production Recipe from the master template.
 * Every batch recipe must go through this function.
 */
export function createHankkiRecipe(input: HankkiRecipeInput): Recipe {
  const heroImageKey = input.heroImageKey.trim();
  if (!heroImageKey) {
    throw new Error(`createHankkiRecipe: missing heroImageKey for ${input.id}`);
  }

  const recommendationMessages = trimMessages(input.recommendationMessages);
  if (recommendationMessages.length < 4 || recommendationMessages.length > 6) {
    throw new Error(
      `createHankkiRecipe(${input.id}): need 4–6 recommendationMessages (got ${recommendationMessages.length})`,
    );
  }

  const steps = input.recipe.steps.map(normalizeStep);
  if (steps.length < 4 || steps.length > 6) {
    throw new Error(
      `createHankkiRecipe(${input.id}): steps must be 4–6 (got ${steps.length})`,
    );
  }

  const decision = enrichDecisionMetadata(
    {
      id: input.id.trim(),
      name: input.name.trim(),
      mealType: input.mealType,
      time: input.time,
      difficulty: input.difficulty,
      serving: input.serving,
      tags: input.tags,
      situation: input.situation,
      aiTags: input.aiTags,
      category: input.category,
      recommendationMessages,
      nutrition: input.nutrition,
    },
    {
      decisionTags: input.decisionTags,
      recommendationReasons: input.recommendationReasons,
      searchTags: input.searchTags,
      recommendationPriority: input.recommendationPriority,
    },
  );

  if (decision.recommendationReasons.length !== 3) {
    throw new Error(
      `createHankkiRecipe(${input.id}): need exactly 3 recommendationReasons`,
    );
  }
  if (decision.searchTags.length === 0) {
    throw new Error(`createHankkiRecipe(${input.id}): need searchTags`);
  }

  const ingredients = input.ingredients.map(normalizeIngredient);
  const standardMetadata = deriveRecipeStandardMetadata(
    {
      id: input.id.trim(),
      name: input.name.trim(),
      category: input.category,
      mealType: input.mealType,
      time: input.time,
      difficulty: input.difficulty,
      serving: input.serving,
      ingredients,
      nutrition: input.nutrition,
      tags: input.tags,
      situation: input.situation,
      aiTags: input.aiTags,
      recipe: { steps },
      decisionTags: decision.decisionTags,
    },
    input.standardMetadata,
  );

  const collectionIds = deriveCollectionIds({
    standardMetadata,
    serving: input.serving,
    override: input.collectionIds,
  });

  return {
    id: input.id.trim(),
    name: input.name.trim(),
    category: [...input.category],
    mealType: [...input.mealType],
    time: input.time,
    difficulty: input.difficulty.trim(),
    serving: input.serving,
    ingredients,
    nutrition: { ...input.nutrition },
    tags: [...input.tags],
    situation: [...input.situation],
    aiTags: [...input.aiTags],
    heroImageKey,
    image: input.image?.trim() || `assets/meals/${heroImageKey}.jpg`,
    recommendationMessages,
    heroMascotMessage: input.heroMascotMessage?.trim() || undefined,
    recipe: { steps },
    decisionTags: decision.decisionTags,
    recommendationReasons: decision.recommendationReasons,
    searchTags: decision.searchTags,
    recommendationPriority: decision.recommendationPriority,
    standardMetadata,
    contentType: 'recipe',
    collectionIds,
  };
}

/** Assemble a batch array through the master template (no duplicated path logic). */
export function createHankkiRecipeBatch(inputs: HankkiRecipeInput[]): Recipe[] {
  return inputs.map(createHankkiRecipe);
}
