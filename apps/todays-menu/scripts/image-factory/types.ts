/**
 * Sprint IMG-1 — HANKKI Hero Image Factory types.
 */

export type HeroImageStatus = 'completed' | 'missing';

/** STEP 1 — collected recipe fields for hero production. */
export type CollectedRecipe = {
  id: string;
  recipeTitle: string;
  category: string[];
  heroImageKey: string;
  /** Derived cooking style (no dedicated recipe field). */
  cookingStyle: string;
  mainIngredients: string[];
  recommendationTags: string[];
};

export type HeroManifestEntry = {
  recipeId: string;
  recipeName: string;
  heroImageKey: string;
  outputFilename: string;
  promptFilename: string;
  status: HeroImageStatus;
};

export type HeroFactoryValidation = {
  duplicateHeroImageKeys: Array<{ key: string; recipeIds: string[] }>;
  duplicateFilenames: Array<{ filename: string; recipeIds: string[] }>;
  missingRecipes: string[];
  missingPrompts: string[];
  missingHeroImages: string[];
  ok: boolean;
};

export type HeroFactoryManifest = {
  generatedAt: string;
  sprint: 'IMG-1';
  total: number;
  completed: number;
  missing: number;
  progressPercent: number;
  validation: HeroFactoryValidation;
  recipes: CollectedRecipe[];
  items: HeroManifestEntry[];
};
