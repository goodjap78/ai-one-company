/**
 * Sprint 46-C — compact spec → HankkiRecipeInput builder.
 */
import type { CollectionId } from '../../content/types/contentBase';
import type { HankkiRecipeInput } from '../recipeMasterTemplate';
import type { RecipeStandardMetadataOverride } from '../recipeStandardMetadataTypes';
import type { RecipeIngredient } from '../types';

type IngredientLine = {
  name: string;
  amount: string;
  iconKey: string;
};

export type Batch46CRecipeSpec = {
  id: string;
  name: string;
  category: string[];
  mealType: string[];
  time: number;
  difficulty: '쉬움' | '보통' | '어려움';
  serving: number;
  heroImageKey: string;
  tags: string[];
  situation: string[];
  aiTags: string[];
  mains: IngredientLine[];
  subs: IngredientLine[];
  seasonings: IngredientLine[];
  nutrition: { calorie: number; protein: number; carbohydrate: number; fat: number };
  steps: Array<{ title: string; instruction: string; tip: string }>;
  recommendationMessages: string[];
  recommendationReasons: string[];
  searchTags: string[];
  recommendationPriority: number;
  standardMetadata?: RecipeStandardMetadataOverride;
  collectionIds?: CollectionId[];
};

function toIngredient(
  line: IngredientLine,
  group: RecipeIngredient['group'],
  tags: string[],
): RecipeIngredient {
  return {
    name: line.name,
    amount: line.amount,
    iconKey: line.iconKey,
    group,
    tags,
  };
}

export function buildBatch46CRecipe(spec: Batch46CRecipeSpec): HankkiRecipeInput {
  const ingredients: RecipeIngredient[] = [
    ...spec.mains.map((line) => toIngredient(line, 'main', ['주재료'])),
    ...spec.subs.map((line) => toIngredient(line, 'sub', ['부재료'])),
    ...spec.seasonings.map((line) => toIngredient(line, 'seasoning', ['양념'])),
  ];

  const steps = spec.steps.map((step, index) => ({
    title: step.title,
    instruction: step.instruction,
    imageKey: `${spec.heroImageKey}_step_${String(index + 1).padStart(2, '0')}`,
    tip: step.tip,
  }));

  return {
    id: spec.id,
    name: spec.name,
    category: spec.category,
    mealType: spec.mealType,
    time: spec.time,
    difficulty: spec.difficulty,
    serving: spec.serving,
    ingredients,
    nutrition: spec.nutrition,
    tags: spec.tags,
    situation: spec.situation,
    aiTags: spec.aiTags,
    heroImageKey: spec.heroImageKey,
    recommendationMessages: spec.recommendationMessages,
    recommendationReasons: spec.recommendationReasons,
    searchTags: spec.searchTags,
    recommendationPriority: spec.recommendationPriority,
    standardMetadata: spec.standardMetadata,
    collectionIds: spec.collectionIds,
    recipe: { steps },
  };
}

export function buildBatch46CRecipes(specs: Batch46CRecipeSpec[]): HankkiRecipeInput[] {
  return specs.map(buildBatch46CRecipe);
}
