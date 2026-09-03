/**
 * Sprint 6 — elementary recipe quality metadata (optional on Recipe).
 * Does not replace familyAudience.reviewStatus (catalog audience gate).
 */
export const CONTENT_VERIFICATION_STATUSES = ['unverified', 'reviewed', 'verified'] as const;
export type ContentVerificationStatus = (typeof CONTENT_VERIFICATION_STATUSES)[number];

export const RECIPE_QUALITY_GRADES = ['A', 'B', 'C'] as const;
export type RecipeQualityGrade = (typeof RECIPE_QUALITY_GRADES)[number];

export type ElementaryRecipeQualityMetadata = {
  /** Internal QA gate — reviewed = Sprint 6 editorial pass complete. */
  contentVerificationStatus: ContentVerificationStatus;
  targetAudience: 'elementary' | 'toddler';
  /** Internal Sprint 6.x reality QA grade — not shown in production UI. */
  recipeQualityGrade?: RecipeQualityGrade;
  /** e.g. "찬밥 또는 즉석밥 기준" */
  prerequisites?: string;
  kidAdjustmentTip?: string;
  substituteIngredients?: string;
  storageInfo?: string;
  reheatingMethod?: string;
  /** Confirmed hero image matches plated dish (editorial). */
  imageRecipeMatch?: boolean;
};
